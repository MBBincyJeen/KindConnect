const { z } = require("zod");

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30).regex(/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
  fullName: z.string().min(2, "Full name is required").max(100).trim(),
  aadhaarNumber: z.string().regex(/^\d{4}\s?\d{4}\s?\d{4}$/, "Invalid Aadhaar format (12 digits)"),
  role: z.enum(["Teacher", "Student"], { errorMap: () => ({ message: "Role must be Teacher or Student" }) }),
  gender: z.enum(["Male", "Female", "Other"]),
  educationLevel: z.string().min(1, "Education level is required"),
  subjects: z.array(z.string()).optional(),
  location: z.string().min(1, "Location is required"),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
});

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

module.exports = { registerSchema, loginSchema };
