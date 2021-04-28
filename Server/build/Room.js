"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Settings_1 = __importDefault(require("./Settings"));
var fs_1 = __importDefault(require("fs"));
//list of words in the app to array of string
var words = JSON.parse(fs_1.default.readFileSync(__dirname + "/../words.json").toString());
var Room = /** @class */ (function () {
    function Room() {
        this.users = [];
        this.gameStarted = false;
        this.currentUser = 0;
        this.turnTimer = null;
        this.chosenWord = this.pickRandomWord();
        this.correctGuess = false;
    }
    Room.prototype.isFull = function () {
        return this.users.length === Settings_1.default.MAX_PLAYERS;
    };
    Room.prototype.addUser = function (user) {
        if (this.users.length > Settings_1.default.MAX_PLAYERS) {
            throw new Error('too many players');
        }
        this.users.push(user);
        user.position = this.users.length; //assign position in order of player entering
        this.sendData('userJoin', user.describe()); //send data to client of new user
        //inform all users in the room of new user
        this.sendChat({
            type: 'good',
            msg: user.username + " has joined the game",
        });
    };
    Room.prototype.gameStart = function () {
        this.sendData('gameStart', 1);
        this.gameStarted = true;
    };
    Room.prototype.endGame = function () {
        this.sendData('gameEnd', 1);
    };
    Room.prototype.getcurrentUser = function () {
        return this.users[this.currentUser];
    };
    //Sends data to all users except the current user
    Room.prototype.sendData = function (msg, payload, excludedUser) {
        if (excludedUser === void 0) { excludedUser = undefined; }
        this.users.forEach(function (user) {
            if (!excludedUser || (excludedUser && user.id !== excludedUser.id)) {
                user.socket.emit(msg, payload);
            }
        });
    };
    /*
    Send drawing to:
    1. user who is directly behind the current user in the queue
    2. user who has already draw in this round
     */
    Room.prototype.sendDrawing = function (msg, payload, excludedUser) {
        if (excludedUser === void 0) { excludedUser = undefined; }
        this.users.forEach(function (user) {
            if (!excludedUser || (excludedUser && user.id !== excludedUser.id)) {
                if (!excludedUser || user.position - 1 === excludedUser.position || user.position < excludedUser.position) {
                    user.socket.emit(msg, payload);
                }
            }
        });
    };
    //send message to users
    Room.prototype.sendChat = function (msg, excludedUser) {
        this.sendData('chatMsg', msg, excludedUser);
    };
    //choose random word
    Room.prototype.pickRandomWord = function () {
        return words[Math.floor(Math.random() * words.length)];
    };
    Room.prototype.rotateUsers = function () {
        this.users.sort(function () { return .5 - Math.random(); });
        for (var i = 0; i < this.users.length; i++) {
            this.users[i].position = i + 1;
        }
    };
    Room.prototype.getPositions = function (currentUser, users) {
        var userPositions = {};
        for (var _i = 0, users_1 = users; _i < users_1.length; _i++) {
            var user = users_1[_i];
            userPositions[user.id] = user.position;
        }
        return userPositions;
    };
    Room.prototype.drawStart = function () {
        var _this = this;
        //send draw round data except the chosen word to all user except current user
        this.sendData('drawStart', {
            socketId: this.users[this.currentUser].id,
            startTime: Date.now(),
            timeToComplete: Settings_1.default.TIME_PER_DRAW,
            word: this.chosenWord.replace(/./gs, '*') //use regex to replace the words with *
        });
        //send draw round data including word to current user
        this.users[0].socket.emit('drawStart', {
            socketId: this.users[this.currentUser].id,
            startTime: Date.now(),
            timeToComplete: Settings_1.default.TIME_PER_DRAW,
            word: this.chosenWord
        });
        this.sendChat({
            msg: "It is " + this.users[this.currentUser].username + "'s turn to draw",
            type: 'alert',
        });
        //after turn time, finish drawing turn
        this.turnTimer = setTimeout(function () {
            _this.sendData('drawEnd', 1);
            _this.nextTurn();
        }, Settings_1.default.TIME_PER_DRAW);
    };
    //similar to drawStart() --> but use below function to invoke last players turn.
    Room.prototype.guessWord = function () {
        var _this = this;
        this.sendData('guessWord', {
            socketId: this.users[this.currentUser].id,
            startTime: Date.now(),
            timeToComplete: Settings_1.default.TIME_TO_GUESS,
        });
        this.users[this.currentUser].socket.emit('guessWord', {
            socketId: this.users[this.currentUser].id,
            startTime: Date.now(),
            timeToComplete: Settings_1.default.TIME_TO_GUESS,
        });
        this.sendChat({
            msg: this.users[this.currentUser].username + " - Take a guess at what your comrades drew!",
            type: 'alert',
        });
        this.turnTimer = setTimeout(function () {
            _this.sendData('drawEnd', 1);
            _this.currentUser = -1;
            _this.chosenWord = _this.pickRandomWord();
            _this.sendChat({ type: 'alert', msg: "The next round will start in " + Settings_1.default.WAIT_TIME / 1000 + " seconds" });
            setTimeout(function () {
                _this.rotateUsers(); //shuffle users in the queue
                _this.sendData('shuffle', _this.getPositions(_this.currentUser, _this.users)); //send position data to client to re-render
                _this.nextTurn();
            }, Settings_1.default.WAIT_TIME);
        }, Settings_1.default.TIME_TO_GUESS);
    };
    //to loop game
    Room.prototype.nextTurn = function () {
        if (this.currentUser + 2 === this.users.length) {
            this.currentUser++;
            this.guessWord();
        }
        else {
            this.currentUser++;
            this.drawStart();
        }
    };
    Room.prototype.setCorrectGuess = function (answer) {
        this.correctGuess = answer;
    };
    return Room;
}());
exports.default = Room;
