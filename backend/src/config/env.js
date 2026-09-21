require('dotenv').config();

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/schoolos',
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  MAX_FILE_SIZE_MB: process.env.MAX_FILE_SIZE_MB || 5
};

module.exports = env;
