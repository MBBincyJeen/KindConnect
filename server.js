require("dotenv").config();


const path = require("path");
const fs = require("fs");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const multer = require("multer");
const cors = require("cors");


const User = require("./models/User");
const Task = require("./models/Task");
const Message = require("./models/Message");
const Notification = require("./models/Notification");
const pdfRoutes = require("./routes/pdfRoutes");


const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT, 10) || 3000;


const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "kindconnect_secret",
  resave: false,
  saveUninitialized: false,
});


const io = new Server(server, {
  cors: { origin: true, credentials: true },
});


io.engine.use(sessionMiddleware);


const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});
const upload = multer({ storage });


app.use(cors({ origin: true, credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(sessionMiddleware);


app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});
app.use(pdfRoutes);


mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kindconnect")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error", err));


const dTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];


const pTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];


function validateAadhaarServer(num) {
  const cleanNum = (num || "").replace(/\s+/g, "");
  if (!/^\d{12}$/.test(cleanNum)) return false;
  if (cleanNum[0] === "0" || cleanNum[0] === "1") return false;
  if (/^(\d)\1{11}$/.test(cleanNum)) return false;


  let c = 0;
  const numStr = cleanNum.split("").reverse();
  for (let i = 0; i < numStr.length; i++) {
    c = dTable[c][pTable[i % 8][parseInt(numStr[i], 10)]];
  }
  return c === 0;
}


