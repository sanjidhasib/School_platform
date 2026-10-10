/**
 * The school's pictures on the website: the logo, and the homepage carousel
 * slides. Files live in UPLOAD_DIR/branding and are served from /uploads.
 */
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const env = require('../../config/env');
const SchoolSettings = require('../../models/SchoolSettings');
const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');

const SLIDES = 5;
const dir = path.resolve(env.UPLOAD_DIR || './uploads', 'branding');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

exports.upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => cb(null, `brand-${Date.now()}-${Math.round(Math.random() * 1e9)}${TYPES[file.mimetype] || ''}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  // Raster images only: an SVG could carry script.
  fileFilter: (req, file, cb) =>
    TYPES[file.mimetype] ? cb(null, true) : cb(new ApiError(400, 'Use a JPG, PNG or WebP image'))
}).single('file');

/** "logo" or "slide-0" … "slide-4" */
function parseTarget(target) {
  if (target === 'logo') return { kind: 'logo' };
  const m = /^slide-(\d)$/.exec(String(target || ''));
  if (m && Number(m[1]) < SLIDES) return { kind: 'slide', index: Number(m[1]) };
  throw new ApiError(400, 'Choose the logo or a carousel slide');
}

// Only files this feature wrote are ever deleted.
function removeOld(url) {
  if (!url || !url.startsWith('/uploads/branding/')) return;
  fs.promises.unlink(path.join(dir, path.basename(url))).catch(() => {});
}

async function settingsDoc() {
  const s = await SchoolSettings.findOne();
  if (!s) throw new ApiError(404, 'School settings not found');
  return s;
}

exports.set = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'Choose an image to upload');
  let target;
  try {
    target = parseTarget(req.body.target);
  } catch (err) {
    fs.promises.unlink(req.file.path).catch(() => {});
    throw err;
  }
  const url = `/uploads/branding/${req.file.filename}`;
  const settings = await settingsDoc();
  if (target.kind === 'logo') {
    removeOld(settings.logoUrl);
    settings.logoUrl = url;
  } else {
    const images = [...(settings.carouselImages || [])];
    while (images.length < SLIDES) images.push('');
    removeOld(images[target.index]);
    images[target.index] = url;
    settings.carouselImages = images;
  }
  await settings.save();
  res.json({ success: true, data: { logoUrl: settings.logoUrl, carouselImages: settings.carouselImages } });
});

/** Back to the built-in picture (or no logo). */
exports.reset = asyncHandler(async (req, res) => {
  const target = parseTarget(req.params.target);
  const settings = await settingsDoc();
  if (target.kind === 'logo') {
    removeOld(settings.logoUrl);
    settings.logoUrl = '';
  } else {
    const images = [...(settings.carouselImages || [])];
    removeOld(images[target.index]);
    if (target.index < images.length) images[target.index] = '';
    settings.carouselImages = images;
  }
  await settings.save();
  res.json({ success: true, data: { logoUrl: settings.logoUrl, carouselImages: settings.carouselImages } });
});
