import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import generateKey from "./GenerateKey/ecdsa";
import { io } from "socket.io-client";
const socket = io("ws://localhost:3001", { autoConnect: false });
let publicKey, privateKey;

function App() {
  const inputRef = useRef();
  const [message, setMessage] = useState([]);
  const [username, setUserName] = useState("");
  const [onlineUser, setOnlineUser] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    const newUser = prompt("Type username...");
    setUserName(newUser);
  }, []);

  useEffect(() => {
    if (username) {
      socket.auth = { username: username };
      socket.connect();

      socket.on("on_message", (data) => {
        handleNewMessage(data);
      });

      socket.on("online_users", (users) => {
        setOnlineUser(users?.filter((user) => user?.username !== username));
      });
    }

    return () => socket.disconnect();
  }, [username]);

  useEffect(() => {
    if (username) {
      generateKey()
        .then((keyPair) => {
          publicKey = keyPair?.publicKey;
          privateKey = keyPair?.privateKey;
        })
        .catch((err) => err);
    }
  }, [username]);

  const handleSendMessage = useCallback(
    ({ key, target }) => {
      if (key === "Enter") {
        socket.emit("to_user", {
          message: target?.value,
          to: recipient?.id,
          username: recipient?.username,
        });
        setInputMessage("");
      }
    },
    [recipient, socket]
  );

  const handleRecipientChange = useCallback(
    ({ id, username }) =>
      (event) => {
        setRecipient({ id, username });
      },
    [onlineUser]
  );

  function handleNewMessage(data) {
    const messageHistoryIndex = message?.findIndex(
      (user) => user?.from === data?.from
    );
    const updatedMessage = [...message];
    if (messageHistoryIndex > -1) {
      updatedMessage[messageHistoryIndex].message.push(data?.message);
    } else {
      updatedMessage.push({ ...data, message: [data?.message] });
    }
    setMessage(updatedMessage);
  }

  return (
    <div className="container">
      <div className="online-users">
        <div>Online Users</div>
        {!onlineUser?.length && (
          <div style={{ margin: "1em auto" }}>Room is empty</div>
        )}
        {onlineUser?.map((user) => {
          return (
            <div onClick={handleRecipientChange(user)} key={user?.id}>
              <span className="online-icon" />
              <span>{user?.username}</span>
            </div>
          );
        })}
      </div>
      <div className="message-list">
        <div>Messages</div>
        {!message?.length && (
          <div style={{ margin: "1em auto" }}>No Message</div>
        )}
        {message?.map((msg) => {
          return (
            <div
              onClick={handleRecipientChange({
                id: msg?.from,
                username: msg?.username,
              })}
              key={msg?.from}
            >
              {msg?.username}
            </div>
          );
        })}
      </div>
      <div className="message-container">
        <div>Conversation</div>
        <div className="messages">
          {recipient?.id &&
            message
              ?.filter((msg) => msg?.from === recipient?.id)
              ?.map((msg, index) => {
                return (
                  <div className="message-info" key={index}>
                    <div className="message">{msg?.message}</div>
                    <div className="username">{msg?.username}</div>
                  </div>
                );
              })}
        </div>
        <div className="input-message">
          <input
            value={inputMessage}
            placeholder="Type something...."
            onKeyDown={handleSendMessage}
            onChange={({ target }) => setInputMessage(target?.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
