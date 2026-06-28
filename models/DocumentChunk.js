const mongoose = require("mongoose");

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number, default: null },
    text: { type: String, required: true },
    embedding: { type: [Number], default: [] },
    characterCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

documentChunkSchema.index({ documentId: 1, chunkIndex: 1 });
documentChunkSchema.index({ userId: 1 });

module.exports = mongoose.model("DocumentChunk", documentChunkSchema);
