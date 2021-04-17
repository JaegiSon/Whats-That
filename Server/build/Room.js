"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = __importDefault(require("./config"));
var Round_1 = __importDefault(require("./Round"));
var Room = /** @class */ (function () {
    function Room() {
        this.users = [];
        this.drawingState = [];
        this.gameStarted = false;
        this.activeUserIdx = 0;
        this.round = null;
        this.endRoundTimeOut = null;
    }
    Room.prototype.isFull = function () {
        return this.users.length === config_1.default.MAX_PLAYERS_PER_ROOM;
    };
    Room.prototype.getActiveUser = function () {
        return this.users[this.activeUserIdx];
    };
    Room.prototype.addUser = function (user) {
        if (this.users.length > config_1.default.MAX_PLAYERS_PER_ROOM) {
            throw new Error('too many players');
        }
        this.users.push(user);
        this.broadcast('userJoin', user.describe());
        this.broadcastChatMsg({
            type: 'good',
            msg: user.username + " has joined the game",
        });
    };
    Room.prototype.removeUser = function (user) {
        this.users = this.users.filter(function (usr) { return usr.id !== user.id; });
        this.broadcastChatMsg({
            type: 'bad',
            msg: user.username + " has left the game",
        });
        this.broadcast('userLeave', user.describe());
    };
    Room.prototype.broadcast = function (msg, payload, excludedUser) {
        if (excludedUser === void 0) { excludedUser = undefined; }
        this.users.forEach(function (user) {
            if (!excludedUser || (excludedUser && user.id !== excludedUser.id)) {
                user.socket.emit(msg, payload);
            }
        });
    };
    Room.prototype.addToDrawingState = function (drawing) {
        this.drawingState.push(drawing);
    };
    Room.prototype.clearDrawingState = function () {
        this.drawingState = [];
    };
    Room.prototype.startGame = function () {
        this.broadcast('gameStart', 1);
        this.gameStarted = true;
    };
    Room.prototype.endGame = function () {
        this.broadcast('gameEnd', 1);
    };
    Room.prototype.getRoundInfo = function () {
        if (!this.round) {
            throw new Error();
        }
        return {
            socketId: this.getActiveUser().id,
            startTime: this.round.startTime,
            timeToComplete: this.round.timeToComplete,
            word: this.round.word,
        };
    };
    Room.prototype.startRound = function () {
        var _this = this;
        this.round = new Round_1.default();
        var roundInfo = this.getRoundInfo();
        this.broadcast('roundStart', __assign(__assign({}, roundInfo), { word: roundInfo.word.replace(/./gs, '_') }));
        this.getActiveUser().socket.emit('roundStart', roundInfo);
        this.broadcastChatMsg({
            msg: "It is " + this.getActiveUser().username + "'s turn to draw",
            type: 'alert',
        });
        this.endRoundTimeOut = setTimeout(function () {
            _this.endRound();
            setTimeout(function () { return _this.startNextRound(); }, config_1.default.ROUND_DELAY);
        }, this.round.timeToComplete);
    };
    Room.prototype.endRound = function (activeUser) {
        if (!activeUser) {
            activeUser = this.getActiveUser();
        }
        if (!activeUser) {
            return;
        }
        if (!this.round) {
            return;
        }
        this.broadcast('wordReveal', this.round.word);
        this.broadcast('roundEnd', 1);
        this.round.isActive = false;
        var roundScores = this.round.getScores(activeUser.id, this.users);
        this.broadcast('roundScores', roundScores);
        for (var _i = 0, _a = this.users; _i < _a.length; _i++) {
            var user = _a[_i];
            user.score += roundScores[user.id];
        }
    };
    Room.prototype.startNextRound = function () {
        this.activeUserIdx++;
        this.drawingState = [];
        if (this.activeUserIdx >= this.users.length) {
            this.endGame();
        }
        else {
            this.startRound();
        }
    };
    Room.prototype.broadcastChatMsg = function (msg, excludedUser) {
        this.broadcast('chatMsg', msg, excludedUser);
    };
    Room.prototype.broadcastChatMsgToCorrectGuessers = function (msg) {
        var _this = this;
        var correctGuessers = this.users.filter(function (user) { var _a; return (_a = _this.round) === null || _a === void 0 ? void 0 : _a.didUserGuess(user.id); });
        correctGuessers.push(this.getActiveUser());
        correctGuessers.forEach(function (user) { return user.socket.emit('chatMsg', msg); });
    };
    Room.prototype.getUsersState = function () {
        return this.users.map(function (user) { return user.describe(); });
    };
    return Room;
}());
exports.default = Room;
