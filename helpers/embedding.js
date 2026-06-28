async function safeFetch(...args) {
  if (globalThis.fetch) return globalThis.fetch(...args);
  const { default: fetch } = await import("node-fetch");
  return fetch(...args);
}

async function embedText(text, { provider = "openai", apiKey } = {}) {
  const normalized = text.trim();
  if (!normalized) return [];

  if (provider === "openai") {
    if (!apiKey) {
      throw new Error("Missing OpenAI API key. Set OPENAI_API_KEY in your environment.");
    }

    const response = await safeFetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: normalized,
        model: "text-embedding-3-small",
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Embedding request failed (${response.status}): ${data.error?.message || JSON.stringify(data)}`);
    }
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      throw new Error("Embedding generation failed");
    }
    return data.data[0].embedding;
  }

  throw new Error(`Unsupported embedding provider: ${provider}`);
}

function cosineSimilarity(vectorA, vectorB) {
  const dot = vectorA.reduce((sum, value, index) => sum + value * (vectorB[index] || 0), 0);
  const magA = Math.sqrt(vectorA.reduce((sum, value) => sum + value * value, 0));
  const magB = Math.sqrt(vectorB.reduce((sum, value) => sum + value * value, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

module.exports = { embedText, cosineSimilarity };
