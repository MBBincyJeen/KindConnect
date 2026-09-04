const path = require("path");
const fs = require("fs");
const User = require("../models/User");
const config = require("../config");

const getOwnProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    res.render("profile", { profileUser: user, isOwnProfile: true });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading profile");
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");
    const isOwnProfile = user._id.toString() === req.session.user.id;
    res.render("profile", { profileUser: user, isOwnProfile });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading profile");
  }
};

const updateProfile = async (req, res) => {
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
};

const uploadCertificate = async (req, res) => {
  try {
    if (!req.file) return res.status(400).send("No file uploaded");
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
};

const deleteCertificate = async (req, res) => {
  try {
    const { filename } = req.params;
    const user = await User.findById(req.session.user.id);
    user.certificates = user.certificates.filter((c) => c.filename !== filename);
    await user.save();

    const filePath = path.join(config.uploadDir, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting certificate");
  }
};

module.exports = {
  getOwnProfile,
  getUserProfile,
  updateProfile,
  uploadCertificate,
  deleteCertificate,
};
