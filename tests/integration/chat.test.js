const request = require("supertest");
const mongoose = require("mongoose");
const { app, server } = require("../../server");
const User = require("../../models/User");
const Task = require("../../models/Task");
const Message = require("../../models/Message");

describe("Chat Routes", () => {
  let studentAgent, teacherAgent;
  let taskId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kindconnect_test");

    // Create test users
    const student = await User.create({
      username: "chatstudent",
      password: "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12",
      fullName: "Chat Student",
      role: "Student",
      gender: "Male",
      aadhaarNumber: "456789012345",
      aadhaarVerified: true,
      educationLevel: "10th",
      locationName: "Mumbai",
    });

    const teacher = await User.create({
      username: "chatteacher",
      password: "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12",
      fullName: "Chat Teacher",
      role: "Teacher",
      gender: "Male",
      aadhaarNumber: "567890123456",
      aadhaarVerified: true,
      educationLevel: "12th",
      locationName: "Mumbai",
    });

    // Create a task with studentAccepted
    const task = await Task.create({
      title: "Chat Test Task",
      description: "Test task for chat integration test",
      subject: "Mathematics",
      educationLevel: "10th",
      postedById: student._id,
      postedByName: student.username,
      postedByRole: student.role,
      takenById: teacher._id,
      takenByName: teacher.username,
      takenByRole: teacher.role,
      status: "In Progress",
      studentAccepted: true,
    });
    taskId = task._id.toString();

    // Create authenticated agents
    studentAgent = request.agent(app);
    await studentAgent
      .post("/login")
      .send({ username: "chatstudent", password: "password123" });

    teacherAgent = request.agent(app);
    await teacherAgent
      .post("/login")
      .send({ username: "chatteacher", password: "password123" });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Task.deleteMany({});
    await Message.deleteMany({});
    await mongoose.disconnect();
    server.close();
  });

  describe("GET /chat/:taskId", () => {
    it("loads chat for authorized participant", async () => {
      const res = await studentAgent.get(`/chat/${taskId}`);
      expect(res.status).toBe(200);
      expect(res.text).toContain("Chat Test Task");
    });

    it("returns 403 for unauthorized user", async () => {
      const res = await request(app).get(`/chat/${taskId}`);
      expect(res.status).toBe(302); // redirect to login
    });
  });

  describe("GET /api/messages/:taskId", () => {
    it("returns paginated messages", async () => {
      const res = await studentAgent.get(`/api/messages/${taskId}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("messages");
      expect(res.body).toHaveProperty("hasMore");
      expect(Array.isArray(res.body.messages)).toBe(true);
    });
  });

  describe("POST /api/messages/:taskId/read", () => {
    it("marks messages as read", async () => {
      // Create a message first
      const msg = await Message.create({
        taskId: taskId,
        sender: new mongoose.Types.ObjectId(),
        senderName: "testuser",
        message: "test message for read",
        timestamp: new Date(),
      });

      const res = await studentAgent
        .post(`/api/messages/${taskId}/read`)
        .send({ messageIds: [msg._id.toString()] });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
