const mongoose = require("mongoose");
const User = require("../models/User");
const Task = require("../models/Task");

const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    const posted = await Task.find({ postedById: req.session.user.id })
      .populate("interestedTeachers", "username fullName role locationName educationLevel subjects gender")
      .sort({ createdAt: -1 });

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
        ? { average: Number(ratingStats.averageRating.toFixed(1)), count: ratingStats.ratingCount }
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
};

module.exports = { getDashboard };
