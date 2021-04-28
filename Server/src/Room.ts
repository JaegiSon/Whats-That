import User from './User';
import setting from './Settings';
import fs from 'fs';

//list of words in the app to array of string
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
  correctGuess: boolean;
  
  constructor() {
    this.users = [];
    this.gameStarted = false;
    this.currentUser = 0;
    this.turnTimer = null;
    this.chosenWord = this.pickRandomWord();
    this.correctGuess = false;
  }

  isFull(): boolean {
    return this.users.length === setting.MAX_PLAYERS;
  }

  addUser(user: User): void {
    if (this.users.length > setting.MAX_PLAYERS) {
      throw new Error('too many players');
    }
    this.users.push(user);
    user.position=this.users.length //assign position in order of player entering
    this.sendData('userJoin', user.describe()); //send data to client of new user
    //inform all users in the room of new user
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
    /*
    Send drawing to:
    1. user who is directly behind the current user in the queue
    2. user who has already draw in this round
     */
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
//send message to users
  sendChat(msg: ChatMsg, excludedUser?: User) {
    this.sendData('chatMsg', msg, excludedUser);
  }
//choose random word
  pickRandomWord(): string {
    return words[Math.floor(Math.random() * words.length)];
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
  drawStart(): void{
    //send draw round data except the chosen word to all user except current user
    this.sendData('drawStart',{
      socketId: this.users[this.currentUser].id,
      startTime: Date.now(),
      timeToComplete: setting.TIME_PER_DRAW,
      word: this.chosenWord.replace(/./gs, '*') //use regex to replace the words with *
    })
    //send draw round data including word to current user
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
    //after turn time, finish drawing turn
    this.turnTimer=setTimeout(()=>{
        this.sendData('drawEnd', 1);
        this.nextTurn();
    }, setting.TIME_PER_DRAW)
    
  }
  //similar to drawStart() --> but use below function to invoke last players turn.
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
      msg: `${this.users[this.currentUser].username} - Take a guess at what your comrades drew!`,
      type: 'alert',
    })
    this.turnTimer=setTimeout(()=>{
        this.sendData('drawEnd', 1);
        this.currentUser=-1;
        this.chosenWord=this.pickRandomWord()
        this.sendChat({type: 'alert', msg: `The next round will start in ${setting.WAIT_TIME / 1000} seconds`})
        setTimeout(()=>{
          this.rotateUsers()  //shuffle users in the queue
          this.sendData('shuffle', this.getPositions(this.currentUser, this.users)) //send position data to client to re-render
          this.nextTurn()
        }, setting.WAIT_TIME)
    }, setting.TIME_TO_GUESS)
  }
  //to loop game
  nextTurn(){
    if (this.currentUser + 2 === this.users.length) {
      this.currentUser++
      this.guessWord();
    }
    else {
      this.currentUser++;
      this.drawStart();
    }
  }
  setCorrectGuess(answer:boolean){
    this.correctGuess=answer;
  }
}