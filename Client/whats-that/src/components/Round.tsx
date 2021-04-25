import React from 'react';
import Timer from './Timer';
import { GameContext, GameContextProps } from '../providers/GameProvider';

export type RoundTime = {
  timeToComplete: number;
  startTime: number;
};

const RoundInfo: React.FC = () => {
  const { isWaitingForNextRd, roundTime, word, score } = React.useContext(
    GameContext
  ) as GameContextProps;
  let renderedContent: JSX.Element;
    //if round isn't active at the moment, show
  if (isWaitingForNextRd) {
    return (
      <div id="roundinfo-container">
        <div id="round-waiting">Waiting...</div>
      </div>
    );
  }
  //if round is going on, show current word and current score
  if (roundTime) {
    renderedContent = (
      <>
        <Timer roundTime={roundTime}></Timer>
        <div id="round-word"><span id="word">Word:</span> {word} <span id="score">Score: <span id="currentScore">{score}</span></span> </div>
      </>
    );
  } else {
    renderedContent = <div id="round-waiting">Waiting...</div>;
  }

  return <div id="roundinfo-container">{renderedContent}</div>;
};
export default RoundInfo;
