function compactWhitespace(value) {
  return (value || "").toString().replace(/\s+/g, " ").trim();
}

function limitWords(value, maxWords) {
  const words = compactWhitespace(value).split(" ").filter(Boolean);
  return words.slice(0, maxWords).join(" ");
}

function checkContentSafety(text, { requireTutoringContext = false } = {}) {
  const cleanText = compactWhitespace(text).toLowerCase();
  const checks = [
    { reason: "Harassment or abusive language", pattern: /\b(idiot|stupid|moron|shut up|kill yourself)\b/i },
    { reason: "Sexual or explicit content", pattern: /\b(sex|sexual|nude|nudes|porn|explicit|hookup)\b/i },
    {
      reason: "Hate speech or discrimination",
      pattern: /\b(caste|religion|race|racist|only brahmin|no muslim|no hindu|no christian)\b/i,
    },
    {
      reason: "Illegal activities",
      pattern: /\b(hack|hacking|crack|piracy|fake certificate|fake id|exam leak|leaked paper)\b/i,
    },
    { reason: "Violence or dangerous requests", pattern: /\b(weapon|bomb|poison|assault|violence|hurt someone)\b/i },
    {
      reason: "Scam or fraudulent requests",
      pattern: /\b(scam|fraud|cheat in exam|write my exam|impersonate)\b/i,
    },
    {
      reason: "Requests for money outside the platform",
      pattern: /\b(paytm|gpay|google pay|phonepe|upi|bank transfer|cash only|outside platform)\b/i,
    },
    {
      reason: "Requests for personal contact information",
      pattern: /\b(whatsapp|phone number|mobile number|email me|instagram|telegram|snapchat|@\w+\.\w+)\b/i,
    },
  ];

  const reasons = checks.filter((check) => check.pattern.test(cleanText)).map((check) => check.reason);
  const tutoringWords =
    /\b(tutor|tuition|teach|learn|study|homework|assignment|exam|class|grade|subject|lesson|chapter|help|need|assistance|request|practice|concept|problem|question|answer|solution|understand|explain|practice|revision|preparation|test|quiz| Marks| marks|score|syllabus|curriculum|course|lecture|tutorial|coaching|guidance|mentor|mentorship|math|mathematics|algebra|geometry|calculus|trigonometry|arithmetic|statistics|probability|number|linear|quadratic|equation|formula|theorem|proof|integration|differentiation|derivative|matrix|vector|science|english|hindi|physics|chemistry|biology|computer|programming|coding|software|algorithm|data|database|economics|accountancy|business|commerce|finance|marketing|management|history|geography|political|civics|sociology|psychology|philosophy|literature|poetry|grammar|vocabulary|writing|reading|comprehension|essay|report|project|presentation|research|analysis|krita|nios|cbse|icse|board|university|college|school|degree|diploma|certificate|ug|pg|phd|bachelors|masters|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth)\b/i;

  if (requireTutoringContext && cleanText && !tutoringWords.test(cleanText)) {
    reasons.push("Request may be unrelated to tutoring or education");
  }

  return {
    isSafe: reasons.length === 0,
    status: reasons.length === 0 ? "safe" : "blocked",
    reasons,
    checkedAt: new Date(),
  };
}

function checkTutoringRequestSafety({ title, description }) {
  return checkContentSafety(`${title || ""} ${description || ""}`, { requireTutoringContext: true });
}

module.exports = {
  compactWhitespace,
  limitWords,
  checkContentSafety,
  checkTutoringRequestSafety,
};
