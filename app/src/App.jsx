import { useState, useEffect } from "react";
import "./App.css";
import { io } from "socket.io-client";

function App() {
  let socket;
  const [message, setMessage] = useState([]);
  const [username, setUserName] = useState("");
  const [onlineUser, setOnlineUser] = useState([]);

  useEffect(() => {
    const newUser = prompt("Type username...");
    setUserName(newUser);
  }, []);

  useEffect(() => {
    if (!username) {
      return;
    }
    socket = io("ws://localhost:3001", { autoConnect: false });
    socket.auth = { username: username };
    socket.connect();

    socket.on("new_message", (data) => {
      setMessage((prev) => [...prev, data?.message]);
    });

    socket.on("online_users", (users) => {
      setOnlineUser(users?.filter((user) => user?.username !== username));
    });

    return () => socket.disconnect();
  }, [username]);

  return (
    <div className="container">
      <div className="online-users">
        <div>Online Users</div>
        {!onlineUser?.length && (
          <div style={{ margin: "1em auto" }}>Room is empty</div>
        )}
        {onlineUser?.map((user) => {
          return <div>{user?.username}</div>;
        })}
      </div>
      <div className="message-container">
        <div>Message</div>
        <div className="messages">
          {message?.map((msg) => {
            return (
              <div className="message-info">
                <div className="message">{msg?.text}</div>
                <div className="username">{msg?.username}</div>
              </div>
            );
          })}
        </div>
        <div className="input-message">
          <input placeholder="Type something...." />
        </div>
      </div>
    </div>
  );
}

export default App;
