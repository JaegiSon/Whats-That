import express from 'express';
import User from './User';
import Room from './Room'
import setting from './Settings';


export type ChatMsg = { msg: string; type: string; username?: string };


//CREATE SERVER
const app = express();
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, (): void => {
  console.log(`server listening on ${PORT}`);
});
//Create instance of socket object required
const io: SocketIO.Socket = require('socket.io')(server);
//Create array of rooms 
let rooms: Room[] = []

io.on('connection', (socket: SocketIO.Socket): void => {
  //if there are no rooms yet, create room
  if(rooms.length === 0){ 
    rooms.push(new Room())
  }
  //if there is a room but the room is full, make another room
  let roomID = rooms.findIndex((room) => !room.isFull()); 
  if (roomID === -1) {
    rooms.push(new Room());
    roomID = rooms.length - 1;
  }
  //Set the room this session will be working with
  const room = rooms[roomID]

//CREATEA A NEW USER USING PASSED THROUGH SOCKET DETAIL
  const user = new User(socket.id, socket, socket.handshake.query.username);
  room.addUser(user);

//Send user data to client
  socket.emit('usersState', room.users.map((user: User) => user.describe()));

//if the room has enough players, start the game in the room
  if (room.users.length === setting.MIN_PLAYERS) {
    room.gameStart();
    room.drawStart()
  }

  //if the room has not enough players, send message informing that room requires more players with half a second delay
  if (room.users.length < setting.MIN_PLAYERS) {
    setTimeout(
      () =>
        room.sendChat({
          type: 'alert',
          msg: `need ${
            setting.MIN_PLAYERS - room.users.length
          } more player(s) to start the game`,
        }),
      50    
    );
  }
  //On receipt of drawing data, send the data to users who should receive it
  socket.on('lineDraw', (msg): void => {
    if (room.getcurrentUser().id === user.id) {
      room.sendDrawing('lineDraw', msg, user);
    }
  });
//on receipt of any messages, check if message = word
//if yes, send success message
//if not, send chat to everyone
  socket.on('chatMsg', (msg): void => {
    if (room.chosenWord === msg.msg) {
      room.sendChat({
        type: 'good',
        msg: `${user.username} has guessed correctly! The word was "${room.chosenWord}". Good job team!!!`,
      });
      room.sendData('correctGuess',1)
    }else{
      room.sendChat({ ...msg, username: user.username })
    }
  })
  
});
