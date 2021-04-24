import express from 'express';
import User from './User';
import Room from './Room'
import setting from './Settings';
import fs from 'fs';

export type ChatMsg = { msg: string; type: string; username?: string };

//random word
//CREATE SERVER
const app = express();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, (): void => {
  console.log(`server listening on ${PORT}`);
});
const io: SocketIO.Socket = require('socket.io')(server);
let rooms: Room[] = []
//CREATE A ROOM
io.on('connection', (socket: SocketIO.Socket): void => {
  if(rooms.length === 0){
    rooms.push(new Room())
  }
  let roomID = rooms.findIndex((room) => !room.isFull());
  if (roomID === -1) {
    rooms.push(new Room());
    roomID = rooms.length - 1;
  }
  const room = rooms[roomID]
//CREATEA A NEW USER USING PASSED THROUGH SOCKET DETAIL
  const user = new User(socket.id, socket, socket.handshake.query.username);

  room.addUser(user);
  
  socket.emit('usersState', room.users.map((user: User) => user.describe()));
//if the room has enough players, start the game in the room
  if (room.users.length === setting.MIN_PLAYERS_PER_ROOM) {
    room.gameStart();
    room.drawStart()
  }

  //if the room has not enough players, send message informing that room requires more players with half a second delay
  if (room.users.length < setting.MIN_PLAYERS_PER_ROOM) {
    setTimeout(
      () =>
        room.sendChat({
          type: 'alert',
          msg: `need ${
            setting.MIN_PLAYERS_PER_ROOM - room.users.length
          } more player(s) to start the game`,
        }),
      50    
    );
  }

  socket.on('lineDraw', (msg): void => {
    if (room.getcurrentUser().id === user.id) {
      // drawing.push(msg);
      room.sendData('lineDraw', msg, user);
    }
  });

  socket.on('chatMsg', (msg): void => {
    if (room.chosenWord === msg.msg) {
      room.sendChat({
        type: 'good',
        msg: `${user.username} has guessed correctly! The word was ${room.chosenWord}. Good job team!!!`,
      });
      room.sendData('correctGuess',1)
    }else{
      room.sendChat({ ...msg, username: user.username })
    }
  })
  
  
  // socket.on('disconnect', (): void => {
  //   const turnUser = room[currentUser]
  // //   const activeUser = room.getActiveUser();
  // //   room.removeUser(user);
  // //   if (room.users.length < config.MIN_PLAYERS_PER_ROOM) {
  // //     if (room.gameStarted) {
  // //       room.endGame();
  // //       rooms = rooms.filter((rm) => room !== rm);
  // //       return;
  // //     }
  // //   }
  //     if(room[currentUser].id===user.id){
  //       clearTimeout(turnTimer as NodeJS.Timeout);

  //     } 
  // //   if (activeUser && activeUser.id === user.id) {
  // //     room.activeUserIdx--;
  // //     clearTimeout(room.endRoundTimeOut as NodeJS.Timeout);
  // //     room.endRound(activeUser);
  // //     room.endRoundTimeOut = setTimeout(
  // //       () => room.startNextRound(),
  // //       config.ROUND_DELAY
  // //     );
  // //   }
  // });
});
