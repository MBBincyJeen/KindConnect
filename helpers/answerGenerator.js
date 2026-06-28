async function safeFetch(...args) {
  if (globalThis.fetch) return globalThis.fetch(...args);
  const { default: fetch } = await import("node-fetch");
  return fetch(...args);
}

async function generateAnswer({ question, contextText, apiKey, model = "gpt-4o-mini" }) {
  if (!apiKey) {
    throw new Error("Missing OpenAI API key. Set OPENAI_API_KEY in your environment.");
  }

  const prompt = `You are a helpful assistant that answers questions using only the provided document excerpts. If the answer is not contained in the text, say "I don't know based on the uploaded documents."\n\nContext:\n${contextText}\n\nQuestion: ${question}\nAnswer:`;

  const response = await safeFetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "You are a helpful assistant that only uses the provided context." },
        { role: "user", content: prompt },
      ],
      max_tokens: 450,
      temperature: 0,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Answer generation failed (${response.status}): ${data.error?.message || JSON.stringify(data)}`);
  }
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Answer generation failed");
  }
  return data.choices[0].message.content.trim();
}

module.exports = { generateAnswer };
