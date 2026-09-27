/**
 * Turns an uploaded NCTB PDF into searchable passages.
 *
 *   PDF → text per page → cleaned → split into ~1,000-character passages that
 *   remember their page and chapter → (if a model is available) embedded.
 *
 * Runs in the background after upload; the document's status tells the admin
 * page how far it got. Students can open the book in the library at any
 * point — reading needs only the file, not this pipeline.
 */
const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const TextbookDocument = require('../models/TextbookDocument');
const TextbookChunk = require('../models/TextbookChunk');
const provider = require('./aiProvider');

const textbookDir = path.resolve(env.TEXTBOOK_DIR);
if (!fs.existsSync(textbookDir)) fs.mkdirSync(textbookDir, { recursive: true });

let pdfjs;
function loadPdfjs() {
  // Legacy build: runs in Node without a DOM, and the fake worker it falls
  // back to is fine for a background job.
  if (!pdfjs) pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  return pdfjs;
}

// ── Text extraction ─────────────────────────────────────────────────────────

/**
 * pdf.js returns text in runs — for Bangla often a few glyphs each. Joining
 * them with a space breaks every word apart, so spacing is decided from the
 * layout instead: a space only where there's a visible gap, a newline where
 * the baseline moves.
 */
function joinItems(items) {
  let text = '';
  let prev = null;
  for (const item of items) {
    if (typeof item.str !== 'string') continue;
    const [, , , d, x, y] = item.transform;
    const size = Math.abs(d) || item.height || 10;
    if (prev) {
      if (Math.abs(y - prev.y) > size * 0.5) {
        if (!text.endsWith('\n')) text += '\n';
      } else if (x - prev.end > size * 0.2 && !text.endsWith(' ') && !item.str.startsWith(' ')) {
        text += ' ';
      }
    }
    text += item.str;
    if (item.hasEOL) text += '\n';
    prev = { y, end: x + (item.width || 0) };
  }
  return text;
}

async function extractPages(filePath) {
  const { getDocument } = loadPdfjs();
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await getDocument({
    data,
    disableFontFace: true,
    isEvalSupported: false,
    useSystemFonts: false,
    verbosity: 0
  }).promise;

  const pages = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    pages.push({ pageNumber: n, text: joinItems(content.items) });
    page.cleanup();
  }
  await pdf.destroy();
  return pages;
}

// Bangla pre-base vowel signs (ি ে ৈ) are drawn before the consonant, and some
// PDFs store them in that visual order. In correct (logical) Unicode a vowel
// sign always follows a consonant, so one that follows anything else — a
// space, the start of a line, another vowel sign — in front of a consonant
// cluster is unambiguously misplaced: move it after the cluster. A sign that
// already follows a consonant is ambiguous and left alone, not guessed at.
const CONSONANT = '[\\u0995-\\u09B9\\u09CE\\u09DC-\\u09DF]';
const CLUSTER = `${CONSONANT}\\u09BC?(?:\\u09CD${CONSONANT}\\u09BC?)*`;
const PRE_BASE = new RegExp(`(^|[^\\u0995-\\u09B9\\u09CE\\u09DC-\\u09DF\\u09BC\\u09CD])([\\u09BF\\u09C7\\u09C8])(${CLUSTER})`, 'gmu');

