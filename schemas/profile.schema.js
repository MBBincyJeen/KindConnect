const { z } = require("zod");

const updateProfileSchema = z.object({
  aboutMe: z.string().max(1000).optional(),
  subjects: z.union([z.array(z.string()), z.string()]).optional(),
});

module.exports = { updateProfileSchema };
