class User {
    id: string;
    socket: SocketIO.Socket;
    score: number;
    username: string;
    team: boolean;
    position: number;
    constructor(id: string, socket: SocketIO.Socket, username: string) {
      this.id = id;
      this.socket = socket;
      this.score = 0;
      this.username = username;
      this.team = true;
      this.position = 0;
    }
    describe() {
      return { id: this.id, username: this.username, score: this.score };
    }
  }
  
  export default User;
  