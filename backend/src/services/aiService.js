/**
 * Answers a student's question from their own class's NCTB textbooks.
 *
 * 1. Find the passages that match (meaning-based search when the books are
 *    embedded, keyword search otherwise).
 * 2. If a model is available, have it answer ONLY from those passages, in the
 *    student's chosen language, at their class level, citing pages.
 * 3. If no model is available, still help: show the matching passages with
 *    their page numbers, so the student can read the answer in the book.
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

function systemPrompt({ classNumber, subjectName, language, passages }) {
  const context = passages
    .map((p, i) => `[${i + 1}] ${p.documentTitle || 'Textbook'}${p.chapter ? ` — ${p.chapter}` : ''}, page ${p.pageNumber}\n${p.content}`)
    .join('\n\n');

  return `You are the SchoolOS study helper: a patient, encouraging teacher for a Class ${classNumber} student in Bangladesh, studying ${subjectName} from the NCTB textbook.

Rules:
- Answer ONLY from the textbook passages below. If they do not contain the answer, say plainly that it isn't in this part of the textbook and suggest asking the class teacher. Never invent facts, chapters or page numbers.
- Explain at a Class ${classNumber} level: short sentences, everyday words, and one small example when it helps. For maths, show every step.
- Reply in ${language === 'BN' ? 'Bangla (বাংলা), in standard Unicode Bangla script' : 'English'}. If a passage is in the other language, translate its meaning faithfully and keep the book's technical terms (you may give the other-language term in brackets). If the student clearly asks for the other language, use that instead.
- Mention the page you used in brackets, like (p. 42) or (পৃ. ৪২).
- Keep answers focused: a short paragraph or a few numbered steps. No headings.
- Only help with studying. If asked something unrelated or unsafe, kindly steer back to the lesson.

Textbook passages:
${context}`;
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

  if (!passages.length) {
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
        history: [...history.slice(-8), { role: 'user', content: question }]
      });
      return { content, sources, sourceChunkIds: passages.map((p) => p._id), mode: 'AI' };
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

module.exports = { answerQuestion, searchTextbook, tokenize };
