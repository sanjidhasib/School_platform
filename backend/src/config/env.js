require('dotenv').config();

const isProd = process.env.NODE_ENV === 'production';

// A hosted server must never run on the placeholder secret: anyone could
// forge a login token.
if (isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  console.error('JWT_SECRET must be set to a long random value (32+ characters) in production.');
  process.exit(1);
}

/** "1", "2" → hop count; "true"/"false" → boolean; empty → off. */
function parseTrustProxy(v) {
  if (v === undefined || v === '') return false;
  if (/^\d+$/.test(v)) return Number(v);
  return v === 'true';
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolos',
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  // Only set when the website and API share a parent domain (".school.edu.bd");
  // left empty, cookies belong to whichever host set them.
  // ("localhost", the old example value, means the same as empty.)
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN === 'localhost' ? '' : process.env.COOKIE_DOMAIN || '',
  // Behind a hosting proxy the visitor's IP is in X-Forwarded-For. Number of
  // proxies in front of the app: 1 on Render/Railway, 2 when the website on
  // Vercel also forwards /api.
  TRUST_PROXY: parseTrustProxy(process.env.TRUST_PROXY),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001',
  // Textbook PDFs live outside the public /uploads folder and are only served
  // through the authenticated textbook routes.
  TEXTBOOK_DIR: process.env.TEXTBOOK_DIR || './storage/textbooks',
  TEXTBOOK_MAX_MB: process.env.TEXTBOOK_MAX_MB || 200,
  // Comma-separated: the live site plus, if wanted, preview URLs.
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE_MB: process.env.MAX_FILE_SIZE_MB || 5
};

module.exports = env;
