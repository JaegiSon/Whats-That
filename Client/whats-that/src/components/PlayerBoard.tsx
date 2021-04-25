import React from 'react';
import { GameContext, GameContextProps } from '../providers/GameProvider';

const PlayerBoard: React.FC = () => {
  const { users, activeUserId } = React.useContext(
    GameContext
  ) as GameContextProps;
  let action: string = ""

  const sortedUsers = users.sort((userA, userB) => {
    if (userA.position > userB.position) {
      return 1;
    } else if (userA.position < userB.position) {
      return -1;
    } else {
      return 0;
    }
  });
  const positions: Record<string, number> = {};

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
              <b>{user.username} POSITION {user.position}</b>
              {user.id === activeUserId && <span id="pencil">&#128393;</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PlayerBoard;
