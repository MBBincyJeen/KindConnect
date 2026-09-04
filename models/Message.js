const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderName: { type: String, default: "User" },
  message: { type: String, required: true },
  fileUrl: { type: String },
  fileName: { type: String },
  // NEW: Replaces old sentiment fields
  toneFlags: [{
    type: { type: String },
    label: { type: String },
  }],
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
  // NEW: Delivery and read states
  deliveryStatus: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent",
  },
  readBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    readAt: { type: Date, default: Date.now },
  }],
  timestamp: { type: Date, default: Date.now },
});

messageSchema.index({ taskId: 1, timestamp: -1 });

module.exports = mongoose.model("Message", messageSchema);