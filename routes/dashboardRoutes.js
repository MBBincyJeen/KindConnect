const router = require("express").Router();
const { requireLogin } = require("../middleware/requireLogin");
const dashboard = require("../controllers/dashboardController");

router.get("/dashboard", requireLogin, dashboard.getDashboard);

module.exports = router;
