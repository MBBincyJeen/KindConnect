const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const { requireLogin } = require("../middleware/requireLogin");
const Message = require("../models/Message");
const Document = require("../models/Document");
const config = require("../config");

router.get("/files/:messageId", requireLogin, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId).lean();
    if (!message || !message.fileUrl) return res.status(404).send("File not found");

    const Task = require("../models/Task");
    const task = await Task.findById(message.taskId).lean();
    if (!task) return res.status(404).send("Task not found");

    const uid = req.session.user.id;
    const isParticipant = (task.postedById && task.postedById.toString() === uid) ||
      (task.takenById && task.takenById.toString() === uid);

    if (!isParticipant) return res.status(403).send("Access denied");

    const files = fs.readdirSync(config.privateUploadDir);
    const matchingFile = files.find(f => f.includes(message.fileName) || message.fileUrl.includes(f));
    if (!matchingFile) return res.status(404).send("File not found on disk");

    const filePath = path.join(config.privateUploadDir, matchingFile);
    res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error serving file");
  }
});

module.exports = router;
