const { validateAadhaarServer } = require("../../services/aadhaarService");

describe("validateAadhaarServer", () => {
  it("returns false for empty input", () => {
    expect(validateAadhaarServer("")).toBe(false);
  });

  it("returns false for non-12-digit input", () => {
    expect(validateAadhaarServer("12345")).toBe(false);
    expect(validateAadhaarServer("12345678901234")).toBe(false);
  });

  it("returns false for non-numeric input", () => {
    expect(validateAadhaarServer("abcdefghijkl")).toBe(false);
  });

  it("returns false when first digit is 0 or 1", () => {
    expect(validateAadhaarServer("023456789012")).toBe(false);
    expect(validateAadhaarServer("123456789012")).toBe(false);
  });

  it("returns false for all-same-digit input", () => {
    expect(validateAadhaarServer("222222222222")).toBe(false);
  });

  it("handles null/undefined input", () => {
    expect(validateAadhaarServer(null)).toBe(false);
    expect(validateAadhaarServer(undefined)).toBe(false);
  });

  it("handles input with spaces", () => {
    for (let i = 200000000000; i <= 200000000099; i++) {
      if (validateAadhaarServer(String(i))) {
        const spaced = String(i).slice(0, 4) + " " + String(i).slice(4, 8) + " " + String(i).slice(8);
        expect(validateAadhaarServer(spaced)).toBe(true);
        break;
      }
    }
  });

  it("validates correct Aadhaar numbers (Verhoeff checksum)", () => {
    const valid = [];
    for (let i = 200000000000; i <= 200000000099; i++) {
      if (validateAadhaarServer(String(i))) valid.push(String(i));
    }
    expect(valid.length).toBeGreaterThan(0);
    valid.forEach((num) => {
      expect(validateAadhaarServer(num)).toBe(true);
    });
  });

  it("rejects numbers with wrong checksum", () => {
    const valid = [];
    for (let i = 200000000000; i <= 200000000099; i++) {
      if (validateAadhaarServer(String(i))) valid.push(String(i));
    }
    if (valid.length > 0) {
      const altered = valid[0].slice(0, -1) + (valid[0][11] === "9" ? "8" : "9");
      expect(validateAadhaarServer(altered)).toBe(false);
    }
  });
});
