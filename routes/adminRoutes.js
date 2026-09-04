const router = require("express").Router();
const { requireLogin } = require("../middleware/requireLogin");
const { requireRole } = require("../middleware/requireRole");
const admin = require("../controllers/adminController");
const report = require("../controllers/reportController");

router.post("/admin/clear-all", requireLogin, requireRole("Admin"), admin.clearAllData);
router.get("/api/admin/reports", requireLogin, requireRole("Admin"), report.getReports);

module.exports = router;
