const { z } = require("zod");

const taskSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200).trim(),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000).trim(),
  subject: z.string().min(1, "Subject is required"),
  educationLevel: z.string().min(1, "Education level is required"),
  preferredGender: z.enum(["Any", "Male", "Female", "Other"]).default("Any"),
  sessionMode: z.enum(["Live", "In-Person"]).default("Live"),
  duration: z.string().max(100).optional(),
});

module.exports = { taskSchema };
