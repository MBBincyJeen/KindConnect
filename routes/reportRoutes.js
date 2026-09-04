const router = require("express").Router();
const { requireLogin } = require("../middleware/requireLogin");
const report = require("../controllers/reportController");

router.post("/api/report", requireLogin, report.createReport);
router.post("/api/block/:userId", requireLogin, report.blockUser);
router.post("/api/unblock/:userId", requireLogin, report.unblockUser);
router.get("/api/blocked", requireLogin, report.getBlockedUsers);

module.exports = router;
