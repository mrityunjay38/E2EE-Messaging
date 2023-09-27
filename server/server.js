const express = require("express");
const app = express();
const cors = require("cors");
const path = require("path");
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
  },
});

let onlineUsers = [];

/* Start-Enable cors */
app.use(cors());
/* End-Enable cors */

io.on("connection", (socket) => {
  const username = socket?.handshake?.auth?.username;
  const publicKey = socket?.handshake?.auth?.publicKey;
  const userInfo = { username, id: socket?.id, publicKey };
  onlineUsers.push(userInfo);
  io.sockets.emit("online_users", onlineUsers);

  initSocketListeners(socket);
});

function initSocketListeners(socket) {
  socket.on("to_user", ({ message, to, username, publicKey }) => {
    socket.to(to).emit("on_message", {
      message,
      from: socket?.id,
      username: username,
      publicKey
    });
  });

  socket.on("disconnect", function () {
    const user = onlineUsers?.findIndex((user) => user?.id === socket?.id);
    onlineUsers?.splice(user, 1);
    io.sockets.emit("online_users", onlineUsers);
  });
}

server.listen(3001, () => {
  console.log("listening on *:3001");
});