function analyzeSentiment(text) {
  const cleanText = (text || "").toLowerCase();
  const words = cleanText.match(/\b[\w']+\b/g) || [];
  const positive = new Set(["good","great","happy","love","nice","thanks","thank","awesome","excellent","well","perfect","amazing","helpful","clear","positive","wonderful","friendly","support","done","done","sure","yes","yes"]);
  const negative = new Set(["bad","sad","angry","hate","problem","issue","difficult","sorry","wrong","late","unhappy","upset","frustrated","fail","urgent","need","no","not","can't","cannot","hard","slow","poor","delay"]);
  let score = 0;


  words.forEach((word) => {
    if (positive.has(word)) score += 1;
    if (negative.has(word)) score -= 1;
  });


  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}


function predictSentiment(text) {
  const sentiment = analyzeSentiment(text);
  let confidence = 0.75;
  let explanation = "Neutral or informational tone detected.";


  if (sentiment === "positive") {
    confidence = 0.86;
    explanation = "Positive tone detected — helpful, friendly, or encouraging language.";
  } else if (sentiment === "negative") {
    confidence = 0.82;
    explanation = "Negative or urgent tone detected — the message may express concern, issue, or a need for support.";
  }


  return {
    sentiment,
    confidence: confidence.toFixed(2),
    explanation,
  };
}


function compactWhitespace(value) {
  return (value || "").toString().replace(/\s+/g, " ").trim();
}


function limitWords(value, maxWords) {
  const words = compactWhitespace(value).split(" ").filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}


function generateTaskSummary({ subject, educationLevel, sessionMode, duration, description }) {
  const parts = [];
  if (subject) parts.push(subject);
  if (educationLevel) parts.push(`${educationLevel} level`);
  if (sessionMode) parts.push((sessionMode === "Live" ? "online" : "offline"));
  if (duration) parts.push(duration);
  if (description) parts.push(limitWords(description, 14));


  return limitWords(parts.join(" | "), 30);
}


function checkContentSafety(text, { requireTutoringContext = false } = {}) {
  const cleanText = compactWhitespace(text).toLowerCase();
  const checks = [
    { reason: "Harassment or abusive language", pattern: /\b(idiot|stupid|moron|shut up|kill yourself)\b/i },
    { reason: "Sexual or explicit content", pattern: /\b(sex|sexual|nude|nudes|porn|explicit|hookup)\b/i },
    { reason: "Hate speech or discrimination", pattern: /\b(caste|religion|race|racist|only brahmin|no muslim|no hindu|no christian)\b/i },
    { reason: "Illegal activities", pattern: /\b(hack|hacking|crack|piracy|fake certificate|fake id|exam leak|leaked paper)\b/i },
    { reason: "Violence or dangerous requests", pattern: /\b(weapon|bomb|poison|assault|violence|hurt someone)\b/i },
    { reason: "Scam or fraudulent requests", pattern: /\b(scam|fraud|cheat in exam|write my exam|impersonate)\b/i },
    { reason: "Requests for money outside the platform", pattern: /\b(paytm|gpay|google pay|phonepe|upi|bank transfer|cash only|outside platform)\b/i },
    { reason: "Requests for personal contact information", pattern: /\b(whatsapp|phone number|mobile number|email me|instagram|telegram|snapchat|@\w+\.\w+)\b/i },
  ];


  const reasons = checks.filter((check) => check.pattern.test(cleanText)).map((check) => check.reason);
  const tutoringWords = /\b(tutor|tuition|teach|learn|study|homework|assignment|exam|class|grade|subject|lesson|chapter|math|mathematics|science|english|hindi|physics|chemistry|biology|computer|economics|accountancy|business|history|geography|political)\b/i;


  if (requireTutoringContext && cleanText && !tutoringWords.test(cleanText)) {
    reasons.push("Request may be unrelated to tutoring or education");
  }


  return {
    isSafe: reasons.length === 0,
    status: reasons.length === 0 ? "safe" : "blocked",
    reasons,
    checkedAt: new Date(),
  };
}


function checkTutoringRequestSafety({ title, description }) {
  return checkContentSafety(`${title || ""} ${description || ""}`, { requireTutoringContext: true });
}


function emptyTutorEvaluation() {
  return {
    clarity: null,
    helpfulness: null,
    professionalism: null,
    engagement: null,
    overallRating: null,
    notes: "",
    evaluatedAt: null,
  };
}


function parseRating(value) {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}


function buildStudentTutorEvaluation(task, ratings) {
  if (!task.takenById) return emptyTutorEvaluation();


  const clarity = parseRating(ratings.clarity);
  const helpfulness = parseRating(ratings.helpfulness);
  const professionalism = parseRating(ratings.professionalism);
  const engagement = parseRating(ratings.engagement);
  const values = [clarity, helpfulness, professionalism, engagement];


  if (values.some((rating) => rating === null)) return null;
  const overallRating = Number(((clarity + helpfulness + professionalism + engagement) / 4).toFixed(1));


  return {
    clarity,
    helpfulness,
    professionalism,
    engagement,
    overallRating,
    notes: "Submitted by the student when marking the tutoring request complete.",
    evaluatedAt: new Date(),
  };
}


async function analyzeDocument(filePath, fileName, mimeType) {
  const analysis = {
    fileType: mimeType || path.extname(fileName || "").replace(".", "") || "unknown",
    fileSizeKB: 0,
    wordCount: 0,
    summary: "",
    keywords: [],
  };


  try {
    const stats = await fs.promises.stat(filePath);
    analysis.fileSizeKB = Math.max(1, Math.round(stats.size / 1024));
  } catch (err) {
    return analysis;
  }


  const normalizedName = (fileName || "").toLowerCase();
  if (normalizedName.endsWith(".txt") || normalizedName.endsWith(".md") || mimeType?.startsWith("text/")) {
    try {
      const content = await fs.promises.readFile(filePath, "utf8");
      const words = content.trim().split(/\s+/).filter(Boolean);
      analysis.wordCount = words.length;
      analysis.summary = content.split(/\.\s+/).slice(0, 2).join(". ").slice(0, 180);
      analysis.safetyCheck = checkContentSafety(content);
      const frequent = words
        .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
        .filter((w) => w.length > 4 && !["which","there","their","about","would","could","should","these","those","while"].includes(w));
      const keywordCounts = frequent.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});
      analysis.keywords = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
      analysis.aiSummary = analysis.summary || "Key concepts were identified and summarized.";
      analysis.confidence = Math.min(0.95, 0.65 + Math.min(10, analysis.wordCount) * 0.03).toFixed(2);
    } catch (err) {
      analysis.aiSummary = "Could not fully analyze the document content.";
      analysis.safetyCheck = {
        isSafe: null,
        status: "not_checked",
        reasons: ["Could not read document content for safety review"],
        checkedAt: new Date(),
      };
    }
  }


  return analysis;
}


