const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    educationLevel: { type: String, required: true, trim: true },
    duration: { type: String, trim: true, default: "" },

    preferredGender: {
      type: String,
      enum: ["Any", "Male", "Female", "Other"],
      default: "Any",
    },

    postedById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postedByName: { type: String, required: true },
    postedByRole: { type: String, required: true },

    takenById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    takenByName: { type: String, default: null },
    takenByRole: { type: String, default: null },

    status: {
      type: String,
      enum: ["Not Taken", "In Progress", "Completed"],
      default: "Not Taken",
    },
    interestedTeachers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    studentAccepted: {
      type: Boolean,
      default: false,
    },
    sessionMode: {
      type: String,
      enum: ["Live", "In-Person"],
      default: "Live",
    },
    aiSummary: { type: String, trim: true, default: "" },
    aiSafetyCheck: {
      isSafe: { type: Boolean, default: true },
      status: { type: String, enum: ["safe", "needs_review", "blocked"], default: "safe" },
      reasons: [{ type: String, trim: true }],
      checkedAt: { type: Date, default: Date.now },
    },
    aiTutorEvaluation: {
      clarity: { type: Number, default: null },
      helpfulness: { type: Number, default: null },
      professionalism: { type: Number, default: null },
      engagement: { type: Number, default: null },
      overallRating: { type: Number, default: null },
      notes: { type: String, trim: true, default: "" },
      evaluatedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
