import '../App.css';
import React from 'react';
import DrawingBoard from './DrawingBoard';
import DrawingBoardProvider from '../providers/DrawingBoardProvider';
import RoundInfo from './Round';
import Chatbox from './Chatbox';
import PlayerBoard from './PlayerBoard';
import { GameContext, GameContextProps } from '../providers/GameProvider';


const Game: React.FC = () => {
  //destructure object received in from GameContext and take the property required in this FC
  const {drawingPermission} = React.useContext(GameContext) as GameContextProps;
  return (
    <>
      <RoundInfo></RoundInfo>
      <div id="game-container">
        <DrawingBoardProvider>
          <PlayerBoard></PlayerBoard>
          <DrawingBoard></DrawingBoard>
          {drawingPermission}
        </DrawingBoardProvider>
        <Chatbox></Chatbox>
      </div>
    </>
  );
};

export default Game;
