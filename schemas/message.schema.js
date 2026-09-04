const { z } = require("zod");

const sendMessageSchema = z.object({
  text: z.string().max(5000, "Message too long").optional(),
});

const markReadSchema = z.object({
  messageIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1, "At least one message ID required"),
});

module.exports = { sendMessageSchema, markReadSchema };
