const router = require("express").Router();
const { requireLogin } = require("../middleware/requireLogin");
const session = require("../controllers/sessionController");

router.get("/session/:taskId", requireLogin, session.getSession);

module.exports = router;
