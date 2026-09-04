const request = require("supertest");
const mongoose = require("mongoose");
const { app, server } = require("../../server");
const User = require("../../models/User");
const Task = require("../../models/Task");

describe("Task Routes", () => {
  let studentAgent;
  let studentId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kindconnect_test");

    const student = await User.create({
      username: "taskstudent",
      password: "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12",
      fullName: "Task Student",
      role: "Student",
      gender: "Male",
      aadhaarNumber: "789012345678",
      aadhaarVerified: true,
      educationLevel: "10th",
      locationName: "Pune",
    });
    studentId = student._id;

    studentAgent = request.agent(app);
    await studentAgent.post("/login").send({ username: "taskstudent", password: "password123" });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Task.deleteMany({});
    await mongoose.disconnect();
    server.close();
  });

  describe("GET /add-task", () => {
    it("renders task creation form for students", async () => {
      const res = await studentAgent.get("/add-task");
      expect(res.status).toBe(200);
      expect(res.text).toContain("add-task");
    });
  });

  describe("POST /add-task", () => {
    it("creates a tutoring request", async () => {
      const res = await studentAgent
        .post("/add-task")
        .send({
          title: "Need Math Help",
          description: "I need help with algebra and calculus for my upcoming exam",
          subject: "Mathematics",
          educationLevel: "10th",
          preferredGender: "Any",
          sessionMode: "Live",
          duration: "2 hours",
        });
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/\/recommendations\//);
    });

    it("rejects unsafe content", async () => {
      const res = await studentAgent
        .post("/add-task")
        .send({
          title: "Party invite",
          description: "Come join our party, no tutoring needed",
          subject: "Other",
          educationLevel: "10th",
        });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /your-tasks", () => {
    it("loads tasks taken by current user", async () => {
      const res = await studentAgent.get("/your-tasks");
      expect(res.status).toBe(200);
    });
  });
});
