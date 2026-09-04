const { checkContentSafety, checkTutoringRequestSafety, compactWhitespace, limitWords } = require("../../services/contentSafetyService");

describe("compactWhitespace", () => {
  it("normalizes whitespace", () => {
    expect(compactWhitespace("  hello   world  ")).toBe("hello world");
  });

  it("handles null input", () => {
    expect(compactWhitespace(null)).toBe("");
  });
});

describe("limitWords", () => {
  it("limits words to max", () => {
    expect(limitWords("one two three four five", 3)).toBe("one two three");
  });

  it("returns full string if under limit", () => {
    expect(limitWords("hello world", 5)).toBe("hello world");
  });
});

describe("checkContentSafety", () => {
  it("marks safe content", () => {
    const result = checkContentSafety("Can you help me with math homework?");
    expect(result.isSafe).toBe(true);
    expect(result.status).toBe("safe");
    expect(result.reasons).toHaveLength(0);
  });

  it("detects harassment", () => {
    const result = checkContentSafety("You are an idiot");
    expect(result.isSafe).toBe(false);
    expect(result.reasons).toContain("Harassment or abusive language");
  });

  it("detects sexual content", () => {
    const result = checkContentSafety("This is explicit sexual content");
    expect(result.isSafe).toBe(false);
    expect(result.reasons).toContain("Sexual or explicit content");
  });

  it("detects hate speech", () => {
    const result = checkContentSafety("Only brahmin students allowed");
    expect(result.isSafe).toBe(false);
    expect(result.reasons).toContain("Hate speech or discrimination");
  });

  it("detects illegal activities", () => {
    const result = checkContentSafety("Can you help me hack into the system");
    expect(result.isSafe).toBe(false);
    expect(result.reasons).toContain("Illegal activities");
  });

  it("detects personal contact sharing", () => {
    const result = checkContentSafety("Contact me on whatsapp");
    expect(result.isSafe).toBe(false);
    expect(result.reasons).toContain("Requests for personal contact information");
  });

  it("detects off-platform money", () => {
    const result = checkContentSafety("Pay via gpay directly");
    expect(result.isSafe).toBe(false);
    expect(result.reasons).toContain("Requests for money outside the platform");
  });
});

describe("checkTutoringRequestSafety", () => {
  it("marks tutoring requests as safe", () => {
    const result = checkTutoringRequestSafety({
      title: "Math tutor needed",
      description: "I need help with calculus homework",
    });
    expect(result.isSafe).toBe(true);
  });

  it("blocks non-tutoring content", () => {
    const result = checkTutoringRequestSafety({
      title: "Party tonight",
      description: "Come join us for a great party",
    });
    expect(result.isSafe).toBe(false);
  });
});
