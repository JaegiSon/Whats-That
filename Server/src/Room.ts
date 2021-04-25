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
  
  constructor() {
    this.users = [];
    this.gameStarted = false;
    this.currentUser = 0;
    this.turnTimer = null;
    this.chosenWord = this.pickRandomWord();
  }

  isFull(): boolean {
    return this.users.length === setting.MAX_PLAYERS;
  }

  addUser(user: User): void {
    if (this.users.length > setting.MAX_PLAYERS) {
      throw new Error('too many players');
    }
    this.users.push(user);
    user.position=this.users.length
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
  sendDrawing(
    msg: string,
    payload: unknown,
    excludedUser: User | undefined = undefined
  ): void {
    this.users.forEach((user: User): void => {
      if (!excludedUser || (excludedUser && user.id !== excludedUser.id)) {
        if(!excludedUser || user.position-1===excludedUser.position || user.position < excludedUser.position){
          user.socket.emit(msg, payload);}
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
      timeToComplete: setting.TIME_PER_DRAW,
      word: this.chosenWord.replace(/./gs, '*') //use regex to replace the words with _
    })
    this.users[0].socket.emit('drawStart', {
      socketId: this.users[this.currentUser].id,
      startTime: Date.now(),
      timeToComplete: setting.TIME_PER_DRAW,
      word: this.chosenWord
    })
    this.sendChat({
      msg: `It is ${this.users[this.currentUser].username}'s turn to draw`,
      type: 'alert',
    })
    this.turnTimer=setTimeout(()=>{
        this.sendData('drawEnd', 1);
        this.nextTurn();
    }, setting.TIME_PER_DRAW)
    
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
        this.sendChat({type: 'alert', msg: `The next round will start in ${setting.WAIT_TIME / 1000} seconds`})
        setTimeout(()=>{
          this.rotateUsers()
          this.sendData('shuffle', this.getPositions(this.currentUser, this.users))
          this.nextTurn()
        }, setting.WAIT_TIME)
    }, setting.TIME_TO_GUESS)
  }
  rotateUsers(){
    this.users.sort(() => .5 - Math.random());
    for (let i = 0; i < this.users.length; i++) {
      this.users[i].position=i+1
    }
  }
  getPositions(currentUser: number, users: User[]){
    const userPositions: Record<string, number>={}
    for(const user of users){
      userPositions[user.id]=user.position}
      return userPositions;
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
