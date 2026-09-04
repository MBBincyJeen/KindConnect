const { parseRating, buildStudentTutorEvaluation, emptyTutorEvaluation } = require("../../services/ratingService");

describe("parseRating", () => {
  it("returns integer for valid rating", () => {
    expect(parseRating(3)).toBe(3);
    expect(parseRating("5")).toBe(5);
  });

  it("returns null for invalid rating", () => {
    expect(parseRating(0)).toBeNull();
    expect(parseRating(6)).toBeNull();
    expect(parseRating(1.5)).toBeNull();
    expect(parseRating("abc")).toBeNull();
  });

  it("accepts boundary values", () => {
    expect(parseRating(1)).toBe(1);
    expect(parseRating(5)).toBe(5);
  });
});

describe("emptyTutorEvaluation", () => {
  it("returns empty evaluation object", () => {
    const eval_ = emptyTutorEvaluation();
    expect(eval_.clarity).toBeNull();
    expect(eval_.overallRating).toBeNull();
    expect(eval_.notes).toBe("");
  });
});

describe("buildStudentTutorEvaluation", () => {
  it("returns null if ratings are missing", () => {
    const task = { takenById: "123" };
    expect(buildStudentTutorEvaluation(task, {})).toBeNull();
  });

  it("returns evaluation with valid ratings", () => {
    const task = { takenById: "123" };
    const eval_ = buildStudentTutorEvaluation(task, {
      clarity: 4,
      helpfulness: 5,
      professionalism: 4,
      engagement: 3,
    });
    expect(eval_).not.toBeNull();
    expect(eval_.overallRating).toBe(4.0);
    expect(eval_.clarity).toBe(4);
  });

  it("returns empty evaluation if no takenById", () => {
    const task = { takenById: null };
    const eval_ = buildStudentTutorEvaluation(task, {
      clarity: 4, helpfulness: 5, professionalism: 4, engagement: 3,
    });
    expect(eval_.overallRating).toBeNull();
  });
});
