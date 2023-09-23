import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

function App() {
  return (
    <div className="container">
      <div className="online-users">
        <div>Online Users</div>
      </div>
      <div className="message-container">
        <div>Message</div>
        <div className="messages"></div>
        <div className="input-message">
          <input placeholder="Type something...." />
        </div>
      </div>
    </div>
  );
}

export default App;