function cleanText(raw) {
  // Glyphs with no Unicode mapping (often Bangla conjuncts) come out as NULs.
  let text = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F�]/g, '').normalize('NFC');
  // Twice: the first pass can expose a second misplaced sign right after it.
  for (let i = 0; i < 2; i++) {
    text = text.replace(PRE_BASE, (_, before, sign, cluster) => `${before}${cluster}${sign}`);
  }
  // ে + া and ে + ৗ written as two signs → the single ো / ৌ.
  text = text.replace(/ো/g, 'ো').replace(/ৌ/g, 'ৌ');
  return text
    .replace(/[ \t ]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Is this real text, or glyph codes from an old Bijoy/SutonnyMJ font or a
 * scanned image? Legacy Bangla fonts extract as Latin-1 soup ("Aa¨vq ‡_‡K"),
 * so lots of Latin-1 symbols with little real Bangla is the tell.
 */
function assessText(pages) {
  const all = pages.map((p) => p.text).join('');
  const chars = all.replace(/\s/g, '');
  const total = chars.length;
  if (!pages.length || total < pages.length * 40) {
    return { ok: false, reason: 'Almost no text could be read — this looks like a scanned book. It needs OCR before the AI can use it.' };
  }
  const bangla = (chars.match(/[ঀ-৿]/g) || []).length;
  const latin1 = (chars.match(/[¡-ÿŒ-ƒˆ-˜–-›]/g) || []).length;
  if (bangla / total < 0.3 && latin1 / total > 0.05) {
    return { ok: false, reason: 'The text uses an old Bangla font encoding (Bijoy/SutonnyMJ), so it reads as garbled symbols. It needs converting to Unicode or OCR before the AI can use it.' };
  }
  // Unmapped glyphs arrive as NULs — usually joined letters (যুক্তবর্ণ).
  const unmapped = (all.match(/\u0000/g) || []).length;
  if (bangla && unmapped / bangla > 0.02) {
    return { ok: true, warning: `About ${Math.round((unmapped / bangla) * 100)}% of the Bangla letters (mostly joined letters) could not be read from this PDF, so some words are incomplete and AI answers may miss them. A PDF made with a Unicode font would work better.` };
  }
  return { ok: true };
}

// ── Passages ────────────────────────────────────────────────────────────────

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const BN_ORDINALS = 'প্রথম|দ্বিতীয়|তৃতীয়|চতুর্থ|পঞ্চম|ষষ্ঠ|সপ্তম|অষ্টম|নবম|দশম|একাদশ|দ্বাদশ|ত্রয়োদশ|চতুর্দশ|পঞ্চদশ';
const CHAPTER_LINE = new RegExp(
  `^\\s*(?:(?:chapter|unit|lesson)\\s+[\\w${BN_DIGITS}]+.*|(?:${BN_ORDINALS})\\s+অধ্যায়.*|অধ্যায়\\s*[${BN_DIGITS}\\d]+.*|(?:পাঠ|ইউনিট)\\s*[${BN_DIGITS}\\d]+.*)$`,
  'im'
);

function detectChapter(text) {
  const m = text.match(CHAPTER_LINE);
  return m ? m[0].trim().slice(0, 80) : null;
}

const TARGET = 1000;
const OVERLAP = 150;

/** Splits a page into passages at sentence ends (। . ? !) or line breaks. */
function splitPage(text) {
  if (text.length <= TARGET * 1.3) return [text];
  const sentences = text.split(/(?<=[।.?!])\s+|\n+/).filter(Boolean);
  const out = [];
  let current = '';
  for (const s of sentences) {
    if (current && (current + ' ' + s).length > TARGET) {
      out.push(current.trim());
      current = current.slice(-OVERLAP) + ' ' + s;
    } else {
      current = current ? `${current} ${s}` : s;
    }
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

function buildChunks(doc, pages) {
  const chunks = [];
  let chapter = null;
  for (const page of pages) {
    const text = cleanText(page.text);
    chapter = detectChapter(text) || chapter;
    if (text.replace(/\s/g, '').length < 30) continue;
    for (const content of splitPage(text)) {
      chunks.push({
        documentId: doc._id,
        classNumber: doc.classNumber,
        subjectId: doc.subjectId,
        language: doc.language,
        content,
        chapter: chapter || undefined,
        pageNumber: page.pageNumber
      });
    }
  }
  return chunks;
}

// ── Pipeline ────────────────────────────────────────────────────────────────

async function processDocument(documentId) {
  const doc = await TextbookDocument.findById(documentId);
  if (!doc || !doc.fileName) return;

  doc.status = 'PROCESSING';
  doc.textStatus = 'PENDING';
  doc.errorMessage = '';
  await doc.save();

  try {
    await TextbookChunk.deleteMany({ documentId: doc._id });

    const pages = await extractPages(path.join(textbookDir, doc.fileName));
    doc.pageCount = pages.length;

    const quality = assessText(pages);
    if (!quality.ok) {
      doc.status = 'COMPLETED';
      doc.textStatus = 'UNREADABLE';
      doc.chunkCount = 0;
      doc.embeddedCount = 0;
      doc.errorMessage = quality.reason;
      await doc.save();
      return;
    }

    const chunks = buildChunks(doc, pages);
    const notes = quality.warning ? [quality.warning] : [];

    // Embeddings are a bonus, not a requirement: without them search falls
    // back to keywords, so a missing or rejected key never fails the upload.
    let embedded = 0;
    if (provider.isConfigured() && chunks.length) {
      try {
        const vectors = await provider.embed(chunks.map((c) => c.content), 'RETRIEVAL_DOCUMENT');
        vectors.forEach((v, i) => { chunks[i].embedding = v; });
        embedded = vectors.length;
      } catch (err) {
        provider.logFailure('Embedding textbook', err);
        notes.push('Text saved, but the AI provider could not index it for smart search. Keyword search is used until you re-process it with a working API key.');
      }
    }

    for (let i = 0; i < chunks.length; i += 500) {
      await TextbookChunk.insertMany(chunks.slice(i, i + 500), { ordered: false });
    }

    doc.status = 'COMPLETED';
    doc.textStatus = 'OK';
    doc.chunkCount = chunks.length;
    doc.embeddedCount = embedded;
    doc.errorMessage = notes.join(' ');
    await doc.save();
  } catch (err) {
    console.error(`[textbooks] Processing ${doc._id} failed:`, err.message);
    doc.status = 'FAILED';
    doc.errorMessage = /password/i.test(err.message)
      ? 'This PDF is password-protected. Upload an unlocked copy.'
      : `The PDF could not be read: ${err.message}`;
    await doc.save();
  }
}

// One book at a time: a 60 MB PDF held in memory is fine, ten at once is not.
let queue = Promise.resolve();
function enqueue(documentId) {
  queue = queue.then(() => processDocument(documentId)).catch((err) => {
    console.error('[textbooks] Queue error:', err.message);
  });
  return queue;
}

/** Books left mid-processing by a server restart are picked up again. */
async function resumePending() {
  const stuck = await TextbookDocument.find({ status: 'PROCESSING', fileName: { $exists: true } }).select('_id');
  stuck.forEach((d) => enqueue(d._id));
}

module.exports = { joinItems, enqueue, processDocument, resumePending, textbookDir, cleanText, assessText };
