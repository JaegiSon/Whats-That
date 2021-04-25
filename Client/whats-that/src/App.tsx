import React from 'react';
import GameProvider from './providers/GameProvider';
import GameHandler from './components/GameHandler';
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
      <GameHandler></GameHandler>
    </GameProvider>
  );
};
export default App;
