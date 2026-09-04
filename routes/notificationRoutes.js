const router = require("express").Router();
const { requireLogin } = require("../middleware/requireLogin");
const notif = require("../controllers/notificationController");

router.get("/api/notifications", requireLogin, notif.getNotifications);
router.get("/api/notifications/count", requireLogin, notif.getNotificationCount);
router.post("/api/notifications/:id/read", requireLogin, notif.markNotificationRead);

module.exports = router;
