const router = require("express").Router();
const { requireLogin } = require("../middleware/requireLogin");
const task = require("../controllers/taskController");

router.get("/add-task", requireLogin, task.getAddTask);
router.post("/add-task", requireLogin, task.postAddTask);
router.get("/recommendations/:taskId", requireLogin, task.getRecommendations);
router.post("/connect/:taskId/:teacherId", requireLogin, task.postConnect);
router.get("/offer-help", requireLogin, task.getOfferHelp);
router.post("/take-task/:id", requireLogin, task.postTakeTask);
router.post("/complete-task/:id", requireLogin, task.postCompleteTask);
router.post("/delete-task/:id", requireLogin, task.postDeleteTask);
router.post("/accept-teacher/:taskId/:teacherId", requireLogin, task.postAcceptTeacher);
router.post("/decline-teacher/:taskId", requireLogin, task.postDeclineTeacher);

const Task = require("../models/Task");
router.get("/your-tasks", requireLogin, async (req, res) => {
  try {
    const tasks = await Task.find({ takenById: req.session.user.id }).sort({ createdAt: -1 });
    res.render("your-tasks", { tasks });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading tasks");
  }
});

module.exports = router;
