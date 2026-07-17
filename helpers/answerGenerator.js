async function safeFetch(...args) {
  if (globalThis.fetch) return globalThis.fetch(...args);
  const { default: fetch } = await import("node-fetch");
  return fetch(...args);
}

function buildFallbackAnswer(question, contextText) {
  const cleanContext = (contextText || "").replace(/^No document excerpts were found for this document\.$/, "");
  const lines = cleanContext
    .split(/\n\n+/)
    .map((line) => line.replace(/^Page\s*\d+:\s*/i, "").trim())
    .filter(Boolean);

  if (!lines.length) {
    return "I could not find relevant content in the uploaded document yet. Please upload a PDF with readable text and try again.";
  }

  const bestLine = lines[0];
  const shortQuestion = (question || "").trim();
  if (!shortQuestion) {
    return `Based on the document content, the most relevant excerpt is: ${bestLine.slice(0, 500)}`;
  }

  return `I couldn't reach Gemini right now, so I'm using the closest available document text. ${bestLine.slice(0, 500)}`;
}

async function generateAnswer({ question, contextText, apiKey, model = "gemini-2.0-flash" }) {
  if (!apiKey) {
    return buildFallbackAnswer(question, contextText);
  }

  const prompt = `You are a helpful assistant that answers questions using only the provided document excerpts. If the answer is not contained in the text, say "I don't know based on the uploaded documents."\n\nContext:\n${contextText}\n\nQuestion: ${question}\nAnswer:`;

  try {
    const response = await safeFetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 450,
          },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Answer generation failed (${response.status}): ${data.error?.message || JSON.stringify(data)}`);
    }
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      throw new Error("Answer generation failed");
    }

    return data.candidates[0].content.parts.map((part) => part.text || "").join("\n").trim();
  } catch (error) {
    console.warn("Gemini answer generation unavailable, using local fallback:", error.message);
    return buildFallbackAnswer(question, contextText);
  }
}

module.exports = { generateAnswer };
