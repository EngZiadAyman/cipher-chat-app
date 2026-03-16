import { useState, useCallback } from "react";
import LoginScreen from "./components/LoginScreen";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import { useSocket } from "./hooks/useSocket";

export default function App() {
  const [username, setUsername] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unreadMap, setUnreadMap] = useState({});

  const {
    connect,
    sendMessage,
    sendTyping,
    mySocketId,
    users,
    messages,
    typingMap,
    status,
    error,
  } = useSocket(username);

  const handleJoin = useCallback(
    async (name) => {
      setUsername(name);
      await connect();
      setHasJoined(true);
    },
    [connect]
  );

  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
    setUnreadMap((prev) => ({ ...prev, [user.socketId]: 0 }));
  }, []);

  const handleSend = useCallback(
    async (toId, text) => {
      await sendMessage(toId, text);
    },
    [sendMessage]
  );

  // Track unread counts when a message arrives for non-selected conversations
  const augmentedMessages = messages;
  // (unread tracking is done via useEffect in a real app; kept simple here)

  if (!hasJoined || status === "idle" || status === "error") {
    return (
      <LoginScreen
        onJoin={handleJoin}
        error={error}
        status={status}
      />
    );
  }

  if (status === "connecting") {
    return (
      <LoginScreen
        onJoin={handleJoin}
        error={error}
        status={status}
      />
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-surface-0">
      <Sidebar
        users={users}
        myUsername={username}
        selectedUser={selectedUser}
        onSelectUser={handleSelectUser}
        unreadMap={unreadMap}
      />
      <ChatWindow
        selectedUser={selectedUser}
        messages={augmentedMessages}
        mySocketId={mySocketId}
        isTyping={selectedUser ? typingMap[selectedUser.socketId] : false}
        onSend={handleSend}
        onTyping={sendTyping}
      />
    </div>
  );
}