function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}


app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.redirect("/login");
});


app.get("/register", (req, res) => res.render("register", { error: null }));


app.post("/register", async (req, res) => {
  try {
    const { username, password, fullName, aadhaarNumber, role, gender, educationLevel, subjects, location, lat, lng } = req.body;


    if (!username || !password || !fullName || !aadhaarNumber || !role || !gender || !educationLevel || !location) {
      return res.render("register", { error: "Fill all required fields" });
    }


    if (!validateAadhaarServer(aadhaarNumber)) {
      return res.render("register", { error: "Invalid Aadhaar number format or checksum verification failed" });
    }


    const exist = await User.findOne({ $or: [{ username }, { aadhaarNumber }] });
    if (exist) return res.render("register", { error: "Username or Aadhaar already taken" });


    const hash = await bcrypt.hash(password, 10);


    let subjectList = [];
    if (role === "Teacher" && subjects) {
      subjectList = Array.isArray(subjects) ? subjects : [subjects];
    }


    const newUser = new User({
      username,
      password: hash,
      fullName,
      gender,
      aadhaarNumber,
      aadhaarVerified: true,
      role,
      educationLevel,
      subjects: subjectList,
      locationName: location,
    });


    if (lat && lng) {
      newUser.location = {
        type: "Point",
        coordinates: [Number(lng), Number(lat)],
      };
    }


    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("register", { error: "Registration failed" });
  }
});


app.get("/login", (req, res) => res.render("login", { error: null }));


app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.render("login", { error: "Invalid credentials" });


    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.render("login", { error: "Invalid credentials" });


    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      gender: user.gender,
      aadhaarVerified: user.aadhaarVerified,
      educationLevel: user.educationLevel,
      subjects: user.subjects || [],
      locationName: user.locationName || "Unknown",
    };


    req.session.save(() => res.redirect("/dashboard"));
  } catch (err) {
    console.error(err);
    res.render("login", { error: "Login failed" });
  }
});


app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});


app.post("/save-location", requireLogin, async (req, res) => {
  try {
    const { lat, lng, locationName } = req.body;


    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: "Missing coordinates" });
    }


    const finalLocationName = locationName && locationName.trim() ? locationName.trim() : "Unknown";


    await User.findByIdAndUpdate(req.session.user.id, {
      location: {
        type: "Point",
        coordinates: [Number(lng), Number(lat)],
      },
      locationName: finalLocationName,
    });


    req.session.user.locationName = finalLocationName;
    res.json({ success: true, locationName: finalLocationName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to save location" });
  }
});


app.get("/dashboard", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    const posted = await Task.find({ postedById: req.session.user.id }).sort({ createdAt: -1 });
    const recentOthers = await Task.find({ postedById: { $ne: req.session.user.id } })
      .sort({ createdAt: -1 })
      .limit(5);
    let teacherRating = null;


    if (user.role === "Teacher") {
      const [ratingStats] = await Task.aggregate([
        {
          $match: {
            takenById: new mongoose.Types.ObjectId(req.session.user.id),
            "aiTutorEvaluation.overallRating": { $ne: null },
          },
        },
        {
          $group: {
            _id: "$takenById",
            averageRating: { $avg: "$aiTutorEvaluation.overallRating" },
            ratingCount: { $sum: 1 },
          },
        },
      ]);


      teacherRating = ratingStats
        ? {
            average: Number(ratingStats.averageRating.toFixed(1)),
            count: ratingStats.ratingCount,
          }
        : { average: null, count: 0 };
    }


    res.render("dashboard", {
      posted,
      recentOthers,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      educationLevel: user.educationLevel,
      subjects: user.subjects || [],
      location: user.locationName || "Unknown",
      aadhaarVerified: user.aadhaarVerified,
      gender: user.gender,
      teacherRating,
      currentUser: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading dashboard");
  }
});


