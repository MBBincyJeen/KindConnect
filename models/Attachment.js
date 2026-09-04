const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
  originalName: { type: String, required: true },
  storedPath: { type: String, required: true },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  scanStatus: {
    type: String,
    enum: ["pending", "clean", "flagged"],
    default: "pending",
  },
}, { timestamps: true });

attachmentSchema.index({ uploaderId: 1 });
attachmentSchema.index({ messageId: 1 });

module.exports = mongoose.model("Attachment", attachmentSchema);