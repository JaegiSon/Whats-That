Object.defineProperty(exports, "__esModule", { value: true });
class User {
    id
    socket
    username
    constructor(id, socket, username) {
      this.id = id;
      this.socket = socket;
      this.score = 0;
      this.username = username;
    }
    describe() {
      return { id: this.id, username: this.username};
    }
  }
  
  
  