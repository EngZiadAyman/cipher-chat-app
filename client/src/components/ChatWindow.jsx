import { useState, useEffect, useRef, useCallback } from "react";
import { Send, ShieldCheck, Lock } from "lucide-react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

function Avatar({ name }) {
  const colors = [
    "from-violet-500 to-purple-600",
    "from-sky-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-teal-600",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <div
      className={`w-9 h-9 rounded-xl bg-gradient-to-br ${colors[idx]} flex items-center justify-center font-semibold text-white text-sm shrink-0`}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default function ChatWindow({
  selectedUser,
  messages,
  mySocketId,
  isTyping,
  onSend,
  onTyping,
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const conversation = messages[selectedUser?.socketId] || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, isTyping]);

  const handleInputChange = useCallback(
    (e) => {
      setInput(e.target.value);
      if (!selectedUser) return;

      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTyping(selectedUser.socketId, true);
      }

      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTyping(selectedUser.socketId, false);
      }, 1500);
    },
    [selectedUser, onTyping]
  );

  const handleSend = useCallback(
    async (e) => {
      e?.preventDefault();
      const text = input.trim();
      if (!text || !selectedUser) return;

      setInput("");
      clearTimeout(typingTimeoutRef.current);
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTyping(selectedUser.socketId, false);
      }

      await onSend(selectedUser.socketId, text);
    },
    [input, selectedUser, onSend, onTyping]
  );

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-surface-0 gap-4">
        <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center border border-border">
          <Lock size={24} className="text-accent/60" />
        </div>
        <div className="text-center">
          <p className="text-slate-400 font-medium">Select a conversation</p>
          <p className="text-muted text-sm mt-1">
            Choose a user from the sidebar to start chatting
          </p>
        </div>
        <div className="mt-2 text-xs text-muted/50 flex items-center gap-1.5">
          <ShieldCheck size={12} className="text-accent/50" />
          All messages are end-to-end encrypted
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-surface-0 min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-1/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={selectedUser.username} />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface-1" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {selectedUser.username}
            </p>
            <p className="text-muted text-xs">
              {isTyping ? (
                <span className="text-accent">Typing...</span>
              ) : (
                "Online"
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted/60 bg-surface-2/50 border border-border/50 px-3 py-1.5 rounded-full">
          <ShieldCheck size={11} className="text-accent/70" />
          <span>End-to-end encrypted</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-2">
        {conversation.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-12 h-12 bg-surface-2 rounded-2xl flex items-center justify-center border border-border">
              <ShieldCheck size={20} className="text-accent" />
            </div>
            <p className="text-slate-400 text-sm font-medium">
              Your conversation is secured
            </p>
            <p className="text-muted text-xs max-w-xs">
              Messages are encrypted in your browser before being sent.
              Not even the server can read them.
            </p>
          </div>
        ) : (
          conversation.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSent={msg.type === "sent"}
            />
          ))
        )}

        {isTyping && (
          <TypingIndicator username={selectedUser.username} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-border bg-surface-1/30">
        <form onSubmit={handleSend} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedUser.username}…`}
            maxLength={2000}
            className="flex-1 bg-surface-2 border border-border text-white placeholder-muted/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center text-surface-0 hover:bg-accent/90 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-muted/40 text-xs mt-2 text-center">
          Messages encrypted with AES-256 · Enter to send
        </p>
      </div>
    </div>
  );
}