app.get("/add-task", requireLogin, (req, res) => {
  if (req.session.user.role === "Teacher") {
    return res.status(403).send("Teachers cannot post tasks.");
  }


  const subjects = [
    "Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi",
    "Social Studies", "Computer Science", "Economics", "Accountancy",
    "Business Studies", "History", "Geography", "Political Science", "Other",
  ];
  const educationLevels = [
    "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th", "UG", "PG", "PhD",
  ];
  res.render("add-task", { subjects, educationLevels, error: null, values: {} });
});


app.post("/add-task", requireLogin, async (req, res) => {
  try {
    if (req.session.user.role === "Teacher") {
      return res.status(403).send("Teachers cannot post tasks.");
    }


    const subjects = [
      "Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi",
      "Social Studies", "Computer Science", "Economics", "Accountancy",
      "Business Studies", "History", "Geography", "Political Science", "Other",
    ];
    const educationLevels = [
      "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th", "UG", "PG", "PhD",
    ];


    const { title, description, subject, educationLevel, preferredGender, sessionMode, duration } = req.body;
    const aiSafetyCheck = checkTutoringRequestSafety({ title, description });


    if (!aiSafetyCheck.isSafe) {
      return res.status(400).render("add-task", {
        subjects,
        educationLevels,
        error: `This request cannot be published yet: ${aiSafetyCheck.reasons.join(", ")}.`,
        values: req.body,
      });
    }


    const aiSummary = generateTaskSummary({
      subject,
      educationLevel,
      sessionMode: sessionMode || "Live",
      duration,
      description,
    });


    const t = new Task({
      title,
      description,
      subject,
      educationLevel,
      duration: compactWhitespace(duration),
      preferredGender: preferredGender || "Any",
      sessionMode: sessionMode || "Live",
      postedById: req.session.user.id,
      postedByName: req.session.user.username,
      postedByRole: req.session.user.role,
      aiSummary,
      aiSafetyCheck,
    });


    await t.save();


    const teacherQuery = {
      role: "Teacher",
      educationLevel: educationLevel,
      subjects: subject,
    };


    if (preferredGender && preferredGender !== "Any") {
      teacherQuery.gender = preferredGender;
    }


    const matchedTeachers = await User.find(teacherQuery);


    for (const teacher of matchedTeachers) {
      const notif = new Notification({
        recipientId: teacher._id,
        type: "new_task_match",
        taskId: t._id,
        message: `New matching request: "${title}" by student ${req.session.user.username}`,
      });
      await notif.save();


      io.to(teacher._id.toString()).emit("newNotification", {
        id: notif._id,
        message: notif.message,
        taskId: t._id.toString(),
        createdAt: notif.createdAt,
      });
    }


    res.redirect(`/recommendations/${t._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error posting task");
  }
});


app.get("/recommendations/:taskId", requireLogin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).send("Task not found");


    const teacherQuery = {
      role: "Teacher",
      educationLevel: task.educationLevel,
      subjects: task.subject,
    };


    if (task.preferredGender && task.preferredGender !== "Any") {
      teacherQuery.gender = task.preferredGender;
    }


    const teachers = await User.find(teacherQuery);
    res.render("recommendations", { task, teachers });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading recommendations");
  }
});


app.post("/connect/:taskId/:teacherId", requireLogin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).send("Task not found");


    const teacher = await User.findById(req.params.teacherId);
    if (!teacher) return res.status(404).send("Teacher not found");


    task.takenById = teacher._id;
    task.takenByName = teacher.username;
    task.takenByRole = teacher.role;
    task.status = "In Progress";
    task.studentAccepted = true;
    await task.save();


    const notif = new Notification({
      recipientId: teacher._id,
      type: "task_taken",
      taskId: task._id,
      message: `Student ${req.session.user.username} connected with you for request: "${task.title}"`,
    });
    await notif.save();


    io.to(teacher._id.toString()).emit("newNotification", {
      id: notif._id,
      message: notif.message,
      taskId: task._id.toString(),
      createdAt: notif.createdAt,
    });


    res.redirect(`/chat/${task._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error connecting with teacher");
  }
});


app.get("/offer-help", requireLogin, async (req, res) => {
  try {
    const me = await User.findById(req.session.user.id).lean();


    const hasLocation =
      Array.isArray(me?.location?.coordinates) &&
      me.location.coordinates.length === 2 &&
      typeof me.location.coordinates[0] === "number" &&
      typeof me.location.coordinates[1] === "number";


    if (!hasLocation) {
      const tasks = await Task.find({
        postedById: { $ne: req.session.user.id },
        status: { $in: ["Not Taken", "In Progress"] },
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();


      return res.render("offer-help", {
        tasks,
        locationMissing: true,
        currentUser: req.session.user,
      });
    }


    const [lng, lat] = me.location.coordinates;


    const nearbyUsers = await User.find({
      _id: { $ne: req.session.user.id },
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: 60000,
        },
      },
    }).select("_id");


    const nearbyUserIds = nearbyUsers.map((u) => u._id);


    const tasks = await Task.find({
      postedById: { $in: nearbyUserIds },
      status: { $in: ["Not Taken", "In Progress"] },
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();


    res.render("offer-help", {
      tasks,
      locationMissing: false,
      currentUser: req.session.user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading nearby tasks");
  }
});


app.post("/take-task/:id", requireLogin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send("Task not found");


    if (task.postedById && task.postedById.toString() === req.session.user.id) {
      return res.status(403).send("Cannot take your own task");
    }


    if (task.status !== "Not Taken") return res.redirect("/offer-help");


    task.takenById = req.session.user.id;
    task.takenByName = req.session.user.username;
    task.takenByRole = req.session.user.role;
    task.status = "In Progress";
    task.studentAccepted = false;
    await task.save();


    const notif = new Notification({
      recipientId: task.postedById,
      type: "offer_received",
      taskId: task._id,
      message: `Teacher ${req.session.user.username} offered tutoring support for: "${task.title}"`,
    });
    await notif.save();


    io.to(task.postedById.toString()).emit("newNotification", {
      id: notif._id,
      message: notif.message,
      taskId: task._id.toString(),
      createdAt: notif.createdAt,
    });


    res.redirect("/your-tasks");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error taking task");
  }
});


app.get("/profile", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.render("profile", { profileUser: user, isOwnProfile: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading profile");
  }
});


app.get("/profile/:id", requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");
    const isOwnProfile = user._id.toString() === req.session.user.id;
    res.render("profile", { profileUser: user, isOwnProfile });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading profile");
  }
});


app.post("/profile/update", requireLogin, async (req, res) => {
  try {
    const { aboutMe, subjects } = req.body;
    const updateData = {};
    if (aboutMe !== undefined) updateData.aboutMe = aboutMe;
    if (subjects !== undefined) {
      updateData.subjects = Array.isArray(subjects) ? subjects : [subjects].filter(Boolean);
    }


    await User.findByIdAndUpdate(req.session.user.id, updateData);
    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating profile");
  }
});


app.post("/profile/upload-certificate", requireLogin, upload.single("certificate"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded");
    }
    const { certificateDescription } = req.body;
    const user = await User.findById(req.session.user.id);
    user.certificates.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      description: certificateDescription || "",
      uploadedAt: new Date(),
    });
    await user.save();
    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error uploading certificate");
  }
});


