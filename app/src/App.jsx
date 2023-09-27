import { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import { io } from "socket.io-client";
import DiffiHellmanAlgo from "./EncryptDecrypt/diffieHellman";
import { secret } from "./EncryptDecrypt/utils";
import encrypt from "./EncryptDecrypt/encrypt";
import decrypt from "./EncryptDecrypt/decrypt";
const socket = io("ws://localhost:3001", { autoConnect: false });
const PRIVATE_KEY = secret();
const PUBLIC_KEY = DiffiHellmanAlgo(PRIVATE_KEY);
let SHARED_KEY;
console.log(PUBLIC_KEY, PRIVATE_KEY);

function App() {
  const [message, setMessage] = useState([]);
  const [username, setUserName] = useState("");
  const [onlineUser, setOnlineUser] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [inputMessage, setInputMessage] = useState("");

  useEffect(() => {
    const newUser = prompt("Type username...");
    setUserName(newUser);
  }, []);

  const handleSendMessage = useCallback(
    async ({ key, target }) => {
      if (key === "Enter") {
        const encryptedMessage = await encrypt(target?.value, SHARED_KEY);
        socket.emit("to_user", {
          message: encryptedMessage,
          to: recipient?.id,
          username,
          publicKey: PUBLIC_KEY,
        });
        setInputMessage("");
      }
    },
    [recipient, socket]
  );

  const handleRecipientChange = useCallback(
    ({ id, username, publicKey }) =>
      (event) => {
        setRecipient({ id, username, publicKey });
        try {
          SHARED_KEY = DiffiHellmanAlgo(publicKey, PRIVATE_KEY);
        } catch (err) {
          console.log(err);
        }
      },
    [onlineUser]
  );

  const handleNewMessage = useCallback(
    async (data) => {
      SHARED_KEY = DiffiHellmanAlgo(data?.publicKey, PRIVATE_KEY);
      const decryptedMessage = await decrypt(data?.message, SHARED_KEY);

      const updatedMessage = [...message];
      const messageHistoryIndex = message?.findIndex(
        (user) => user?.from === data?.from
      );
      console.log(messageHistoryIndex, message, data);
      if (messageHistoryIndex > -1) {
        updatedMessage[messageHistoryIndex].message.push(decryptedMessage);
      } else {
        updatedMessage.push({ ...data, message: [decryptedMessage] });
      }
      setMessage(updatedMessage);
    },
    [message]
  );

  useEffect(() => {
    if (username) {
      socket.auth = { username: username, publicKey: PUBLIC_KEY };
      socket.connect();

      socket.on("on_message", (data) => {
        handleNewMessage(data);
      });

      socket.on("online_users", (users) => {
        setOnlineUser(users?.filter((user) => user?.username !== username));
      });
    }

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [username]);

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
                publicKey: msg?.publicKey,
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
