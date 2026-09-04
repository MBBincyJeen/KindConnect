const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    description: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, trim: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true, trim: true },

  role: {
    type: String,
    enum: ["Teacher", "Student"],
    required: true,
  },

  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: true,
  },

  aadhaarNumber: { type: String, required: true, unique: true, trim: true },
  aadhaarVerified: { type: Boolean, default: false },

  educationLevel: { type: String, required: true, trim: true },
  subjects: [{ type: String, trim: true }],

  aboutMe: { type: String, default: "" },

  certificates: {
    type: [certificateSchema],
    default: [],
  },

  blockedUsers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  locationName: { type: String, default: "Unknown" },
  location: {
    type: {
      type: String,
      enum: ["Point"],
    },
    coordinates: {
      type: [Number],
    },
  },
});

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);