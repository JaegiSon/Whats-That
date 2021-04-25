import express from 'express';
import User from './User';
import setting from './Settings';
import fs from 'fs';

export type ChatMsg = { msg: string; type: string; username?: string };

const words: string[] = JSON.parse(
  fs.readFileSync(`${__dirname}/../words.json`).toString()
);

let chosenWord=pickRandomWord()
let room: User[] = [];
// let drawing: any = []
let currentUser: number = 0;
let turnTimer: NodeJS.Timeout | null;

//Sends data to all users except the current user
function sendData(
  msg: string,
  payload: unknown,
  excludedUser: User | undefined = undefined
): void {
  room.forEach((user: User): void => {
    if (!excludedUser || (excludedUser && user.id !== excludedUser.id)) {
      user.socket.emit(msg, payload);
    }
  });
}
function sendChat(msg: ChatMsg, excludedUser?: User) {
  sendData('chatMsg', msg, excludedUser);
}

function pickRandomWord(): string {
  return words[Math.floor(Math.random() * words.length)];
}

function drawStart(word?: string): void{
  sendData('drawStart',{
    socketId: room[currentUser].id,
    startTime: Date.now(),
    timeToComplete: setting.TIME_PER_DRAW,
    word: word?.replace(/./gs, '_') //use regex to replace the words with _
  })
  room[0].socket.emit('drawStart', {
    socketId: room[currentUser].id,
    startTime: Date.now(),
    timeToComplete: setting.TIME_PER_DRAW,
    word: word
  })
  sendChat({
    msg: `It is ${room[currentUser].username}'s turn to draw`,
    type: 'alert',
  })
  turnTimer=setTimeout(()=>{
      sendData('roundEnd', 1);
      nextTurn()
  }, setting.TIME_PER_DRAW)
}

function guessWord(word?: string): void{
  sendData('guessWord',{
    socketId: room[currentUser].id,
    startTime: Date.now(),
    timeToComplete: setting.TIME_TO_GUESS,
    
  })
  room[0].socket.emit('guessWord', {
    socketId: room[currentUser].id,
    startTime: Date.now(),
    timeToComplete: setting.TIME_TO_GUESS,
    
  })
  sendChat({
    msg: `${room[currentUser].username}' HAS TO GUESS NOW`,
    type: 'alert',
  })
  turnTimer=setTimeout(()=>{
      sendData('roundEnd', 1);
      currentUser=-1;
      chosenWord=pickRandomWord()
      sendChat({type: 'alert', msg: `The next round will start in ${setting.WAIT_TIME / 1000} seconds`})
      setTimeout(()=>{
        nextTurn()
      }, setting.WAIT_TIME)
      
  }, setting.TIME_TO_GUESS)
}

function nextTurn(){
  if (currentUser + 2  === room.length) {
    currentUser++
    guessWord(chosenWord);
  }
  else {
    currentUser++;
    // drawing = [];
    drawStart(chosenWord);
  }
}

//CREATE SERVER
const app = express();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, (): void => {
  console.log(`server listening on ${PORT}`);
});
const io: SocketIO.Socket = require('socket.io')(server);

//CREATE A ROOM
io.on('connection', (socket: SocketIO.Socket): void => {

//CREATEA A NEW USER USING PASSED THROUGH SOCKET DETAIL
  const user = new User(socket.id, socket, socket.handshake.query.username);

  room.push(user);
  sendData('userJoin', user.describe())
  sendChat({
    type: 'good',
    msg: `${user.username} has joined the game`,
  })
  socket.emit('usersState', room.map((user: User) => user.describe()));

  if (room.length === setting.MIN_PLAYERS) {
    sendData('gameStart',1)
    
    drawStart(chosenWord)

  }

  //if the room has not enough players, send message informing that room requires more players with half a second delay
  if (room.length < setting.MIN_PLAYERS) {
    setTimeout(
      () =>
        sendChat({
          type: 'alert',
          msg: `need ${
            setting.MIN_PLAYERS - room.length
          } more player(s) to start the game`,
        }),
      50    
    );
  }

  socket.on('lineDraw', (msg): void => {
    if (room[currentUser].id === user.id) {
      // drawing.push(msg);
      sendData('lineDraw', msg, user);
    }
  });

  socket.on('chatMsg', (msg): void => {
    if (chosenWord === msg.msg) {
      user.socket.emit('chatMsg', {
        msg: msg.msg,
        type: 'good',
        username: user.username,
      });
      sendChat({
        type: 'good',
        msg: `${user.username} has guessed correctly! The word ${chosenWord} was  Good Job`,
      });
      sendData('correctGuess',1)
    }else{
      sendChat({ ...msg, username: user.username })
    }
  })
  
  
  socket.on('disconnect', (): void => {
    const turnUser = room[currentUser]
  //   const activeUser = room.getActiveUser();
  //   room.removeUser(user);
  //   if (room.users.length < config.MIN_PLAYERS_PER_ROOM) {
  //     if (room.gameStarted) {
  //       room.endGame();
  //       rooms = rooms.filter((rm) => room !== rm);
  //       return;
  //     }
  //   }
      if(room[currentUser].id===user.id){
        clearTimeout(turnTimer as NodeJS.Timeout);

      } 
  //   if (activeUser && activeUser.id === user.id) {
  //     room.activeUserIdx--;
  //     clearTimeout(room.endRoundTimeOut as NodeJS.Timeout);
  //     room.endRound(activeUser);
  //     room.endRoundTimeOut = setTimeout(
  //       () => room.startNextRound(),
  //       config.ROUND_DELAY
  //     );
  //   }
  });
});
