const DocumentChunk = require("../models/DocumentChunk");
const { cosineSimilarity } = require("./embedding");

async function searchChunks({ userId, documentId, queryEmbedding, topK = 5, useMongoVector = false }) {
  if (useMongoVector) {
    try {
      const pipeline = [
        { $match: { userId, ...(documentId ? { documentId } : {}) } },
        {
          $addFields: {
            score: {
              $let: {
                vars: { queryVector: queryEmbedding },
                in: {
                  $divide: [
                    { $sum: { $map: { input: { $zip: { inputs: ["$embedding", "$$queryVector"] } }, as: "pair", in: { $multiply: ["$$pair.0", "$$pair.1"] } } } },
                    {
                      $multiply: [
                        { $sqrt: { $sum: { $map: { input: "$embedding", as: "e", in: { $multiply: ["$$e", "$$e"] } } } } },
                        { $sqrt: { $sum: { $map: { input: "$$queryVector", as: "e", in: { $multiply: ["$$e", "$$e"] } } } } }
                      ]
                    }
                  ]
                }
              }
            }
          }
        },
        { $sort: { score: -1 } },
        { $limit: topK },
      ];

      return await DocumentChunk.aggregate(pipeline).exec();
    } catch (err) {
      console.warn("Mongo vector search unavailable, falling back to cosine similarity", err.message);
    }
  }

  const chunks = await DocumentChunk.find({ userId, ...(documentId ? { documentId } : {}) }).lean();
  const scored = chunks
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding || []),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return scored;
}

module.exports = { searchChunks };
