const mongoose = require("mongoose");

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kindconnect");

  const Message = mongoose.model(
    "Message",
    new mongoose.Schema(
      {
        sentiment: String,
        sentimentConfidence: String,
        sentimentExplanation: String,
        toneFlags: mongoose.Schema.Types.Mixed,
      },
      { strict: false }
    )
  );

  const messages = await Message.find({
    sentiment: { $exists: true },
    toneFlags: { $exists: false },
  });
  let updated = 0;

  for (const msg of messages) {
    const flags = [];
    if (msg.sentiment === "positive")
      flags.push({ type: "gratitude", label: "Positive tone" });
    if (msg.sentiment === "negative")
      flags.push({ type: "frustration", label: "Negative tone" });

    await Message.updateOne(
      { _id: msg._id },
      {
        $set: { toneFlags: flags },
        $unset: {
          sentiment: "",
          sentimentConfidence: "",
          sentimentExplanation: "",
        },
      }
    );
    updated++;
  }

  console.log(
    `Migrated ${updated} messages from sentiment to toneFlags`
  );
  await mongoose.disconnect();
}

migrate().catch(console.error);
