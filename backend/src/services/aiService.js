/**
 * Answers a student's question, with their own class's NCTB textbooks as the
 * first reference.
 *
 * 1. Find the passages that match (meaning-based search when the books are
 *    embedded, keyword search otherwise).
 * 2. If the question matches the book, the model quotes the book's own lines
 *    (with the page) and explains them; anything it adds beyond the book is
 *    marked as such.
 * 3. If the book has nothing on it, the model still answers from general
 *    knowledge, at the student's class level, clearly labelled as not from
 *    the textbook.
 * 4. With no model available, show the matching passages with their page
 *    numbers, so the student can read the answer in the book.
 */
const TextbookDocument = require('../models/TextbookDocument');
const TextbookChunk = require('../models/TextbookChunk');
const provider = require('./aiProvider');

const STOPWORDS = new Set([
  // English
  'what', 'which', 'when', 'where', 'why', 'how', 'who', 'whom', 'does', 'did', 'the', 'and', 'for', 'are',
  'was', 'were', 'is', 'am', 'be', 'been', 'this', 'that', 'these', 'those', 'with', 'from', 'about',
  'into', 'can', 'could', 'would', 'should', 'will', 'please', 'explain', 'tell', 'give', 'me', 'my',
  'you', 'your', 'our', 'its', 'it', 'of', 'in', 'on', 'to', 'a', 'an', 'or', 'do', 'mean', 'means',
  'meaning', 'define', 'describe', 'write', 'answer', 'question', 'example', 'simply', 'more', 'some',
  'again', 'summarise', 'summarize', 'summary', 'short', 'shorter', 'easier', 'easy', 'english', 'bangla',
  'bengali', 'another', 'other', 'same', 'thing', 'this', 'there', 'them', 'they', 'just', 'like',
  // Bangla
  'কী', 'কি', 'কেন', 'কীভাবে', 'কিভাবে', 'কোন', 'কোনো', 'কে', 'কাকে', 'কখন', 'কোথায়', 'এবং', 'ও', 'বা',
  'এর', 'এই', 'সেই', 'যে', 'তা', 'হয়', 'হলো', 'হল', 'করে', 'করা', 'করো', 'করুন', 'দাও', 'দিন', 'বলো',
  'বলুন', 'বুঝিয়ে', 'ব্যাখ্যা', 'আমাকে', 'আমি', 'তুমি', 'আপনি', 'একটি', 'একটা', 'থেকে', 'জন্য', 'সাথে',
  'মধ্যে', 'উদাহরণ', 'সহজ', 'সহজে', 'আরও', 'কর', 'লেখ', 'লিখ', 'অর্থ', 'বাংলায়', 'ইংরেজিতে', 'সংক্ষেপে',
  'আবার', 'আরেকটি', 'এটা', 'এটি', 'ওটা', 'বলে', 'দেখাও'
]);

function tokenize(text) {
  return Array.from(new Set(
    text
      .toLowerCase()
      .normalize('NFC')
      .split(/[^\p{L}\p{M}\p{N}]+/u)
      .filter((w) => w && !STOPWORDS.has(w) && (/[ঀ-৿]/.test(w) ? w.length >= 2 : w.length >= 3))
  )).slice(0, 12);
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

async function keywordSearch(docIds, query, limit) {
  const terms = tokenize(query);
  if (!terms.length) return [];
  const candidates = await TextbookChunk.find({
    documentId: { $in: docIds },
    $or: terms.map((t) => ({ content: { $regex: escapeRegex(t), $options: 'i' } }))
  }).limit(400).lean();
  if (!candidates.length) return [];

  // Rarer words say more about which passage is meant than common ones.
  const lowered = candidates.map((c) => c.content.toLowerCase());
  const weight = Object.fromEntries(terms.map((t) => {
    const df = lowered.filter((c) => c.includes(t)).length;
    return [t, Math.log(1 + candidates.length / (df || 1))];
  }));

  return candidates
    .map((c, i) => {
      let score = 0, matched = 0;
      for (const t of terms) {
        const hits = lowered[i].split(t).length - 1;
        if (hits) { matched++; score += weight[t] * (1 + Math.log(hits)); }
      }
      // Passages that contain more of the question's words rank first, and
      // one stray shared word out of several isn't a match at all.
      score *= matched / terms.length;
      return { chunk: c, score, matched };
    })
    .filter((r) => r.score > 0 && r.matched >= Math.max(1, Math.ceil(terms.length / 2)))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.chunk);
}

