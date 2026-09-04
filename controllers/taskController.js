const mongoose = require("mongoose");
const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Message = require("../models/Message");
const { checkTutoringRequestSafety } = require("../services/contentSafetyService");
const { generateTaskSummary } = require("../services/taskSummaryService");
const { buildStudentTutorEvaluation } = require("../services/ratingService");

const subjects = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi",
  "Social Studies", "Computer Science", "Economics", "Accountancy",
  "Business Studies", "History", "Geography", "Political Science", "Other",
];
const educationLevels = [
  "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th", "UG", "PG", "PhD",
];

function compactWhitespace(str) {
  return (str || "").replace(/\s+/g, " ").trim();
}

const getAddTask = (req, res) => {
  if (req.session.user.role === "Teacher") return res.status(403).send("Teachers cannot post tasks.");
  res.render("add-task", { subjects, educationLevels, error: null, values: {} });
};

const postAddTask = async (req, res) => {
  try {
    if (req.session.user.role === "Teacher") return res.status(403).send("Teachers cannot post tasks.");
    const { title, description, subject, educationLevel, preferredGender, sessionMode, duration } = req.body;
    const aiSafetyCheck = checkTutoringRequestSafety({ title, description });
    if (!aiSafetyCheck.isSafe) {
      return res.status(400).render("add-task", { subjects, educationLevels, error: `This request cannot be published yet: ${aiSafetyCheck.reasons.join(", ")}.`, values: req.body });
    }
    const aiSummary = generateTaskSummary({ subject, educationLevel, sessionMode: sessionMode || "Live", duration, description });
    const t = new Task({
      title, description, subject, educationLevel,
      duration: compactWhitespace(duration), preferredGender: preferredGender || "Any",
      sessionMode: sessionMode || "Live",
      postedById: req.session.user.id, postedByName: req.session.user.username,
      postedByRole: req.session.user.role, aiSummary, aiSafetyCheck,
    });
    await t.save();
    const teacherQuery = { role: "Teacher", educationLevel, subjects: subject };
    if (preferredGender && preferredGender !== "Any") teacherQuery.gender = preferredGender;
    const matchedTeachers = await User.find(teacherQuery);
    const io = req.app.get("io");
    for (const teacher of matchedTeachers) {
      const notif = new Notification({
        recipientId: teacher._id, type: "new_task_match", taskId: t._id,
        message: `New matching request: "${title}" by student ${req.session.user.username}`,
      });
      await notif.save();
      io.to(teacher._id.toString()).emit("newNotification", {
        id: notif._id, message: notif.message, taskId: t._id.toString(), createdAt: notif.createdAt,
      });
    }
    res.redirect(`/recommendations/${t._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error posting task");
  }
};

const getRecommendations = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).send("Task not found");
    const teacherQuery = { role: "Teacher", educationLevel: task.educationLevel, subjects: task.subject };
    if (task.preferredGender && task.preferredGender !== "Any") teacherQuery.gender = task.preferredGender;
    const teachers = await User.find(teacherQuery);
    res.render("recommendations", { task, teachers });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading recommendations");
  }
};

const postConnect = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).send("Task not found");
    const teacher = await User.findById(req.params.teacherId);
    if (!teacher) return res.status(404).send("Teacher not found");
    task.takenById = teacher._id; task.takenByName = teacher.username;
    task.takenByRole = teacher.role; task.status = "In Progress"; task.studentAccepted = true;
    await task.save();
    const io = req.app.get("io");
    const notif = new Notification({
      recipientId: teacher._id, type: "task_taken", taskId: task._id,
      message: `Student ${req.session.user.username} connected with you for request: "${task.title}"`,
    });
    await notif.save();
    io.to(teacher._id.toString()).emit("newNotification", {
      id: notif._id, message: notif.message, taskId: task._id.toString(), createdAt: notif.createdAt,
    });
    res.redirect(`/chat/${task._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error connecting with teacher");
  }
};

const getOfferHelp = async (req, res) => {
  try {
    const me = await User.findById(req.session.user.id).lean();
    const hasLocation = Array.isArray(me?.location?.coordinates) && me.location.coordinates.length === 2 && typeof me.location.coordinates[0] === "number" && typeof me.location.coordinates[1] === "number";
    if (!hasLocation) {
      const tasks = await Task.find({ postedById: { $ne: req.session.user.id }, status: { $in: ["Not Taken", "In Progress"] } }).sort({ createdAt: -1 }).limit(50).lean();
      return res.render("offer-help", { tasks, locationMissing: true, currentUser: req.session.user });
    }
    const [lng, lat] = me.location.coordinates;
    const nearbyUsers = await User.find({ _id: { $ne: req.session.user.id }, location: { $nearSphere: { $geometry: { type: "Point", coordinates: [lng, lat] }, $maxDistance: 60000 } } }).select("_id");
    const nearbyUserIds = nearbyUsers.map((u) => u._id);
    const tasks = await Task.find({ postedById: { $in: nearbyUserIds }, status: { $in: ["Not Taken", "In Progress"] } }).sort({ createdAt: -1 }).limit(50).lean();
    res.render("offer-help", { tasks, locationMissing: false, currentUser: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading nearby tasks");
  }
};

const postTakeTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send("Task not found");
    if (task.postedById && task.postedById.toString() === req.session.user.id) return res.status(403).send("Cannot take your own task");
    if (task.status !== "Not Taken") return res.redirect("/offer-help");
    if (task.interestedTeachers.includes(req.session.user.id)) return res.status(400).send("You have already offered support for this task");
    task.interestedTeachers.push(req.session.user.id);
    await task.save();
    const io = req.app.get("io");
    const notif = new Notification({
      recipientId: task.postedById, type: "offer_received", taskId: task._id,
      message: `Teacher ${req.session.user.username} offered tutoring support for: "${task.title}"`,
    });
    await notif.save();
    io.to(task.postedById.toString()).emit("newNotification", {
      id: notif._id, message: notif.message, taskId: task._id.toString(), createdAt: notif.createdAt,
    });
    res.redirect("/your-tasks");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error taking task");
  }
};

const postCompleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send("Task not found");
    if (task.postedById.toString() !== req.session.user.id) return res.status(403).send("Unauthorized");
    const tutorEvaluation = buildStudentTutorEvaluation(task, req.body);
    if (tutorEvaluation === null) return res.status(400).send("Please rate the tutor from 1 to 5 before marking this request complete.");
    task.status = "Completed"; task.aiTutorEvaluation = tutorEvaluation;
    await task.save();
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error marking task completed");
  }
};

const postDeleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send("Task not found");
    if (task.postedById.toString() !== req.session.user.id) return res.status(403).send("Unauthorized deletion");
    await Message.deleteMany({ taskId: task._id });
    await Task.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting task");
  }
};

const postAcceptTeacher = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).send("Task not found");
    if (task.postedById.toString() !== req.session.user.id) return res.status(403).send("Only the task poster can accept the connection");
    const teacher = await User.findById(req.params.teacherId);
    if (!teacher) return res.status(404).send("Teacher not found");
    task.takenById = teacher._id; task.takenByName = teacher.username;
    task.takenByRole = teacher.role; task.studentAccepted = true; task.status = "In Progress";
    const otherTeachers = task.interestedTeachers.filter(id => id.toString() !== teacher._id.toString());
    task.interestedTeachers = [];
    await task.save();
    const io = req.app.get("io");
    const notif = new Notification({
      recipientId: teacher._id, type: "offer_accepted", taskId: task._id,
      message: `Student ${req.session.user.username} accepted your tutoring offer for "${task.title}"`,
    });
    await notif.save();
    io.to(teacher._id.toString()).emit("newNotification", { id: notif._id, message: notif.message, taskId: task._id.toString(), createdAt: notif.createdAt });
    for (const otherTeacherId of otherTeachers) {
      const otherNotif = new Notification({
        recipientId: otherTeacherId, type: "offer_rejected", taskId: task._id,
        message: `The task "${task.title}" was allocated to another teacher.`,
      });
      await otherNotif.save();
      io.to(otherTeacherId.toString()).emit("newNotification", { id: otherNotif._id, message: otherNotif.message, taskId: task._id.toString(), createdAt: otherNotif.createdAt });
    }
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error accepting teacher");
  }
};

const postDeclineTeacher = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).send("Task not found");
    if (task.postedById.toString() !== req.session.user.id) return res.status(403).send("Only the task poster can decline the connection");
    const previousTeacherId = task.takenById;
    task.takenById = null; task.takenByName = null; task.takenByRole = null;
    task.status = "Not Taken"; task.studentAccepted = false;
    await task.save();
    const io = req.app.get("io");
    if (previousTeacherId) {
      const notif = new Notification({
        recipientId: previousTeacherId, type: "offer_declined", taskId: task._id,
        message: `Student ${req.session.user.username} declined your tutoring offer for "${task.title}"`,
      });
      await notif.save();
      io.to(previousTeacherId.toString()).emit("newNotification", { id: notif._id, message: notif.message, taskId: task._id.toString(), createdAt: notif.createdAt });
    }
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error declining teacher");
  }
};

module.exports = {
  getAddTask,
  postAddTask,
  getRecommendations,
  postConnect,
  getOfferHelp,
  postTakeTask,
  postCompleteTask,
  postDeleteTask,
  postAcceptTeacher,
  postDeclineTeacher,
};
