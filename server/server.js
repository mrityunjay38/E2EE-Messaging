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

const onlineUsers = [];

/* Start-Enable cors + set static frontend */
app.use(cors());
// app.use(express.static(path.join(__dirname, "../app/build")));
/* End-Enable cors + set static frontend */

// app.get("/", (req, res) => {
//   res.sendFile(__dirname, "../app/build" + "/index.html");
// });

io.on("connection", (socket) => {
  const username = socket?.handshake?.auth?.username;
  const userInfo = { username, id: socket?.id };
  onlineUsers.push(userInfo);
  io.sockets.emit("online_users", onlineUsers);

  initSocketListeners(socket);
});

function initSocketListeners(socket) {
  socket.on("to_user", ({ message, to, username }) => {
    socket
      .to(to)
      .emit("on_message", {
        message,
        from: socket?.id,
        username: socket?.handshake?.auth?.username,
      });
  });
}

server.listen(3001, () => {
  console.log("listening on *:3001");
});