async function semanticSearch(docIds, query, limit) {
  const [queryVector] = await provider.embed([query], 'RETRIEVAL_QUERY');
  const chunks = await TextbookChunk.find({
    documentId: { $in: docIds },
    'embedding.0': { $exists: true }
  }).select('+embedding').lean();
  return chunks
    .map((c) => ({ chunk: c, score: cosine(queryVector, c.embedding) }))
    .filter((r) => r.score > 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ chunk }) => { delete chunk.embedding; return chunk; });
}

/**
 * The books a question may be answered from: this class, this subject, text
 * extracted. Only processed uploads count, so leftover demo passages from the
 * seed script (which have no book behind them) can never surface.
 */
async function booksFor(classNumber, subjectId) {
  return TextbookDocument.find({
    classNumber,
    subjectId,
    status: 'COMPLETED',
    textStatus: 'OK'
  }).select('title language embeddedCount').lean();
}

async function searchTextbook({ classNumber, subjectId, query, limit = 5 }) {
  const books = await booksFor(classNumber, subjectId);
  if (!books.length) return { books, passages: [] };
  const docIds = books.map((b) => b._id);

  let passages = [];
  if (provider.isConfigured() && books.some((b) => b.embeddedCount > 0)) {
    try {
      passages = await semanticSearch(docIds, query, limit);
    } catch (err) {
      provider.logFailure('Semantic search', err);
    }
  }
  if (!passages.length) passages = await keywordSearch(docIds, query, limit);

  const titles = Object.fromEntries(books.map((b) => [String(b._id), b]));
  passages.forEach((p) => {
    const book = titles[String(p.documentId)];
    p.documentTitle = book?.title;
    p.language = p.language || book?.language;
  });
  return { books, passages };
}

// ── Answering ───────────────────────────────────────────────────────────────

const L = (lang, en, bn) => (lang === 'BN' ? bn : en);

const BN_CLASS = { 1: 'প্রথম', 2: 'দ্বিতীয়', 3: 'তৃতীয়', 4: 'চতুর্থ', 5: 'পঞ্চম', 6: 'ষষ্ঠ', 7: 'সপ্তম', 8: 'অষ্টম', 9: 'নবম', 10: 'দশম', 11: 'একাদশ', 12: 'দ্বাদশ' };
const bnClass = (n) => BN_CLASS[n] || n;
const bnDigits = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

// The model ends its answer with this when the passages turned out not to be
// about the question, so the answer isn't shown with textbook page chips.
const NO_BOOK = '[[NO_BOOK]]';

/**
 * The chat shows answers as plain text, so markdown the model slips in anyway
 * would show up as stray asterisks. Keep the words, drop the symbols.
 */
function plainText(text) {
  return text
    .replace(NO_BOOK, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(^|[^\w*])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1$2')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[*-]\s+/gm, '• ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[ \t]+$/gm, '')
    .trim();
}

/**
 * Pages the answer actually cites — "(page 49)", "(p. 49)", "(পৃ. ৪৯)",
 * "পৃষ্ঠা ৪৯" — so the chips under it point only at pages it used, not at
 * every passage the search turned up.
 */
