const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderName: { type: String, default: "User" },
  message: { type: String, required: true },
  fileUrl: { type: String },
  fileName: { type: String },
  sentiment: {
    type: String,
    enum: ["positive", "neutral", "negative"],
    default: "neutral",
  },
  sentimentConfidence: { type: String, default: "0.75" },
  sentimentExplanation: { type: String, default: "Neutral tone detected." },
  docAnalysis: {
    fileType: String,
    wordCount: Number,
    summary: String,
    keywords: [String],
    fileSizeKB: Number,
    confidence: String,
    aiSummary: String,
    safetyCheck: {
      isSafe: mongoose.Schema.Types.Mixed,
      status: String,
      reasons: [String],
      checkedAt: Date,
    },
  },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Message", messageSchema);
