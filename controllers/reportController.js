const Report = require("../models/Report");
const Block = require("../models/Block");
const User = require("../models/User");
const Message = require("../models/Message");
const Task = require("../models/Task");

const VALID_TARGET_TYPES = ["user", "message", "task"];
const VALID_REPORT_REASONS = [
  "spam",
  "harassment",
  "inappropriate_content",
  "fake_profile",
  "fraud",
  "other",
];

const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !VALID_TARGET_TYPES.includes(targetType)) {
      return res.status(400).json({ error: "Invalid or missing targetType. Must be user, message, or task." });
    }
    if (!targetId) {
      return res.status(400).json({ error: "targetId is required." });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: "A reason is required." });
    }

    let targetExists = false;
    if (targetType === "user") targetExists = !!(await User.findById(targetId));
    else if (targetType === "message") targetExists = !!(await Message.findById(targetId));
    else if (targetType === "task") targetExists = !!(await Task.findById(targetId));

    if (!targetExists) {
      return res.status(404).json({ error: `Reported ${targetType} not found.` });
    }

    if (targetType === "user" && targetId === req.session.user.id) {
      return res.status(400).json({ error: "You cannot report yourself." });
    }

    const existing = await Report.findOne({
      reporterId: req.session.user.id,
      targetType,
      targetId,
      status: { $in: ["pending", "reviewed"] },
    });
    if (existing) {
      return res.status(409).json({ error: "You have already reported this item." });
    }

    const report = await Report.create({
      reporterId: req.session.user.id,
      targetType,
      targetId,
      reason: reason.trim(),
      description: (description || "").trim(),
    });

    return res.status(201).json({ success: true, reportId: report._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create report." });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.session.user.id) {
      return res.status(400).json({ error: "You cannot block yourself." });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const existing = await Block.findOne({
      blockerId: req.session.user.id,
      blockedId: userId,
    });
    if (existing) {
      return res.status(409).json({ error: "User is already blocked." });
    }

    await Block.create({
      blockerId: req.session.user.id,
      blockedId: userId,
    });

    await User.findByIdAndUpdate(req.session.user.id, {
      $addToSet: { blockedUsers: userId },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to block user." });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    await Block.findOneAndDelete({
      blockerId: req.session.user.id,
      blockedId: userId,
    });

    await User.findByIdAndUpdate(req.session.user.id, {
      $pull: { blockedUsers: userId },
    });

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to unblock user." });
  }
};

const getBlockedUsers = async (req, res) => {
  try {
    const blocks = await Block.find({ blockerId: req.session.user.id })
      .populate("blockedId", "username fullName role")
      .lean();

    const blockedUsers = blocks.map((b) => b.blockedId).filter(Boolean);
    return res.json({ blockedUsers });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch blocked users." });
  }
};

const getReports = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && ["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
      filter.status = status;
    }

    const reports = await Report.find(filter)
      .populate("reporterId", "username fullName")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ reports });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch reports." });
  }
};

module.exports = {
  createReport,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getReports,
};
