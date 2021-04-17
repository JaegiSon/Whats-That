import React from 'react';
import GameProvider from './providers/GameProvider';
import Game from './components/Game';
import Home from './components/Home';
import logo from './logo.svg';
import './App.css';


const App: React.FC = () => {
  const [username, setUsername] = React.useState<string | null>(null);
  
  if (username === null) {
    return <Home setUsername={setUsername}></Home>;
  }
  return (
    <GameProvider exitGame={() => setUsername(null)} username={username}>
      <Game canvasHeight={700} canvasWidth={800}></Game>
    </GameProvider>
  );
};

export default App;
