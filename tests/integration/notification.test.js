const request = require("supertest");
const mongoose = require("mongoose");
const { app, server } = require("../../server");
const User = require("../../models/User");
const Notification = require("../../models/Notification");

describe("Notification Routes", () => {
  let agent;
  let userId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kindconnect_test");

    const user = await User.create({
      username: "notifuser",
      password: "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ12",
      fullName: "Notif User",
      role: "Student",
      gender: "Female",
      aadhaarNumber: "678901234567",
      aadhaarVerified: true,
      educationLevel: "10th",
      locationName: "Delhi",
    });
    userId = user._id;

    agent = request.agent(app);
    await agent.post("/login").send({ username: "notifuser", password: "password123" });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Notification.deleteMany({});
    await mongoose.disconnect();
    server.close();
  });

  describe("GET /api/notifications", () => {
    it("returns notifications list", async () => {
      const res = await agent.get("/api/notifications");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("GET /api/notifications/count", () => {
    it("returns unread count", async () => {
      const res = await agent.get("/api/notifications/count");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("count");
    });
  });
});
