const Task = require("../models/Task");

const getSession = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).send("Task not found");

    const uid = req.session.user.id.toString();
    const allowed =
      (task.postedById && task.postedById.toString() === uid) ||
      (task.takenById && task.takenById.toString() === uid);

    if (!allowed || !task.studentAccepted || (task.sessionMode || "Live") !== "Live") {
      return res.status(403).send("Not authorized to access live session");
    }

    res.render("session", {
      task,
      currentUser: req.session.user,
      username: req.session.user.username,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading session");
  }
};

module.exports = { getSession };
