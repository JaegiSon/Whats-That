import React from 'react';
import { RoundTime } from './Round';

interface TimerProps {
  roundTime: RoundTime;
}
const Timer: React.FC<TimerProps> = ({ roundTime }) => {
  //recevie round time from provider
  const [time, setTime] = React.useState(
    roundTime.timeToComplete + roundTime.startTime - Date.now()
  );
  
  React.useEffect(() => {
    let isSubscribed = true;
    setTimeout(() => {
      if (isSubscribed) {
        const newTime = roundTime.timeToComplete + roundTime.startTime - Date.now();
        if (Math.round(newTime / 1000) <= 0) {
          return;
        }
        setTime(newTime);
      }
    }, 250);
    return () => {
      isSubscribed = false;
    };
  }, [time]);
  return <div>&#9201; {Math.round(time / 1000)}</div>;
};
export default Timer;
