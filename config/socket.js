const { Server } = require("socket.io");
const Task = require("../models/Task");

function createSocketServer(server, sessionMiddleware) {
  const io = new Server(server, {
    cors: { origin: true, credentials: true },
  });

  io.engine.use(sessionMiddleware);

  io.on("connection", (socket) => {
    const user = socket.request.session?.user;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    socket.on("joinUserRoom", (userId) => {
      socket.join(userId.toString());
    });

    socket.on("joinRoom", (taskId) => {
      socket.join(taskId.toString());
    });

    socket.on("typing", (data) => {
      socket.to(data.taskId.toString()).emit("userTyping", { username: data.username });
    });

    socket.on("stopTyping", (data) => {
      socket.to(data.taskId.toString()).emit("userStopTyping");
    });

    socket.on("reconnect", async () => {
      socket.join(user.id.toString());
      try {
        const activeTasks = await Task.find({
          $or: [{ postedById: user.id }, { takenById: user.id }],
          status: "In Progress",
        }).select("_id");
        activeTasks.forEach((t) => socket.join(t._id.toString()));
      } catch (err) {
        console.error("Rejoin rooms error:", err);
      }
    });

    socket.on("ping", (cb) => {
      if (typeof cb === "function") cb({ ts: Date.now(), userId: user.id });
    });

    socket.on("messageDelivered", (data) => {
      socket.to(data.taskId.toString()).emit("messageDelivered", { messageId: data.messageId });
    });

    socket.on("messagesRead", (data) => {
      socket.to(data.taskId.toString()).emit("messagesRead", { messageIds: data.messageIds });
    });

    socket.on("join-session", async (taskId) => {
      const room = `session-${taskId}`;
      await socket.join(room);
      const sockets = await io.in(room).allSockets();
      const socketIds = [...sockets];

      if (socketIds.length === 2) {
        const [firstSocketId, secondSocketId] = socketIds;
        io.to(firstSocketId).emit("session-start", { initiator: true, taskId });
        io.to(secondSocketId).emit("session-start", { initiator: false, taskId });
      } else if (socketIds.length > 2) {
        socket.emit("session-start", { initiator: false, taskId });
      }
    });

    socket.on("signal", (data) => {
      const room = `session-${data.taskId}`;
      socket.to(room).emit("signal", data);
    });
  });

  return io;
}

module.exports = { createSocketServer };
