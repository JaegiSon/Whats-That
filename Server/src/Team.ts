class Team {
    id: string;
    score: number;
    constructor(id: string, score: number) {
      this.id = id;
      this.score = 0;
    }
    describe() {
      return { id: this.id, score: this.score };
    }
  }
  
  export default Team;
  