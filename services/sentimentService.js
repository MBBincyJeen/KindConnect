function detectToneFlags(text) {
  const cleanText = (text || "").toLowerCase();
  const words = cleanText.match(/\b[\w']+\b/g) || [];

  const flags = [];

  const urgencyWords = ["urgent", "asap", "immediately", "emergency", "now"];
  const gratitudeWords = ["thank", "thanks", "grateful", "appreciate"];
  const frustrationWords = ["frustrated", "stuck", "confused", "difficult", "struggling"];

  const hasUrgency = words.some((w) => urgencyWords.includes(w));
  const hasGratitude = words.some((w) => gratitudeWords.includes(w));
  const hasFrustration = words.some((w) => frustrationWords.includes(w));

  if (hasUrgency) flags.push({ type: "urgency", label: "Urgent tone" });
  if (hasGratitude) flags.push({ type: "gratitude", label: "Grateful tone" });
  if (hasFrustration) flags.push({ type: "frustration", label: "Expressing difficulty" });

  return flags;
}

module.exports = { detectToneFlags };
