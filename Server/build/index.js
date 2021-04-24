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
var User_1 = __importDefault(require("./User"));
var Room_1 = __importDefault(require("./Room"));
var Settings_1 = __importDefault(require("./Settings"));
//random word
//CREATE SERVER
var app = express_1.default();
var PORT = process.env.PORT || 5000;
var server = app.listen(PORT, function () {
    console.log("server listening on " + PORT);
});
var io = require('socket.io')(server);
var rooms = [];
//CREATE A ROOM
io.on('connection', function (socket) {
    if (rooms.length === 0) {
        rooms.push(new Room_1.default());
    }
    var roomID = rooms.findIndex(function (room) { return !room.isFull(); });
    if (roomID === -1) {
        rooms.push(new Room_1.default());
        roomID = rooms.length - 1;
    }
    var room = rooms[roomID];
    //CREATEA A NEW USER USING PASSED THROUGH SOCKET DETAIL
    var user = new User_1.default(socket.id, socket, socket.handshake.query.username);
    room.addUser(user);
    socket.emit('usersState', room.users.map(function (user) { return user.describe(); }));
    //if the room has enough players, start the game in the room
    if (room.users.length === Settings_1.default.MIN_PLAYERS_PER_ROOM) {
        room.gameStart();
        room.drawStart();
    }
    //if the room has not enough players, send message informing that room requires more players with half a second delay
    if (room.users.length < Settings_1.default.MIN_PLAYERS_PER_ROOM) {
        setTimeout(function () {
            return room.sendChat({
                type: 'alert',
                msg: "need " + (Settings_1.default.MIN_PLAYERS_PER_ROOM - room.users.length) + " more player(s) to start the game",
            });
        }, 50);
    }
    socket.on('lineDraw', function (msg) {
        if (room.getcurrentUser().id === user.id) {
            // drawing.push(msg);
            room.sendData('lineDraw', msg, user);
        }
    });
    socket.on('chatMsg', function (msg) {
        if (room.chosenWord === msg.msg) {
            room.sendChat({
                type: 'good',
                msg: user.username + " has guessed correctly! The word was " + room.chosenWord + ". Good job team!!!",
            });
            room.sendData('correctGuess', 1);
        }
        else {
            room.sendChat(__assign(__assign({}, msg), { username: user.username }));
        }
    });
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
