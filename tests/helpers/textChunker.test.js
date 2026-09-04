const { chunkText } = require("../../helpers/textChunker");

describe("chunkText", () => {
  it("chunks pages into segments", () => {
    const pages = [{ pageNumber: 1, text: "A".repeat(1000) }];
    const chunks = chunkText(pages);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].pageNumber).toBe(1);
    expect(chunks[0].chunkIndex).toBe(0);
  });

  it("handles empty pages", () => {
    const chunks = chunkText([]);
    expect(chunks).toEqual([]);
  });

  it("handles pages with no text", () => {
    const chunks = chunkText([{ pageNumber: 1, text: "" }]);
    expect(chunks).toEqual([]);
  });

  it("respects chunk size and overlap", () => {
    const pages = [{ pageNumber: 1, text: "A".repeat(2000) }];
    const chunks = chunkText(pages, { chunkSize: 800, overlap: 200 });
    expect(chunks.length).toBeGreaterThan(0);
  });
});
