const mongoose = require("mongoose");

const chatSessionSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", required: true, unique: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  lastMessage: {
    text: { type: String, default: "" },
    senderName: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {},
  },
}, { timestamps: true });

module.exports = mongoose.model("ChatSession", chatSessionSchema);