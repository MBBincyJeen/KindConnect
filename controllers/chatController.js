const Message = require("../models/Message");
const Task = require("../models/Task");
const ChatSession = require("../models/ChatSession");
const { detectToneFlags } = require("../services/sentimentService");
const { analyzeDocument } = require("../services/documentAnalysisService");
const { chatUpload } = require("../config/multer");
const config = require("../config/index");

async function getChat(req, res) {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).send("Task not found");

    const uid = req.session.user.id;
    const allowed =
      (task.postedById && task.postedById.toString() === uid) ||
      (task.takenById && task.takenById.toString() === uid);
    if (!allowed || !task.studentAccepted)
      return res.status(403).send("Not authorized");

    const totalMessages = await Message.countDocuments({ taskId: task._id });

    const messages = await Message.find({ taskId: task._id })
      .sort({ timestamp: -1 })
      .limit(config.chatMessageLimit)
      .lean();

    messages.reverse();

    const hasMore = totalMessages > config.chatMessageLimit;

    res.render("chat", {
      task,
      username: req.session.user.username,
      messages,
      currentUserId: uid,
      hasMore,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading chat");
  }
}

async function postSendMessage(req, res) {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    const uid = req.session.user.id;
    const allowed =
      task.postedById.toString() === uid ||
      (task.takenById && task.takenById.toString() === uid);
    if (!allowed || !task.studentAccepted)
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    const text = (req.body.text || "").trim();
    if (!text && !req.file)
      return res
        .status(400)
        .json({ success: false, message: "Message or file required" });

    let fileUrl, fileName;
    if (req.file) {
      fileUrl = "/files/" + req.file.filename;
      fileName = req.file.originalname;
    }

    const toneFlags = detectToneFlags(text || fileName || "");

    let docAnalysis;
    if (req.file) {
      docAnalysis = await analyzeDocument(
        req.file.path,
        req.file.originalname,
        req.file.mimetype
      );
    }

    const messageDoc = await Message.create({
      taskId: task._id,
      sender: uid,
      senderName: req.session.user.username,
      message: text || `📎 Attached file: ${fileName}`,
      fileUrl,
      fileName,
      sentiment: toneFlags.length > 0 ? toneFlags[0].type : "neutral",
      sentimentConfidence: toneFlags.length > 0 ? "0.80" : "0.75",
      sentimentExplanation:
        toneFlags.length > 0
          ? toneFlags.map((f) => f.label).join(", ")
          : "Neutral tone detected.",
      docAnalysis,
      deliveryStatus: "sent",
      readBy: [],
      timestamp: new Date(),
    });

    const payload = {
      _id: messageDoc._id,
      taskId: task._id.toString(),
      senderId: uid,
      senderName: req.session.user.username,
      text: messageDoc.message,
      fileUrl,
      fileName,
      sentiment: messageDoc.sentiment,
      sentimentConfidence: messageDoc.sentimentConfidence,
      sentimentExplanation: messageDoc.sentimentExplanation,
      docAnalysis: messageDoc.docAnalysis,
      deliveryStatus: "sent",
      createdAt: messageDoc.timestamp,
    };

    const io = req.app.get("io");
    if (io) {
      io.to(task._id.toString()).emit("newMessage", payload);
    }

    await ChatSession.findOneAndUpdate(
      { taskId: task._id },
      {
        lastMessage: {
          text: messageDoc.message,
          sender: uid,
          senderName: req.session.user.username,
          timestamp: messageDoc.timestamp,
        },
        $inc: {
          [`unreadCounts.${task.postedById}`]:
            task.postedById.toString() === uid ? 0 : 1,
          [`unreadCounts.${task.takenById}`]:
            task.takenById && task.takenById.toString() === uid ? 0 : 1,
        },
      },
      { upsert: true }
    );

    return res.json({ success: true, message: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error sending message" });
  }
}

async function getMessages(req, res) {
  try {
    const { taskId } = req.params;
    const { before, limit } = req.query;
    const queryLimit = Math.min(
      parseInt(limit, 10) || config.paginationLimit,
      config.paginationLimit
    );

    const query = { taskId };
    if (before) {
      const beforeMsg = await Message.findById(before).lean();
      if (beforeMsg) {
        query.timestamp = { $lt: beforeMsg.timestamp };
      }
    }

    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(queryLimit + 1)
      .lean();

    const hasMore = messages.length > queryLimit;
    if (hasMore) messages.pop();

    messages.reverse();

    return res.json({ messages, hasMore });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ messages: [], hasMore: false, error: "Failed to load messages" });
  }
}

async function postMarkRead(req, res) {
  try {
    const { taskId } = req.params;
    const uid = req.session.user.id;

    const result = await Message.updateMany(
      {
        taskId,
        sender: { $ne: uid },
        readBy: { $ne: uid },
      },
      { $addToSet: { readBy: uid } }
    );

    if (result.modifiedCount > 0) {
      await ChatSession.findOneAndUpdate(
        { taskId },
        { $set: { [`unreadCounts.${uid}`]: 0 } }
      );
    }

    const io = req.app.get("io");
    if (io) {
      io.to(taskId).emit("messagesRead", {
        readerId: uid,
        taskId,
        readAt: new Date(),
      });
    }

    return res.json({ success: true, markedRead: result.modifiedCount });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to mark messages as read" });
  }
}

module.exports = {
  getChat,
  postSendMessage,
  getMessages,
  postMarkRead,
  chatUpload,
};
