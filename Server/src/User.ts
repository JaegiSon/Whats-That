class User {
  id: string;
  socket: SocketIO.Socket;
  username: string;
  position: number;
  
  constructor(id: string, socket: SocketIO.Socket, username: string) {
    this.id = id;
    this.socket = socket;
    this.username = username;
    this.position = 0;
  }
  describe() {
    return { id: this.id, username: this.username, position: this.position };
  }
}

export default User;
