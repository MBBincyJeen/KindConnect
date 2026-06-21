require("dotenv").config();
const path = require("path");
const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const multer = require("multer");

const User = require("./models/User");
const Task = require("./models/Task");

const app = express();
const PORT = process.env.PORT || 3000;

// --- multer upload setup ---
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const name = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, name);
  },
});
const upload = multer({ storage });

// --- middleware ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "kindconnect_secret",
    resave: false,
    saveUninitialized: false,
  })
);

// make current user available in views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// --- DB connect ---
mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kindconnect", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error", err));

// --- Auth middleware ---
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// Home
app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.redirect("/login");
});

// Register
app.get("/register", (req, res) => res.render("register", { error: null }));

app.post("/register", async (req, res) => {
  try {
    const { username, password, location } = req.body;
    if (!username || !password || !location) {
      return res.render("register", { error: "Fill all fields" });
    }

    const exist = await User.findOne({ username });
    if (exist) return res.render("register", { error: "Username already taken" });

    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hash, location });
    await user.save();
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("register", { error: "Registration failed" });
  }
});

// Login
app.get("/login", (req, res) => res.render("login", { error: null }));

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.render("login", { error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.render("login", { error: "Invalid credentials" });

    req.session.user = {
      id: user._id.toString(),  // always store as plain string
      username: user.username,
      location: user.location,
    };
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.render("login", { error: "Login failed" });
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

// Dashboard - tasks posted by current user with profile info
app.get("/dashboard", requireLogin, async (req, res) => {
  const user = await User.findById(req.session.user.id);
  const posted = await Task.find({ postedById: req.session.user.id }).sort({
    createdAt: -1,
  });
  const recentOthers = await Task.find({
    postedById: { $ne: req.session.user.id },
  })
    .sort({ createdAt: -1 })
    .limit(5);
  res.render("dashboard", {
    posted,
    recentOthers,
    username: user.username,
    location: user.location,
  });
});

// Add Task - form
app.get("/add-task", requireLogin, (req, res) => {
  const categories = [
    "Cleaning",
    "Shopping",
    "Tutoring",
    "Technical Help",
    "Health",
    "Other",
  ];
  res.render("add-task", { categories });
});

// Add Task - handle post with optional attachments
app.post(
  "/add-task",
  requireLogin,
  upload.array("attachments", 5),
  async (req, res) => {
    try {
      const { title, description, category, type, reward } = req.body;
      const files = (req.files || []).map((f) => "/uploads/" + f.filename);

      const t = new Task({
        title,
        description,
        category,
        type,
        reward: reward ? Number(reward) : 0,
        postedById: req.session.user.id,
        postedByName: req.session.user.username,
        attachments: files,
      });
      await t.save();
      res.redirect("/dashboard");
    } catch (err) {
      console.error(err);
      res.send("Error posting task");
    }
  }
);

// Offer Help - tasks not posted by current user
app.get("/offer-help", requireLogin, async (req, res) => {
  const tasks = await Task.find({
    postedById: { $ne: req.session.user.id },
    status: { $in: ["Not Taken", "In Progress"] },
  }).sort({ createdAt: -1 });
  res.render("offer-help", { tasks });
});

// Take Task - accept task (POST)
app.post("/take-task/:id", requireLogin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send("Task not found");

    if (
      task.postedById &&
      task.postedById.toString() === req.session.user.id
    ) {
      return res.status(403).send("Cannot take your own task");
    }

    if (task.status === "In Progress" && task.takenById) {
      return res.redirect("/offer-help");
    }

    if (task.status === "Completed") {
      return res.redirect("/offer-help");
    }

    task.takenById = req.session.user.id;
    task.takenByName = req.session.user.username;
    task.status = "In Progress";
    await task.save();
    res.redirect("/your-tasks");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error taking task");
  }
});

// Your Tasks - tasks current user accepted
app.get("/your-tasks", requireLogin, async (req, res) => {
  const tasks = await Task.find({ takenById: req.session.user.id }).sort({
    createdAt: -1,
  });
  res.render("your-tasks", { tasks });
});

// Chat - only poster or taker can view/post
app.get("/chat/:taskId", requireLogin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).send("Task not found");

    const uid = req.session.user.id.toString();
    const allowed =
      (task.postedById && task.postedById.toString() === uid) ||
      (task.takenById && task.takenById.toString() === uid);
    if (!allowed) return res.status(403).send("Not authorized");

    res.render("chat", { task, username: req.session.user.username });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading chat");
  }
});

// Chat post (text + optional file)
app.post(
  "/chat/:taskId",
  requireLogin,
  upload.single("file"),
  async (req, res) => {
    try {
      const task = await Task.findById(req.params.taskId);
      if (!task) return res.status(404).send("Task not found");

      const uid = req.session.user.id.toString();
      const allowed =
        (task.postedById && task.postedById.toString() === uid) ||
        (task.takenById && task.takenById.toString() === uid);
      if (!allowed) return res.status(403).send("Not authorized");

      const text = req.body.text || "";
      let file = null;
      if (req.file) file = "/uploads/" + req.file.filename;

      task.messages.push({
        senderId: req.session.user.id,
        senderName: req.session.user.username,
        text,
        file,
        createdAt: new Date(),
      });

      await task.save();
      res.redirect("/chat/" + req.params.taskId);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error sending message");
    }
  }
);

// Mark task completed (only poster)
app.post("/complete-task/:id", requireLogin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send("Task not found");

    if (task.postedById.toString() !== req.session.user.id) {
      return res.status(403).send("Unauthorized");
    }

    task.status = "Completed";
    await task.save();
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error marking task completed");
  }
});

// Delete task (only if created by the current user)
app.post("/delete-task/:id", requireLogin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send("Task not found");

    if (task.postedById.toString() !== req.session.user.id) {
      return res.status(403).send("Unauthorized deletion");
    }

    await Task.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting task");
  }
});

// Admin route to clear all data in MongoDB collections (users, tasks, chats)
// WARNING: This will delete ALL data permanently
app.post("/admin/clear-all", async (req, res) => {
  try {
    await User.deleteMany({});
    await Task.deleteMany({});
    // Add other models if needed, e.g. Chat.deleteMany({})
    res.send("All data cleared from the database.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error clearing data");
  }
});

// Start server
app.listen(PORT, () =>
  console.log(`Server listening on http://localhost:${PORT}`)
);
