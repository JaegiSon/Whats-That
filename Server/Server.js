import {User} from "./User.js";

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*'
  }
});

app.use(express.static("public"));

io.sockets.on("connection", socket => {
  const user= new user(socket.id, socket, socket.handshake.query.username)

  console.log(user.username+ " has connected!");
  socket.on('canvas-data', (data) => {
      socket.broadcast.emit('canvas-data', data)
  })
});



console.log("Server started.");
server.listen(5000);
