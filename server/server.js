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
  onlineUsers.push({ username });
  io.sockets.emit("online_users", onlineUsers);

  // socket.on("to_server_message", ({ message = "NA" }) => {
  //   socket.broadcast.emit("client_message", { message });
  // });
});

server.listen(3001, () => {
  console.log("listening on *:3001");
});
