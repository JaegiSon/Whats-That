import express from 'express';
import User from './User';
import setting from './Settings';
import fs from 'fs';
const words: string[] = JSON.parse(
  fs.readFileSync(`${__dirname}/../words.json`).toString()
);


export type ChatMsg = { msg: string; type: string; username?: string };

export default class Room{
  users: User[];
  gameStarted: boolean;
  currentUser: number;
  turnTimer: NodeJS.Timeout | null;
  chosenWord: string;
  firstDrawer: number;

  constructor() {
    this.users = [];
    this.gameStarted = false;
    this.currentUser = 0;
    this.turnTimer = null;
    this.chosenWord = this.pickRandomWord();
    this.firstDrawer = 0;
  }

  isFull(): boolean {
    return this.users.length === setting.MAX_PLAYERS_PER_ROOM;
  }

  addUser(user: User): void {
    if (this.users.length > setting.MAX_PLAYERS_PER_ROOM) {
      throw new Error('too many players');
    }
    this.users.push(user);
    this.sendData('userJoin', user.describe());
    this.sendChat({
      type: 'good',
      msg: `${user.username} has joined the game`,
    });
  }

  gameStart(): void {
    this.sendData('gameStart', 1);
    this.gameStarted = true;
  }
  endGame(): void {
    this.sendData('gameEnd', 1);
  }
  getcurrentUser(): User {
    return this.users[this.currentUser];
  }


  

  // let drawing: any = []
  
    

  //Sends data to all users except the current user
  sendData(
    msg: string,
    payload: unknown,
    excludedUser: User | undefined = undefined
  ): void {
    this.users.forEach((user: User): void => {
      if (!excludedUser || (excludedUser && user.id !== excludedUser.id)) {
        user.socket.emit(msg, payload);
      }
    });
  }
  sendChat(msg: ChatMsg, excludedUser?: User) {
    this.sendData('chatMsg', msg, excludedUser);
  }

  pickRandomWord(): string {
    return words[Math.floor(Math.random() * words.length)];
    
  }

  drawStart(): void{
    this.sendData('drawStart',{
      socketId: this.users[this.currentUser].id,
      startTime: Date.now(),
      timeToComplete: setting.TIME_EACH_TURN,
      word: this.chosenWord.replace(/./gs, '_') //use regex to replace the words with _
    })
    this.users[0].socket.emit('drawStart', {
      socketId: this.users[this.currentUser].id,
      startTime: Date.now(),
      timeToComplete: setting.TIME_EACH_TURN,
      word: this.chosenWord
    })
    this.sendChat({
      msg: `It is ${this.users[this.currentUser].username}'s turn to draw`,
      type: 'alert',
    })
    this.turnTimer=setTimeout(()=>{
        this.sendData('drawEnd', 1);
        this.nextTurn();
    }, setting.TIME_EACH_TURN)
    console.log("draw start iS WORKING")
  }

  guessWord(): void{
    this.sendData('guessWord',{
      socketId: this.users[this.currentUser].id,
      startTime: Date.now(),
      timeToComplete: setting.TIME_TO_GUESS,
      
    })
    this.users[this.currentUser].socket.emit('guessWord', {
      socketId: this.users[this.currentUser].id,
      startTime: Date.now(),
      timeToComplete: setting.TIME_TO_GUESS,
      
    })
    this.sendChat({
      msg: `${this.users[this.currentUser].username}' - Take a guess at what your comrades drew!`,
      type: 'alert',
    })
    this.turnTimer=setTimeout(()=>{
        this.sendData('drawEnd', 1);
        this.currentUser=-1;
        this.chosenWord=this.pickRandomWord()
        this.sendChat({type: 'alert', msg: `The next round will start in ${setting.ROUND_DELAY / 1000} seconds`})
        setTimeout(()=>{
          this.users.push(this.users[0]);
          this.nextTurn()
        }, setting.ROUND_DELAY)
    }, setting.TIME_TO_GUESS)
    console.log("GUESS start iS WORKING")
  }

  nextTurn(){
    if (this.currentUser + 2 === this.users.length) {
      this.currentUser++
      this.guessWord();
    }
    else {
      this.currentUser++;
      // drawing = [];
      this.drawStart();
    }
  }

}
