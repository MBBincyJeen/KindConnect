require("dotenv").config();
const mongoose = require("mongoose");
const Task = require("../models/Task");

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kindconnect");

    const result = await Task.updateMany(
      { sessionMode: { $exists: false } },
      { $set: { sessionMode: "Live" } }
    );

    console.log("Matched:", result.matchedCount || result.n);
    console.log("Modified:", result.modifiedCount || result.nModified);

    await mongoose.disconnect();
    console.log("Migration done");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrate();