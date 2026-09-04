const router = require("express").Router();
const { requireLogin } = require("../middleware/requireLogin");
const chat = require("../controllers/chatController");

router.get("/chat/:taskId", requireLogin, chat.getChat);
router.post("/chat/:taskId/send", requireLogin, chat.chatUpload.single("file"), chat.postSendMessage);
router.get("/api/messages/:taskId", requireLogin, chat.getMessages);
router.post("/api/messages/:taskId/read", requireLogin, chat.postMarkRead);

module.exports = router;
