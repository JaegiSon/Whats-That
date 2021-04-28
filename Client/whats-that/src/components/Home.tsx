import React from 'react';
import Socket from './Socket';
import logo from './logo.png'
interface HomeProps {
  setUsername: (username: string) => void;
}
const Home: React.FC<HomeProps> = (props) => {
  const [usernameInput, setUsernameInput] = React.useState('');
  return (
    
      <div id="home-container">
        <img src={logo} alt="Logo" />
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            if (usernameInput === '') {
              return;
            }
            props.setUsername(usernameInput);
            Socket.initializeSocket(usernameInput);
          }}
        >
          <input
            type="text"
            placeholder="Enter your username"
            value={usernameInput}
            onChange={(ev) => setUsernameInput(ev.target.value)}
          />
          <input type="submit" value="Start game" className="btn btn-style-1" />
        </form>
        <div className="rules">
          <h3 className="rulesHeader">Rules:</h3>
          <ul>
            <li>You'll be placed into a team of players in an order </li>
            <li>If you are first in the queue, draw the word you are shown. You only have 15 seconds!!! &#128396;</li>
            <li>If you are in the middle of the queue, draw what you think the person before you drew. Hint is given &#128064;</li>
            <li>If you are last, guess the word! Make sure to guess within 10 seconds!!! &#129335;</li>
            <li>You get a point if you guess correctly! &#128076;</li>
            <li>If you guess wrong, try again! &#129318;</li>
            <li>Have fun! &#128514;</li>
          </ul>
        </div>
      </div>
    
  );
};

export default Home;
