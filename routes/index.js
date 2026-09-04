const router = require("express").Router();

router.use(require("./authRoutes"));
router.use(require("./dashboardRoutes"));
router.use(require("./taskRoutes"));
router.use(require("./chatRoutes"));
router.use(require("./profileRoutes"));
router.use(require("./notificationRoutes"));
router.use(require("./pdfRoutes"));
router.use(require("./sessionRoutes"));
router.use(require("./adminRoutes"));
router.use(require("./reportRoutes"));
router.use(require("./fileRoutes"));

module.exports = router;
