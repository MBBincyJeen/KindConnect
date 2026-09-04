const { detectToneFlags } = require("../../services/sentimentService");

describe("detectToneFlags", () => {
  it("returns empty array for neutral text", () => {
    expect(detectToneFlags("Hello, how are you?")).toEqual([]);
  });

  it("detects urgency", () => {
    const flags = detectToneFlags("I need this done urgent");
    expect(flags).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "urgency" }),
    ]));
  });

  it("detects gratitude", () => {
    const flags = detectToneFlags("Thank you so much for your help");
    expect(flags).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "gratitude" }),
    ]));
  });

  it("detects frustration", () => {
    const flags = detectToneFlags("I am stuck and frustrated with this problem");
    expect(flags).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "frustration" }),
    ]));
  });

  it("detects multiple flags", () => {
    const flags = detectToneFlags("I am stuck and frustrated, thanks for trying to help urgently");
    expect(flags.length).toBeGreaterThanOrEqual(2);
  });

  it("handles empty input", () => {
    expect(detectToneFlags("")).toEqual([]);
    expect(detectToneFlags(null)).toEqual([]);
    expect(detectToneFlags(undefined)).toEqual([]);
  });
});
