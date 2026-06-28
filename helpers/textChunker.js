function chunkText(pages, { chunkSize = 800, overlap = 200 } = {}) {
  const chunks = [];

  pages.forEach((page) => {
    const text = page.text.replace(/\s+/g, " ").trim();
    if (!text) return;

    let start = 0;
    let index = 0;
    while (start < text.length) {
      const slice = text.slice(start, start + chunkSize).trim();
      if (!slice) break;
      chunks.push({
        chunkIndex: index,
        pageNumber: page.pageNumber,
        text: slice,
        characterCount: slice.length,
      });
      start += chunkSize - overlap;
      index += 1;
    }
  });

  return chunks;
}

module.exports = { chunkText };
