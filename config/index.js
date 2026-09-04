const path = require("path");

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kindconnect",
  sessionSecret: process.env.SESSION_SECRET || "kindconnect_secret",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  uploadDir: path.join(__dirname, "..", "public", "uploads"),
  privateUploadDir: path.join(__dirname, "..", "uploads", "private"),
  chatMaxFileSize: 10 * 1024 * 1024,
  pdfMaxFileSize: 50 * 1024 * 1024,
  chatAllowedMimeTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
  ],
  pdfAllowedMimeTypes: ["application/pdf"],
  chatMessageLimit: 50,
  paginationLimit: 20,
  nearbyDistanceMeters: 60000,
};
