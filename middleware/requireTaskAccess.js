const Task = require("../models/Task");

async function requireTaskAccess(req, res, next) {
  try {
    const task = await Task.findById(req.params.taskId || req.params.id);
    if (!task) {
      if (req.accepts("html")) {
        return res.status(404).send("Task not found");
      }
      return res.status(404).json({ error: "Task not found" });
    }

    const uid = req.session.user.id;
    const isPoster = task.postedById && task.postedById.toString() === uid;
    const isTaken = task.takenById && task.takenById.toString() === uid;

    if (!isPoster && !isTaken) {
      if (req.accepts("html")) {
        return res.status(403).send("Not authorized");
      }
      return res.status(403).json({ error: "Not authorized" });
    }

    if (!task.studentAccepted) {
      if (req.accepts("html")) {
        return res.status(403).send("Not authorized");
      }
      return res.status(403).json({ error: "Not authorized" });
    }

    req.task = task;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireTaskAccess };
