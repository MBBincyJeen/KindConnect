const User = require("../models/User");
const Task = require("../models/Task");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

const clearAllData = async (req, res) => {
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
};

module.exports = { clearAllData };