app.post("/profile/delete-certificate/:filename", requireLogin, async (req, res) => {
  try {
    const { filename } = req.params;
    const user = await User.findById(req.session.user.id);
    user.certificates = user.certificates.filter((c) => c.filename !== filename);
    await user.save();


    const filePath = path.join(__dirname, "public", "uploads", filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }


    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting certificate");
  }
});


app.get("/api/notifications", requireLogin, async (req, res) => {
  try {
    const notifs = await Notification.find({ recipientId: req.session.user.id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});


app.get("/api/notifications/count", requireLogin, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipientId: req.session.user.id, read: false });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notifications count" });
  }
});


app.post("/api/notifications/:id/read", requireLogin, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.session.user.id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});


app.get("/your-tasks", requireLogin, async (req, res) => {
  const tasks = await Task.find({ takenById: req.session.user.id }).sort({ createdAt: -1 });
  res.render("your-tasks", { tasks });
});


app.get("/chat/:taskId", requireLogin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).send("Task not found");


    const uid = req.session.user.id;
    const allowed =
      (task.postedById && task.postedById.toString() === uid) ||
      (task.takenById && task.takenById.toString() === uid);


    if (!allowed || !task.studentAccepted) return res.status(403).send("Not authorized");


    const messages = await Message.find({ taskId: task._id })
      .sort({ timestamp: 1 })
      .lean();


    res.render("chat", {
      task,
      username: req.session.user.username,
      messages,
      currentUserId: uid,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading chat");
  }
});


