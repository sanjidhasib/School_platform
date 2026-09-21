const multer = require("multer");
const path = require("path");
const fs = require("fs");
const env = require("../config/env");

const uploadDir = path.resolve(env.UPLOAD_DIR || "./uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});

const maxBytes = (Number(env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  const allowed = /pdf|doc|docx|txt|jpg|jpeg|png|gif|webp|csv|xlsx|xls|json|md/;
  const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = allowed.test(file.mimetype.toLowerCase().split("/").pop());
  if (extOk || mimeOk) return cb(null, true);
  cb(new Error("File type not allowed"));
};

const upload = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter,
});

module.exports = { upload, uploadDir };
