const fs = require("fs");
const pdfParse = require("pdf-parse");

async function extractPdfText(filePath) {
  const buffer = await fs.promises.readFile(filePath);
  const data = await pdfParse(buffer);

  const pages = [];
  if (Array.isArray(data.text.split("\f"))) {
    const splitPages = data.text.split("\f");
    splitPages.forEach((pageText, index) => {
      const text = pageText.trim();
      if (text.length) {
        pages.push({ pageNumber: index + 1, text });
      }
    });
  }

  return {
    pageCount: pages.length || 1,
    pages: pages.length ? pages : [{ pageNumber: 1, text: data.text.trim() }],
  };
}

module.exports = { extractPdfText };
