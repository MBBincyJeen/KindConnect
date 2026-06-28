const mongoose = require("mongoose");

const pdfQuestionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", default: null },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    matchedChunks: [
      {
        chunkId: { type: mongoose.Schema.Types.ObjectId, ref: "DocumentChunk" },
        chunkIndex: Number,
        pageNumber: Number,
        text: String,
        score: Number,
      },
    ],
    confidence: { type: Number, default: 0 },
    askedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["answered", "failed"],
      default: "answered",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

pdfQuestionSchema.index({ userId: 1, documentId: 1, taskId: 1 });

module.exports = mongoose.model("PdfQuestion", pdfQuestionSchema);
