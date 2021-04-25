"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var Settings_1 = __importDefault(require("./Settings"));
var fs_1 = __importDefault(require("fs"));
var words = JSON.parse(fs_1.default.readFileSync(__dirname + "/../words.json").toString());
var Room = /** @class */ (function () {
    function Room() {
        this.users = [];
        this.gameStarted = false;
        this.currentUser = 0;
        this.turnTimer = null;
        this.chosenWord = this.pickRandomWord();
        this.firstDrawer = 0;
    }
    Room.prototype.isFull = function () {
        return this.users.length === Settings_1.default.MAX_PLAYERS_PER_ROOM;
    };
    Room.prototype.addUser = function (user) {
        if (this.users.length > Settings_1.default.MAX_PLAYERS_PER_ROOM) {
            throw new Error('too many players');
        }
        this.users.push(user);
        user.position = this.users.length;
        console.log(user.position);
        this.sendData('userJoin', user.describe());
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
    // let drawing: any = []
    //Sends data to all users except the current user
    Room.prototype.sendData = function (msg, payload, excludedUser) {
        if (excludedUser === void 0) { excludedUser = undefined; }
        this.users.forEach(function (user) {
            if (!excludedUser || (excludedUser && user.id !== excludedUser.id)) {
                user.socket.emit(msg, payload);
            }
        });
    };
    Room.prototype.sendChat = function (msg, excludedUser) {
        this.sendData('chatMsg', msg, excludedUser);
    };
    Room.prototype.pickRandomWord = function () {
        return words[Math.floor(Math.random() * words.length)];
    };
    Room.prototype.drawStart = function () {
        var _this = this;
        this.sendData('drawStart', {
            socketId: this.users[this.currentUser].id,
            startTime: Date.now(),
            timeToComplete: Settings_1.default.TIME_EACH_TURN,
            word: this.chosenWord.replace(/./gs, '_') //use regex to replace the words with _
        });
        this.users[0].socket.emit('drawStart', {
            socketId: this.users[this.currentUser].id,
            startTime: Date.now(),
            timeToComplete: Settings_1.default.TIME_EACH_TURN,
            word: this.chosenWord
        });
        this.sendChat({
            msg: "It is " + this.users[this.currentUser].username + "'s turn to draw",
            type: 'alert',
        });
        this.turnTimer = setTimeout(function () {
            _this.sendData('drawEnd', 1);
            _this.nextTurn();
        }, Settings_1.default.TIME_EACH_TURN);
    };
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
            msg: this.users[this.currentUser].username + "' - Take a guess at what your comrades drew!",
            type: 'alert',
        });
        this.turnTimer = setTimeout(function () {
            _this.sendData('drawEnd', 1);
            _this.currentUser = -1;
            _this.chosenWord = _this.pickRandomWord();
            _this.sendChat({ type: 'alert', msg: "The next round will start in " + Settings_1.default.ROUND_DELAY / 1000 + " seconds" });
            setTimeout(function () {
                _this.rotateUsers();
                _this.sendData('shuffle', _this.getPositions(_this.currentUser, _this.users));
                _this.nextTurn();
            }, Settings_1.default.ROUND_DELAY);
        }, Settings_1.default.TIME_TO_GUESS);
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
    Room.prototype.nextTurn = function () {
        if (this.currentUser + 2 === this.users.length) {
            this.currentUser++;
            this.guessWord();
        }
        else {
            this.currentUser++;
            // drawing = [];
            this.drawStart();
        }
    };
    return Room;
}());
exports.default = Room;
