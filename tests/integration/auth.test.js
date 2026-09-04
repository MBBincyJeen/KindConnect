const request = require("supertest");
const mongoose = require("mongoose");
const { app, server } = require("../../server");
const User = require("../../models/User");

describe("Auth Routes", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kindconnect_test");
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
    server.close();
  });

  describe("GET /", () => {
    it("redirects to /login when not authenticated", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/login");
    });
  });

  describe("GET /register", () => {
    it("renders the registration form", async () => {
      const res = await request(app).get("/register");
      expect(res.status).toBe(200);
      expect(res.text).toContain("register");
    });
  });

  describe("POST /register", () => {
    it("registers a new student with valid data", async () => {
      const res = await request(app)
        .post("/register")
        .send({
          username: "teststudent1",
          password: "password123",
          fullName: "Test Student",
          aadhaarNumber: "234567890123",
          role: "Student",
          gender: "Male",
          educationLevel: "10th",
          location: "Mumbai",
        });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/login");
    });

    it("rejects registration with missing fields", async () => {
      const res = await request(app)
        .post("/register")
        .send({ username: "test" });
      expect(res.status).toBe(200);
      expect(res.text).toContain("Fill all required fields");
    });

    it("rejects registration with invalid Aadhaar", async () => {
      const res = await request(app)
        .post("/register")
        .send({
          username: "teststudent2",
          password: "password123",
          fullName: "Test Student",
          aadhaarNumber: "123456789012",
          role: "Student",
          gender: "Male",
          educationLevel: "10th",
          location: "Mumbai",
        });
      expect(res.status).toBe(200);
      expect(res.text).toContain("Invalid Aadhaar");
    });

    it("rejects duplicate username", async () => {
      const res = await request(app)
        .post("/register")
        .send({
          username: "teststudent1",
          password: "password123",
          fullName: "Test Student",
          aadhaarNumber: "345678901234",
          role: "Student",
          gender: "Male",
          educationLevel: "10th",
          location: "Mumbai",
        });
      expect(res.status).toBe(200);
      expect(res.text).toContain("already taken");
    });
  });

  describe("POST /login", () => {
    it("logs in with valid credentials", async () => {
      const res = await request(app)
        .post("/login")
        .send({ username: "teststudent1", password: "password123" });
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/dashboard");
    });

    it("rejects invalid password", async () => {
      const res = await request(app)
        .post("/login")
        .send({ username: "teststudent1", password: "wrongpassword" });
      expect(res.status).toBe(200);
      expect(res.text).toContain("Invalid credentials");
    });

    it("rejects non-existent user", async () => {
      const res = await request(app)
        .post("/login")
        .send({ username: "nouser", password: "password123" });
      expect(res.status).toBe(200);
      expect(res.text).toContain("Invalid credentials");
    });
  });

  describe("GET /logout", () => {
    it("destroys session and redirects", async () => {
      const agent = request.agent(app);
      await agent
        .post("/login")
        .send({ username: "teststudent1", password: "password123" });
      const res = await agent.get("/logout");
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe("/login");
    });
  });
});
