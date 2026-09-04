const { compactWhitespace, limitWords } = require("./contentSafetyService");

function generateTaskSummary({ subject, educationLevel, sessionMode, duration, description }) {
  const parts = [];
  if (subject) parts.push(subject);
  if (educationLevel) parts.push(`${educationLevel} level`);
  if (sessionMode) parts.push(sessionMode === "Live" ? "online" : "offline");
  if (duration) parts.push(duration);
  if (description) parts.push(limitWords(description, 14));

  return limitWords(parts.join(" | "), 30);
}

module.exports = { generateTaskSummary };