function citedPages(text) {
  const pages = new Set();
  const western = (d) => d.replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c));
  const re = /(?:\bpages?|\bp\.|পৃষ্ঠা|পৃ\.)\s*([0-9০-৯]+)/giu;
  let m;
  while ((m = re.exec(text))) pages.add(Number(western(m[1])));
  return pages;
}

function commonRules({ classNumber, language }) {
  return `- Explain at a Class ${classNumber} level: short sentences, everyday words, and one small example when it helps. For maths, show every step and check the final answer.
- Reply in ${language === 'BN' ? 'Bangla (বাংলা), in standard Unicode Bangla script' : 'English'}. If the student clearly asks for the other language, use that instead.
- Keep answers focused: a short paragraph or a few numbered steps. No headings.
- Plain text only: no markdown (no **, *, #, or backticks). Use "1." for steps and "•" for lists.
- Be accurate. If you are not sure of a fact, say so rather than guess.
- You may help with any school subject, general knowledge, writing, or study skills. Politely refuse anything unsafe or not suitable for a school student.`;
}

function systemPrompt({ classNumber, subjectName, language, passages }) {
  const context = passages
    .map((p, i) => `[${i + 1}] ${p.documentTitle || 'Textbook'}${p.chapter ? ` — ${p.chapter}` : ''}, page ${p.pageNumber}\n${p.content}`)
    .join('\n\n');

  return `You are the SchoolOS study helper: a patient, encouraging teacher for a Class ${classNumber} student in Bangladesh. The current subject is ${subjectName}, from the NCTB textbook.

How to use the textbook passages below:
- If they answer the question (or match a question from the book), the textbook is your main reference. Start with the book's own words: quote the relevant line or two, translated faithfully if the passage is in the other language, with the page in brackets, like (p. 42) or (পৃ. ৪২). Then explain it simply.
- Keep the book's technical terms; you may give the other-language term in brackets.
- If the passages only partly answer it, use them for that part, then complete the answer from your own knowledge and say clearly which part goes beyond the textbook (for example "Beyond the textbook:" / "পাঠ্যবইয়ের বাইরে:").
- If the passages are not really about the question, ignore them, answer from your own knowledge, do not mention pages, and end your reply with the exact text ${NO_BOOK}
- Cite only the page number in each passage's header line ("page 49"), never a number printed inside the passage text, so the citation matches the page the student can open.
- Never invent page numbers or claim something is in the book when it isn't.

Other rules:
${commonRules({ classNumber, language })}

Textbook passages:
${context}`;
}

function generalPrompt({ classNumber, subjectName, language, hasBook }) {
  return `You are the SchoolOS study helper: a patient, encouraging teacher for a Class ${classNumber} student in Bangladesh. The current subject is ${subjectName}.

${hasBook
    ? "This question was not found in the student's NCTB textbook, so answer from your own knowledge."
    : "The student's NCTB textbook for this subject has not been added yet, so answer from your own knowledge."} Follow the Bangladesh NCTB curriculum's terms and methods where they apply. Do not mention page numbers or claim the answer comes from the textbook.

Rules:
${commonRules({ classNumber, language })}`;
}

function passagesAnswer(language, passages) {
  const intro = L(language,
    'The AI tutor isn’t switched on yet, so here are the parts of your textbook that match your question:',
    'এআই সহায়ক এখনো চালু হয়নি, তাই তোমার প্রশ্নের সাথে মেলে এমন পাঠ্যবইয়ের অংশগুলো দেখানো হলো:');
  const body = passages.slice(0, 3).map((p) => {
    const where = `${p.documentTitle || ''}${p.chapter ? ` · ${p.chapter}` : ''} · ${L(language, `page ${p.pageNumber}`, `পৃষ্ঠা ${bnDigits(p.pageNumber)}`)}`;
    // PDF line breaks fall mid-sentence; read as one flowing paragraph.
    const flat = p.content.replace(/\s*\n\s*/g, ' ').trim();
    const excerpt = flat.length > 600 ? `${flat.slice(0, 600).trim()}…` : flat;
    return `${where}\n${excerpt}`;
  }).join('\n\n');
  return `${intro}\n\n${body}`;
}

