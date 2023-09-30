import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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
  const [messageStore, setMessageStore] = useState({});
  const [username, setUserName] = useState("");
  const [onlineUser, setOnlineUser] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [inputMessage, setInputMessage] = useState("");
  const [logs, setLogs] = useState([]);
  const logsRef = useRef(null);

  useEffect(() => {
    if (logsRef?.current?.lastElementChild) {
      logsRef?.current?.lastElementChild?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [logs]);

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
        localMessageCache({
          message: target?.value,
          to: recipient?.id,
          username,
          localCache: true,
        });
        setLogs((prev) => [
          ...prev,
          `> Sent: ${encryptedMessage} to ${recipient?.username}`,
        ]);
      }
    },
    [recipient, socket, messageStore]
  );

  const handleRecipientChange = useCallback(
    ({ id, username, publicKey }) =>
      (event) => {
        setRecipient({ id, username, publicKey });
        setLogs((prev) => [...prev, `> Recipient: ${username}`]);
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
      const updatedMessageStore = { ...messageStore };

      if (updatedMessageStore[data?.from]) {
        updatedMessageStore[data.from].push({
          ...data,
          message: decryptedMessage,
        });
      } else {
        updatedMessageStore[data?.from] = [
          { ...data, message: decryptedMessage },
        ];
      }
      setMessageStore(updatedMessageStore);
      setLogs((prev) => [
        ...prev,
        `> Received: ${data?.message} from ${data?.username}`,
      ]);
    },
    [messageStore]
  );

  function localMessageCache(data) {
    const updatedMessageStore = { ...messageStore };

    if (updatedMessageStore[data?.to]) {
      updatedMessageStore[data.to].push({ ...data });
    } else {
      updatedMessageStore[data?.to] = [{ ...data }];
    }
    setMessageStore(updatedMessageStore);
  }

  useEffect(() => {
    if (username) {
      socket.auth = { username: username, publicKey: PUBLIC_KEY };
      socket.connect();
      setLogs((prev) => [
        ...prev,
        `> Socket connected: Public_Key of ${username} is ${PUBLIC_KEY}`,
      ]);

      socket.on("online_users", (users) => {
        setOnlineUser(users?.filter((user) => user?.username !== username));
        setLogs((prev) => [
          ...prev,
          `> Online users: ${users?.map((user) => user?.username)?.join(", ")}`,
        ]);
      });

      socket.on("connect_error", (err) => closeConnection(err));
      socket.on("connect_failed", (err) => closeConnection(err));
    }

    return () => closeConnection();
  }, [username]);

  function closeConnection(err) {
    socket.removeAllListeners();
    socket.disconnect();
    setLogs((prev) => [...prev, "> Socket disconnected"]);
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
    const conversations = messageStore[recipient?.id];
    if (conversations?.length) {
      return conversations;
    }
    return [];
  }, [recipient, messageStore]);

  return (
    <React.Fragment>
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

        <div className="message-container">
          <div className="conversation-bg" />
          <div className="col-header">Conversation</div>
          <div className="messages">
            {recipientConversations?.length
              ? recipientConversations?.map((data, index) => {
                  return (
                    <div className="message-info" key={index}>
                      <span
                        className={`message${
                          data?.localCache ? " right" : " left"
                        }`}
                      >
                        {data?.message}
                      </span>
                      <span
                        className={`tail${
                          data?.localCache ? " right" : " left"
                        }`}
                      />
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

      <div className="logs" ref={logsRef}>
        {logs?.length ? logs?.map((log) => <div>{log}</div>) : "No logs..."}
      </div>
    </React.Fragment>
  );
}

export default App;