app.post("/chat/:taskId/send", requireLogin, upload.single("file"), async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });


    const uid = req.session.user.id;
    const allowed =
      task.postedById.toString() === uid ||
      (task.takenById && task.takenById.toString() === uid);


    if (!allowed || !task.studentAccepted) return res.status(403).json({ success: false, message: "Not authorized" });


    const text = (req.body.text || "").trim();
    if (!text && !req.file) {
      return res.status(400).json({ success: false, message: "Message or file required" });
    }


    let fileUrl;
    let fileName;
    if (req.file) {
      fileUrl = "/uploads/" + req.file.filename;
      fileName = req.file.originalname;
    }


    const sentimentResult = predictSentiment(text || fileName || "");
    let docAnalysis;
    if (req.file) {
      docAnalysis = await analyzeDocument(req.file.path, req.file.originalname, req.file.mimetype);
    }


    const messageDoc = await Message.create({
      taskId: task._id,
      sender: uid,
      senderName: req.session.user.username,
      message: text || `📎 Attached file: ${fileName}`,
      fileUrl,
      fileName,
      sentiment: sentimentResult.sentiment,
      sentimentConfidence: sentimentResult.confidence,
      sentimentExplanation: sentimentResult.explanation,
      docAnalysis,
      timestamp: new Date(),
    });


    const payload = {
      _id: messageDoc._id,
      taskId: task._id.toString(),
      senderId: uid,
      senderName: req.session.user.username,
      text: messageDoc.message,
      fileUrl,
      fileName,
      sentiment: messageDoc.sentiment,
      sentimentConfidence: messageDoc.sentimentConfidence,
      sentimentExplanation: messageDoc.sentimentExplanation,
      docAnalysis: messageDoc.docAnalysis,
      createdAt: messageDoc.timestamp,
    };


    io.to(task._id.toString()).emit("newMessage", payload);
    return res.json({ success: true, message: payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error sending message" });
  }
});


app.post("/complete-task/:id", requireLogin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send("Task not found");


    if (task.postedById.toString() !== req.session.user.id) {
      return res.status(403).send("Unauthorized");
    }


    const tutorEvaluation = buildStudentTutorEvaluation(task, req.body);


    if (tutorEvaluation === null) {
      return res.status(400).send("Please rate the tutor from 1 to 5 before marking this request complete.");
    }


    task.status = "Completed";
    task.aiTutorEvaluation = tutorEvaluation;
    await task.save();
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error marking task completed");
  }
});


