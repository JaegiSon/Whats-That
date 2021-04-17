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
var express_1 = __importDefault(require("express"));
var Room_1 = __importDefault(require("./Room"));
var User_1 = __importDefault(require("./User"));
var config_1 = __importDefault(require("./config"));
var app = express_1.default();
var PORT = process.env.PORT || 5000;
var server = app.listen(PORT, function () {
    // eslint-disable-next-line no-console
    console.log("server listening on " + PORT);
});
// eslint-disable-next-line @typescript-eslint/no-var-requires
var io = require('socket.io')(server);
var rooms = [];
io.on('connection', function (socket) {
    if (rooms.length === 0) {
        rooms.push(new Room_1.default());
    }
    var roomIdx = rooms.findIndex(function (room) { return !room.isFull(); });
    if (roomIdx === -1) {
        rooms.push(new Room_1.default());
        roomIdx = rooms.length - 1;
    }
    var room = rooms[roomIdx];
    var user = new User_1.default(socket.id, socket, socket.handshake.query.username);
    room.addUser(user);
    socket.emit('usersState', room.getUsersState());
    if (room.gameStarted && room.round && room.round.isActive) {
        var roundInfo = room.getRoundInfo();
        socket.emit('gameStart');
        socket.emit('roundStart', __assign(__assign({}, roundInfo), { word: roundInfo.word.replace(/./gs, '_') }));
        socket.emit('drawingState', room.drawingState);
    }
    if (room.users.length === config_1.default.MIN_PLAYERS_PER_ROOM) {
        room.startGame();
        room.startRound();
    }
    if (room.users.length < config_1.default.MIN_PLAYERS_PER_ROOM) {
        setTimeout(function () {
            return room.broadcastChatMsg({
                type: 'alert',
                msg: "need " + (config_1.default.MIN_PLAYERS_PER_ROOM - room.users.length) + " more player(s) to start the game",
            });
        }, 50);
    }
    socket.on('lineDraw', function (msg) {
        if (room.getActiveUser().id === user.id) {
            room.addToDrawingState(msg);
            room.broadcast('lineDraw', msg, user);
        }
    });
    socket.on('chatMsg', function (msg) {
        var round = room.round;
        if (round && round.isActive && room.getActiveUser()) {
            if (user.id === room.getActiveUser().id) {
                room.broadcastChatMsgToCorrectGuessers({
                    msg: msg.msg,
                    type: 'good',
                    username: user.username,
                });
                return;
            }
            if (round.didUserGuess(user.id)) {
                room.broadcastChatMsgToCorrectGuessers({
                    msg: msg.msg,
                    type: 'good',
                    username: user.username,
                });
            }
            else {
                if (round.word === msg.msg) {
                    user.socket.emit('chatMsg', {
                        msg: msg.msg,
                        type: 'good',
                        username: user.username,
                    });
                    room.broadcastChatMsgToCorrectGuessers({
                        msg: msg.msg,
                        type: 'good',
                        username: user.username,
                    });
                    room.broadcastChatMsg({
                        type: 'good',
                        msg: user.username + " guessed the word correctly",
                    });
                    round.assignUserScore(user.id);
                    if (round.didEveryoneGuessCorrectly(room.getActiveUser().id, room.users)) {
                        clearTimeout(room.endRoundTimeOut);
                        room.endRound();
                        room.endRoundTimeOut = setTimeout(function () { return room.startNextRound(); }, config_1.default.ROUND_DELAY);
                    }
                }
                else {
                    room.broadcastChatMsg(__assign(__assign({}, msg), { username: user.username }));
                }
            }
        }
        else {
            room.broadcastChatMsg(__assign(__assign({}, msg), { username: user.username }));
        }
    });
    socket.on('voteKick', function () {
        if (room.getActiveUser() && room.round && room.round.isActive) {
            room.round.kickVotes[user.id] = true;
            var kickVotes = room.round.getVoteKicks(room.users);
            var voteRequirement = Math.ceil(room.users.length / 2);
            room.broadcastChatMsg({
                msg: "'" + user.username + "' is voting to kick out " + room.getActiveUser().username + "(" + kickVotes + "/" + voteRequirement + ")",
                type: 'warn',
            }, room.getActiveUser());
            if (kickVotes >= voteRequirement) {
                room.getActiveUser().socket.emit('kickOut', 1);
            }
        }
    });
    socket.on('disconnect', function () {
        var activeUser = room.getActiveUser();
        room.removeUser(user);
        if (room.users.length < config_1.default.MIN_PLAYERS_PER_ROOM) {
            if (room.gameStarted) {
                room.endGame();
                rooms = rooms.filter(function (rm) { return room !== rm; });
                return;
            }
        }
        if (activeUser && activeUser.id === user.id) {
            room.activeUserIdx--;
            clearTimeout(room.endRoundTimeOut);
            room.endRound(activeUser);
            room.endRoundTimeOut = setTimeout(function () { return room.startNextRound(); }, config_1.default.ROUND_DELAY);
        }
    });
});
