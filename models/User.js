// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  location: { type: String, default: "Unknown" }
});

module.exports = mongoose.model("User", userSchema);
