// models/Task.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  senderName: String,
  text: String,
  file: String, // public path like /uploads/...
  createdAt: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  type: { type: String, enum: ["In-person", "Online", "Education"], default: "Online" },
  reward: { type: Number, default: 0 },
  postedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  postedByName: String,
  takenById: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  takenByName: { type: String, default: null },
  status: { type: String, default: "Not Taken" }, // Not Taken, In Progress, Completed 
  attachments: [String],
  messages: [messageSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Task", taskSchema);
