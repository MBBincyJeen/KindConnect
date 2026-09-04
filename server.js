require("dotenv").config();

const path = require("path");
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const session = require("express-session");
const cors = require("cors");
const { createSocketServer } = require("./config/socket");
const { errorHandler } = require("./middleware/errorHandler");
const routes = require("./routes");

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT, 10) || 3000;

const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "kindconnect_secret",
  resave: false,
  saveUninitialized: false,
});

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

const io = createSocketServer(server, sessionMiddleware);
app.set("io", io);

app.use("/", routes);

app.use(errorHandler);

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kindconnect")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error", err));

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

module.exports = { app, server };
