const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: [
      "new_task_match",
      "task_taken",
      "new_message",
      "offer_received",
      "offer_accepted",
      "offer_declined",
    ],
    required: true,
  },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