/**
 * history: earlier messages of this chat, oldest first (not including the
 * new question).
 */
async function answerQuestion({ classNumber, subjectId, subjectName, subjectNameBn, language, question, history = [] }) {
  // Follow-ups like "give me an example" carry no topic words of their own;
  // those search with the previous topical question so they still find the
  // lesson. A new question with its own topic stands alone — otherwise an
  // unrelated question would inherit the last topic's passages.
  const topical = [...history].reverse().find((m) => m.role === 'user' && tokenize(m.content).length)?.content;
  const query = !tokenize(question).length && topical ? `${topical} ${question}` : question;

  const { books, passages } = await searchTextbook({ classNumber, subjectId, query });

  const sources = passages.map((p) => ({
    documentId: p.documentId,
    documentTitle: p.documentTitle,
    language: p.language,
    chapter: p.chapter,
    pageNumber: p.pageNumber,
    excerpt: p.content.slice(0, 280)
  }));

  const turn = [...history.slice(-8), { role: 'user', content: question }];

  if (!passages.length) {
    if (provider.isConfigured()) {
      try {
        const content = await provider.generate({
          system: generalPrompt({ classNumber, subjectName, language, hasBook: books.length > 0 }),
          history: turn
        });
        return { content: plainText(content), sources: [], sourceChunkIds: [], mode: 'GENERAL' };
      } catch (err) {
        provider.logFailure('General answer', err);
      }
    }
    const content = !books.length
      ? L(language,
          `Your Class ${classNumber} ${subjectName} textbook hasn’t been added to SchoolOS yet, so I can’t answer from it. Please ask your teacher, and check back once the school uploads the book.`,
          `তোমার ${bnClass(classNumber)} শ্রেণির ${subjectNameBn || subjectName} পাঠ্যবইটি এখনো SchoolOS-এ যোগ করা হয়নি, তাই বই থেকে উত্তর দিতে পারছি না। আপাতত তোমার শিক্ষককে জিজ্ঞেস করো।`)
      : L(language,
          `I couldn’t find this in your Class ${classNumber} ${subjectName} textbook. Try asking with words the book uses, or ask your teacher.`,
          `তোমার ${bnClass(classNumber)} শ্রেণির ${subjectNameBn || subjectName} পাঠ্যবইয়ে এটি খুঁজে পাইনি। বইয়ে ব্যবহৃত শব্দ দিয়ে আবার জিজ্ঞেস করো, অথবা শিক্ষককে জিজ্ঞেস করো।`);
    return { content, sources: [], sourceChunkIds: [], mode: 'NOT_FOUND' };
  }

  if (provider.isConfigured()) {
    try {
      const content = await provider.generate({
        system: systemPrompt({ classNumber, subjectName, language, passages }),
        history: turn
      });
      // The passages weren't about this question: a general answer, no page chips.
      if (content.includes(NO_BOOK)) {
        return { content: plainText(content), sources: [], sourceChunkIds: [], mode: 'GENERAL' };
      }
      const cited = citedPages(content);
      const used = cited.size ? passages.filter((p) => cited.has(p.pageNumber)) : passages;
      const keep = used.length ? used : passages;
      return {
        content: plainText(content),
        sources: sources.filter((s) => keep.some((p) => p.pageNumber === s.pageNumber && String(p.documentId) === String(s.documentId))),
        sourceChunkIds: keep.map((p) => p._id),
        mode: 'AI'
      };
    } catch (err) {
      provider.logFailure('Answer generation', err);
    }
  }

  return {
    content: passagesAnswer(language, passages),
    sources,
    sourceChunkIds: passages.map((p) => p._id),
    mode: 'PASSAGES'
  };
}

module.exports = { answerQuestion, searchTextbook, tokenize, plainText, citedPages };
