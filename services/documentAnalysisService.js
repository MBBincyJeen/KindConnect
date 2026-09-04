const path = require("path");
const fs = require("fs");
const { checkContentSafety } = require("./contentSafetyService");

async function analyzeDocument(filePath, fileName, mimeType) {
  const analysis = {
    fileType: mimeType || path.extname(fileName || "").replace(".", "") || "unknown",
    fileSizeKB: 0,
    wordCount: 0,
    summary: "",
    keywords: [],
  };

  try {
    const stats = await fs.promises.stat(filePath);
    analysis.fileSizeKB = Math.max(1, Math.round(stats.size / 1024));
  } catch (err) {
    return analysis;
  }

  const normalizedName = (fileName || "").toLowerCase();
  if (
    normalizedName.endsWith(".txt") ||
    normalizedName.endsWith(".md") ||
    mimeType?.startsWith("text/")
  ) {
    try {
      const content = await fs.promises.readFile(filePath, "utf8");
      const words = content.trim().split(/\s+/).filter(Boolean);
      analysis.wordCount = words.length;
      analysis.summary = content
        .split(/\.\s+/)
        .slice(0, 2)
        .join(". ")
        .slice(0, 180);
      analysis.safetyCheck = checkContentSafety(content);
      const frequent = words
        .map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""))
        .filter(
          (w) =>
            w.length > 4 &&
            !["which", "there", "their", "about", "would", "could", "should", "these", "those", "while"].includes(w),
        );
      const keywordCounts = frequent.reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});
      analysis.keywords = Object.entries(keywordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);
      analysis.aiSummary = analysis.summary || "Key concepts were identified and summarized.";
      analysis.confidence = Math.min(0.95, 0.65 + Math.min(10, analysis.wordCount) * 0.03).toFixed(2);
    } catch (err) {
      analysis.aiSummary = "Could not fully analyze the document content.";
      analysis.safetyCheck = {
        isSafe: null,
        status: "not_checked",
        reasons: ["Could not read document content for safety review"],
        checkedAt: new Date(),
      };
    }
  }

  return analysis;
}

module.exports = { analyzeDocument };
