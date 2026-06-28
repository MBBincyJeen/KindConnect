const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    originalName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["uploaded", "processing", "indexed", "ready", "failed"],
      default: "uploaded",
    },
    chunkCount: { type: Number, default: 0 },
    pageCount: { type: Number, default: 0 },
    errorMessage: { type: String, default: "" },
  },
  { timestamps: true }
);

documentSchema.index({ userId: 1, taskId: 1 });

module.exports = mongoose.model("Document", documentSchema);
