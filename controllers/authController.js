const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { validateAadhaarServer } = require("../services/aadhaarService");

const getRegister = (req, res) => {
  res.render("register", { error: null });
};

const postRegister = async (req, res) => {
  try {
    const {
      username,
      password,
      fullName,
      aadhaarNumber,
      role,
      gender,
      educationLevel,
      subjects,
      location,
      lat,
      lng,
    } = req.body;

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
      newUser.location = { type: "Point", coordinates: [Number(lng), Number(lat)] };
    }

    await newUser.save();
    res.redirect("/login");
  } catch (err) {
    console.error(err);
    res.render("register", { error: "Registration failed" });
  }
};

const getLogin = (req, res) => {
  res.render("login", { error: null });
};

const postLogin = async (req, res) => {
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
};

const logout = (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
};

const saveLocation = async (req, res) => {
  try {
    const { lat, lng, locationName } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: "Missing coordinates" });
    }

    const finalLocationName = locationName && locationName.trim() ? locationName.trim() : "Unknown";

    await User.findByIdAndUpdate(req.session.user.id, {
      location: { type: "Point", coordinates: [Number(lng), Number(lat)] },
      locationName: finalLocationName,
    });

    req.session.user.locationName = finalLocationName;
    res.json({ success: true, locationName: finalLocationName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to save location" });
  }
};

module.exports = {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  logout,
  saveLocation,
};
