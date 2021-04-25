"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var User = /** @class */ (function () {
    function User(id, socket, username) {
        this.id = id;
        this.socket = socket;
        this.username = username;
        this.position = 0;
    }
    User.prototype.describe = function () {
        return { id: this.id, username: this.username, position: this.position };
    };
    return User;
}());
exports.default = User;
