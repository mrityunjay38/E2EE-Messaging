import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import "./App.css";
import { io } from "socket.io-client";
import DiffiHellmanAlgo from "./EncryptDecrypt/diffieHellman";
import { secret } from "./EncryptDecrypt/utils";
import encrypt from "./EncryptDecrypt/encrypt";
import decrypt from "./EncryptDecrypt/decrypt";
import DefaultThumbnail from "./assets/default-thumbnail.png";

const socket = io("ws://localhost:3001", { autoConnect: false });
const PRIVATE_KEY = secret();
const PUBLIC_KEY = DiffiHellmanAlgo(PRIVATE_KEY);
let SHARED_KEY;

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

      socket.on("online_users", (users) => {
        setOnlineUser(users?.filter((user) => user?.username !== username));
      });

      socket.on("connect_error", (err) => closeConnection());
      socket.on("connect_failed", (err) => closeConnection());
    }

    return () => closeConnection();
  }, [username]);

  function closeConnection() {
    socket.removeAllListeners();
    socket.disconnect();
  }

  useEffect(() => {
    if (username) {
      socket.on("on_message", (data) => {
        handleNewMessage(data);
      });
    }

    return () => socket.removeAllListeners("on_message");
  }, [username, handleNewMessage]);

  const recipientConversations = useMemo(() => {
    const conversations = message?.find((msg) => msg?.from === recipient?.id);
    if (conversations) {
      return conversations?.message;
    }
    return [];
  }, [recipient, message]);

  return (
    <div className="container">
      <div className="online-users">
        <div className="col-header">Online Users</div>
        {!onlineUser?.length && (
          <div style={{ margin: "1em auto" }}>Room is empty</div>
        )}
        {onlineUser?.map((user) => {
          return (
            <div onClick={handleRecipientChange(user)} key={user?.id}>
              <span className="online-icon" />
              <img
                src={DefaultThumbnail}
                className="default-thumbnail"
                alt="default-thumbnail"
              />
              <span>{user?.username}</span>
            </div>
          );
        })}
      </div>
      <div className="message-list">
        <div className="col-header">Messages</div>
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
              <img
                src={DefaultThumbnail}
                className="default-thumbnail"
                alt="default-thumbnail"
              />
              <span>{msg?.username}</span>
            </div>
          );
        })}
      </div>
      <div className="message-container">
        <div className="col-header">Conversation</div>
        <div className="messages">
          {recipientConversations?.length
            ? recipientConversations?.map((msg, index) => {
                return (
                  <div className="message-info" key={index}>
                    <div className="message">{msg}</div>
                  </div>
                );
              })
            : null}
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
