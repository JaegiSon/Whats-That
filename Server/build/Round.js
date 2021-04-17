"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var config_1 = __importDefault(require("./config"));
var words = JSON.parse(fs_1.default.readFileSync(__dirname + "/../words.json").toString());
var Round = /** @class */ (function () {
    function Round() {
        this.word = this.pickRandomWord();
        this.timeToComplete = this.word.length * config_1.default.TIME_PER_LETTER;
        this.startTime = Date.now();
        this.isActive = true;
        this.userScores = {};
        this.kickVotes = {};
    }
    Round.prototype.pickRandomWord = function () {
        return words[Math.floor(Math.random() * words.length)];
    };
    Round.prototype.didUserGuess = function (userId) {
        return Boolean(this.userScores[userId]);
    };
    Round.prototype.assignUserScore = function (userId) {
        var currTime = Date.now();
        var startTime = this.startTime;
        var multFactor = 1 - (currTime - startTime) / this.timeToComplete;
        var score = Math.round(multFactor * config_1.default.MAX_ROUND_POINTS);
        if (score < config_1.default.ROUND_POINT_THRESHOLD) {
            score = config_1.default.ROUND_POINT_THRESHOLD;
        }
        this.userScores[userId] = score;
    };
    Round.prototype.didEveryoneGuessCorrectly = function (activeUserId, users) {
        for (var _i = 0, users_1 = users; _i < users_1.length; _i++) {
            var user = users_1[_i];
            if (user.id === activeUserId) {
                continue;
            }
            if (this.userScores[user.id] === undefined) {
                return false;
            }
        }
        return true;
    };
    Round.prototype.getScores = function (activeUserId, users) {
        var userScoresFinal = {};
        var correctGuesses = 0;
        for (var _i = 0, users_2 = users; _i < users_2.length; _i++) {
            var user = users_2[_i];
            if (user.id === activeUserId) {
                continue;
            }
            var score = this.userScores[user.id];
            if (score !== undefined) {
                correctGuesses++;
                userScoresFinal[user.id] = this.userScores[user.id];
            }
            else {
                userScoresFinal[user.id] = 0;
            }
        }
        userScoresFinal[activeUserId] = Math.round((correctGuesses / (users.length - 1)) * config_1.default.MAX_ROUND_POINTS);
        return userScoresFinal;
    };
    Round.prototype.getVoteKicks = function (users) {
        var numVotes = 0;
        for (var _i = 0, users_3 = users; _i < users_3.length; _i++) {
            var user = users_3[_i];
            if (this.kickVotes[user.id]) {
                numVotes++;
            }
        }
        return numVotes;
    };
    return Round;
}());
exports.default = Round;