app.post("/delete-task/:id", requireLogin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).send("Task not found");


    if (task.postedById.toString() !== req.session.user.id) {
      return res.status(403).send("Unauthorized deletion");
    }


    await Message.deleteMany({ taskId: task._id });
    await Task.findByIdAndDelete(req.params.id);
    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting task");
  }
});


app.post("/accept-teacher/:taskId", requireLogin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).send("Task not found");
    if (task.postedById.toString() !== req.session.user.id) {
      return res.status(403).send("Only the task poster can accept the connection");
    }


    task.studentAccepted = true;
    await task.save();


    // Notify teacher
    if (task.takenById) {
      const notif = new Notification({
        recipientId: task.takenById,
        type: "offer_accepted",
        taskId: task._id,
        message: `Student ${req.session.user.username} accepted your tutoring offer for "${task.title}"`,
      });
      await notif.save();


      io.to(task.takenById.toString()).emit("newNotification", {
        id: notif._id,
        message: notif.message,
        taskId: task._id.toString(),
        createdAt: notif.createdAt,
      });
    }


    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error accepting teacher");
  }
});


app.post("/decline-teacher/:taskId", requireLogin, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).send("Task not found");
    if (task.postedById.toString() !== req.session.user.id) {
      return res.status(403).send("Only the task poster can decline the connection");
    }


    const previousTeacherId = task.takenById;


    // Reset task
    task.takenById = null;
    task.takenByName = null;
    task.takenByRole = null;
    task.status = "Not Taken";
    task.studentAccepted = false;
    await task.save();


    // Notify teacher
    if (previousTeacherId) {
      const notif = new Notification({
        recipientId: previousTeacherId,
        type: "offer_declined",
        taskId: task._id,
        message: `Student ${req.session.user.username} declined your tutoring offer for "${task.title}"`,
      });
      await notif.save();


      io.to(previousTeacherId.toString()).emit("newNotification", {
        id: notif._id,
        message: notif.message,
        taskId: task._id.toString(),
        createdAt: notif.createdAt,
      });
    }


    res.redirect("/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error declining teacher");
  }
});


app.get("/session/:taskId", requireLogin, async (req, res) => {
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
});


app.post("/admin/clear-all", async (req, res) => {
  try {
    await User.deleteMany({});
    await Task.deleteMany({});
    await Message.deleteMany({});
    await Notification.deleteMany({});
    res.send("All data cleared from the database.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error clearing data");
  }
});


io.on("connection", (socket) => {
  const user = socket.request.session?.user;
  if (!user) {
    socket.disconnect(true);
    return;
  }


  socket.on("joinUserRoom", (userId) => {
    socket.join(userId.toString());
  });


  socket.on("joinRoom", (taskId) => {
    socket.join(taskId.toString());
  });


  socket.on("typing", (data) => {
    socket.to(data.taskId.toString()).emit("userTyping", { username: data.username });
  });


  socket.on("stopTyping", (data) => {
    socket.to(data.taskId.toString()).emit("userStopTyping");
  });


  socket.on("join-session", async (taskId) => {
    const room = `session-${taskId}`;
    await socket.join(room);


    const sockets = await io.in(room).allSockets();
    const socketIds = [...sockets];


    if (socketIds.length === 2) {
      const [firstSocketId, secondSocketId] = socketIds;
      io.to(firstSocketId).emit("session-start", { initiator: true, taskId });
      io.to(secondSocketId).emit("session-start", { initiator: false, taskId });
    } else if (socketIds.length > 2) {
      // Additional peers join as receivers by default
      socket.emit("session-start", { initiator: false, taskId });
    }
  });


  socket.on("signal", (data) => {
    const room = `session-${data.taskId}`;
    socket.to(room).emit("signal", data);
  });
});


server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use. Set PORT to a different open port and restart the app.`);
    process.exit(1);
  }
  console.error("Server error:", err);
  process.exit(1);
});


server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});