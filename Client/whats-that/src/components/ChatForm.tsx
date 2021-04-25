import React from 'react';
import Socket from './Socket';

const ChatForm: React.FC = () => {
  const [chatInput, setChatInput] = React.useState('');
  const socket = Socket.getSocket();
  return (
    <form
      id="chatbox-form"
      onSubmit={(event): void => {
        event.preventDefault();
        if (chatInput === '') {
          return;
        }
        socket.emit('chatMsg', { type: 'chat', msg: chatInput });
        setChatInput('');
      }}
    >
      <input
        data-testid="chat-input"
        type="text"
        value={chatInput}
        onChange={(event): void => setChatInput(event.target.value)}
      />
    </form>
  );
};
export default ChatForm;
