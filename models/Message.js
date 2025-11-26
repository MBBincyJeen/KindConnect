const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    message: String,
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);
