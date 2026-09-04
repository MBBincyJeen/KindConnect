const { io: ClientIO } = require("socket.io-client");
const mongoose = require("mongoose");
const { server } = require("../../server");
const User = require("../../models/User");

describe("Socket.IO Integration", () => {
  let clientSocket;
  let port;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kindconnect_test");
    port = server.address().port;
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
    server.close();
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  it("connects to the server", (done) => {
    clientSocket = ClientIO(`http://localhost:${port}`, {
      transports: ["websocket"],
    });
    clientSocket.on("connect", () => {
      expect(clientSocket.connected).toBe(true);
      done();
    });
  });

  it("disconnects unauthenticated sockets", (done) => {
    clientSocket = ClientIO(`http://localhost:${port}`, {
      transports: ["websocket"],
    });
    clientSocket.on("disconnect", () => {
      done();
    });
  });

  it("can join a room", (done) => {
    clientSocket = ClientIO(`http://localhost:${port}`, {
      transports: ["websocket"],
    });
    clientSocket.on("connect", () => {
      clientSocket.emit("joinRoom", "test-room-123");
      done();
    });
  });

  it("receives typing indicator from another client", (done) => {
    clientSocket = ClientIO(`http://localhost:${port}`, {
      transports: ["websocket"],
    });

    const secondClient = ClientIO(`http://localhost:${port}`, {
      transports: ["websocket"],
    });

    clientSocket.on("connect", () => {
      clientSocket.emit("joinRoom", "typing-test-room");
    });

    secondClient.on("connect", () => {
      secondClient.emit("joinRoom", "typing-test-room");

      clientSocket.on("userTyping", (data) => {
        expect(data.username).toBe("testuser");
        secondClient.disconnect();
        done();
      });

      secondClient.emit("typing", { taskId: "typing-test-room", username: "testuser" });
    });
  });

  it("can send and receive heartbeat ping", (done) => {
    clientSocket = ClientIO(`http://localhost:${port}`, {
      transports: ["websocket"],
    });
    clientSocket.on("connect", () => {
      clientSocket.emit("ping", (response) => {
        expect(response).toHaveProperty("ts");
        expect(typeof response.ts).toBe("number");
        done();
      });
    });
  });
});
