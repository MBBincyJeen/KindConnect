const { z } = require("zod");

const reportSchema = z.object({
  targetType: z.enum(["user", "message", "task"], { errorMap: () => ({ message: "Invalid target type" }) }),
  targetId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid target ID"),
  reason: z.enum(["harassment", "inappropriate", "spam", "fake", "other"]),
  description: z.string().max(500, "Description must be under 500 characters").optional(),
});

module.exports = { reportSchema };
