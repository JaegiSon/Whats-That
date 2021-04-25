import React from 'react';
import { GameContext, GameContextProps } from '../providers/GameProvider';

const PlayerBoard: React.FC = () => {
  //pull in state data from provider components
  const { users, activeUserId } = React.useContext(
    GameContext
  ) as GameContextProps;
  let action: string = ""

  //sort users based on their position 
  users.sort((userA, userB) => {
    if (userA.position > userB.position) {
      return 1;
    } else if (userA.position < userB.position) {
      return -1;
    } else {
      return 0;
    }
  });
  //map to store user positiosn
  const positions: Record<string, number> = {};
//For each user calculate what action the user is to do and place them in position order
  users.forEach((user, idx) => (
    positions[user.id] = idx + 1));
    return (
      <div id="players">
        <h2>Players</h2>
        {users.map((user) => {
          if(positions[user.id]==1){
            action = "Draw Word"
          }else if(positions[user.id]==users.length){
            action = "Guess"
          }else(
            action = "Draw"
          )
          return (
            <div>
              <div className="action">{action}</div>
              <div className="names">
                <b>{user.username}</b>
                {user.id === activeUserId && <span id="pencil">&#128161;</span>}
              </div>
            </div>
          );
        })}
      </div>
  );
};
export default PlayerBoard;
