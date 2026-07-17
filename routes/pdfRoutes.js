const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Document = require("../models/Document");
const DocumentChunk = require("../models/DocumentChunk");
const PdfQuestion = require("../models/PdfQuestion");
const { extractPdfText } = require("../helpers/pdfExtract");
const { chunkText } = require("../helpers/textChunker");
const { embedText } = require("../helpers/embedding");
const { searchChunks } = require("../helpers/retrieval");
const { generateAnswer } = require("../helpers/answerGenerator");

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "public", "uploads")),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
  fileFilter: (req, file, cb) => {
    const allowed = ["application/pdf"];
    cb(null, allowed.includes(file.mimetype));
  },
});

function ensureAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.redirect("/login");
}

router.get("/pdf/upload", ensureAuth, async (req, res) => {
  const documents = await Document.find({ userId: req.session.user.id }).sort({ createdAt: -1 }).lean();
  res.render("upload-pdf", { user: req.session.user, documents, message: null });
});

router.post("/pdf/upload", ensureAuth, upload.single("pdfFile"), async (req, res) => {
  let document = null;
  try {
    if (!req.file) {
      const documents = await Document.find({ userId: req.session.user.id }).sort({ createdAt: -1 }).lean();
      return res.render("upload-pdf", { user: req.session.user, documents, message: "Please upload a PDF file." });
    }

    const filePath = req.file.path;
    const pdfData = await extractPdfText(filePath);
    const pages = pdfData.pages;
    document = await Document.create({
      userId: req.session.user.id,
      originalName: req.file.originalname,
      filePath,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadDate: new Date(),
      status: "processing",
      pageCount: pdfData.pageCount,
      chunkCount: 0,
    });

    const geminiKey = process.env.GEMINI_API_KEY || "";

    const chunks = chunkText(pages);
    const chunkPromises = chunks.map(async (chunk) => {
      const embedding = await embedText(chunk.text, { provider: "gemini", apiKey: geminiKey });
      return DocumentChunk.create({
        documentId: document._id,
        userId: req.session.user.id,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        embedding,
        characterCount: chunk.characterCount,
      });
    });
    await Promise.all(chunkPromises);

    document.status = "ready";
    document.chunkCount = chunks.length;
    document.errorMessage = "";
    await document.save();

    res.redirect("/pdf/list");
  } catch (err) {
    console.error(err);
    const documents = await Document.find({ userId: req.session.user.id }).sort({ createdAt: -1 }).lean();
    if (document && document._id) {
      document.status = "failed";
      document.errorMessage = err.message;
      await document.save().catch(() => {});
    }
    res.render("upload-pdf", { user: req.session.user, documents, message: "Failed to process the PDF. Try again." });
  }
});

router.get("/pdf/list", ensureAuth, async (req, res) => {
  const documents = await Document.find({ userId: req.session.user.id }).sort({ createdAt: -1 }).lean();
  res.render("pdf-list", { user: req.session.user, documents });
});

router.get("/pdf/:id/question", ensureAuth, async (req, res) => {
  const document = await Document.findOne({ _id: req.params.id, userId: req.session.user.id }).lean();
  if (!document) return res.redirect("/pdf/list");

  const history = await PdfQuestion.find({ documentId: document._id, userId: req.session.user.id }).sort({ askedAt: -1 }).lean();
  res.render("pdf-question", { user: req.session.user, document, history, answer: null, question: "", message: null });
});

router.post("/pdf/:id/question", ensureAuth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, userId: req.session.user.id });
    if (!document) return res.redirect("/pdf/list");

    const question = req.body.question?.trim();
    if (!question) {
      const history = await PdfQuestion.find({ documentId: document._id, userId: req.session.user.id }).sort({ askedAt: -1 }).lean();
      return res.render("pdf-question", { user: req.session.user, document: document.toObject(), history, answer: null, question: "" });
    }

    const geminiKey = process.env.GEMINI_API_KEY || "";

    const queryEmbedding = await embedText(question, { provider: "gemini", apiKey: geminiKey });
    const topChunks = await searchChunks({ userId: req.session.user.id, documentId: document._id, queryEmbedding, topK: 5 });
    const contextText = topChunks.length
      ? topChunks.map((chunk) => `Page ${chunk.pageNumber}: ${chunk.text}`).join("\n\n")
      : "No document excerpts were found for this document.";

    let answer;
    let status = "answered";
    try {
      answer = await generateAnswer({ question, contextText, apiKey: geminiKey, provider: "gemini" });
    } catch (generationError) {
      console.error("Answer generation error:", generationError.message);
      answer = "Could not generate an answer from the uploaded document at this time.";
      status = "failed";
    }

    await PdfQuestion.create({
      documentId: document._id,
      userId: req.session.user.id,
      question,
      answer,
      status,
      matchedChunks: topChunks.map((chunk) => ({
        chunkId: chunk._id,
        pageNumber: chunk.pageNumber,
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
        score: chunk.score,
      })),
      askedAt: new Date(),
      confidence: topChunks.reduce((sum, chunk) => sum + (chunk.score || 0), 0) / Math.max(1, topChunks.length),
    });

    const history = await PdfQuestion.find({ documentId: document._id, userId: req.session.user.id }).sort({ askedAt: -1 }).lean();
    const message = status === "failed" ? "Could not answer the question. Your question has been saved, try again later." : null;
    res.render("pdf-question", { user: req.session.user, document: document.toObject(), history, answer, question, message });
  } catch (err) {
    console.error(err);
    const document = await Document.findOne({ _id: req.params.id, userId: req.session.user.id }).lean();
    const history = await PdfQuestion.find({ documentId: req.params.id, userId: req.session.user.id }).sort({ askedAt: -1 }).lean();
    res.render("pdf-question", { user: req.session.user, document, history, answer: null, question: "", message: "Could not answer the question. Please try again." });
  }
});

module.exports = router;
