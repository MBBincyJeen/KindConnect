async function safeFetch(...args) {
  if (globalThis.fetch) return globalThis.fetch(...args);
  const { default: fetch } = await import("node-fetch");
  return fetch(...args);
}

function buildFallbackEmbedding(text) {
  const normalized = (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const tokens = normalized.split(/\s+/).filter(Boolean);
  const vector = new Array(64).fill(0);

  tokens.forEach((token) => {
    let hash = 0;
    for (let i = 0; i < token.length; i += 1) {
      hash = (hash * 31 + token.charCodeAt(i)) % 64;
    }
    vector[hash] += 1;
  });

  return vector;
}

async function embedText(text, { provider = "gemini", apiKey } = {}) {
  const normalized = text.trim();
  if (!normalized) return [];

  if (provider === "gemini") {
    if (!apiKey) {
      console.warn("Gemini API key missing, using local fallback embedding.");
      return buildFallbackEmbedding(normalized);
    }

    try {
      const response = await safeFetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "models/text-embedding-004",
            content: {
              parts: [{ text: normalized }],
            },
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Embedding request failed (${response.status}): ${data.error?.message || JSON.stringify(data)}`);
      }
      if (!data.embedding || !Array.isArray(data.embedding.values)) {
        throw new Error("Embedding generation failed");
      }
      return data.embedding.values;
    } catch (error) {
      console.warn("Gemini embedding unavailable, using local fallback embedding:", error.message);
      return buildFallbackEmbedding(normalized);
    }
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
