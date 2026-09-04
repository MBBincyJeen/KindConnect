const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const config = require("./index");

fs.mkdirSync(config.uploadDir, { recursive: true });
fs.mkdirSync(config.privateUploadDir, { recursive: true });

const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.privateUploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${crypto.randomUUID()}-${safeName}`);
  },
});

const certStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.uploadDir),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`);
  },
});

const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.privateUploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});

const chatUpload = multer({
  storage: chatStorage,
  limits: { fileSize: config.chatMaxFileSize },
  fileFilter: (req, file, cb) => {
    if (config.chatAllowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Allowed: ${config.chatAllowedMimeTypes.join(", ")}`));
    }
  },
});

const certUpload = multer({
  storage: certStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

const pdfUpload = multer({
  storage: pdfStorage,
  limits: { fileSize: config.pdfMaxFileSize },
  fileFilter: (req, file, cb) => {
    cb(null, config.pdfAllowedMimeTypes.includes(file.mimetype));
  },
});

module.exports = { chatUpload, certUpload, pdfUpload };
