import { useState, useEffect, useCallback } from "react";
import "./App.css";
import { io } from "socket.io-client";
const socket = io("ws://localhost:3001", { autoConnect: false });

function App() {
  const [message, setMessage] = useState([]);
  const [username, setUserName] = useState("");
  const [onlineUser, setOnlineUser] = useState([]);
  const [recipient, setRecipient] = useState(null);

  useEffect(() => {
    const newUser = prompt("Type username...");
    setUserName(newUser);
  }, []);

  useEffect(() => {
    if (username) {
      socket.auth = { username: username };
      socket.connect();

      socket.on("on_message", (data) => {
        console.log(data);
      });

      socket.on("online_users", (users) => {
        console.log("here", users);
        setOnlineUser(users?.filter((user) => user?.username !== username));
      });
    }

    return () => socket.disconnect();
  }, [username]);

  const handleSendMessage = useCallback(
    ({ key, target }) => {
      if (key === "Enter") {
        socket.emit("to_user", {
          message: target?.value,
          to: recipient?.id,
          username: recipient?.username,
        });
      }
    },
    [recipient, socket]
  );

  const handleRecipientChange = useCallback(
    (user) => (event) => {
      setRecipient(user);
    },
    [onlineUser]
  );

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
              {user?.username}
            </div>
          );
        })}
      </div>
      <div className="message-container">
        <div>Message</div>
        <div className="messages">
          {message?.map((msg, index) => {
            return (
              <div className="message-info" key={index}>
                <div className="message">{msg?.text}</div>
                <div className="username">{msg?.username}</div>
              </div>
            );
          })}
        </div>
        <div className="input-message">
          <input
            placeholder="Type something...."
            onKeyDown={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
