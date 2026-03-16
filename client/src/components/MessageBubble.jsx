function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessageBubble({ message, isSent }) {
  if (message.type === "system") {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-muted/60 bg-surface-2/50 px-3 py-1 rounded-full">
          {message.text}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex msg-enter ${isSent ? "justify-end" : "justify-start"}`}
    >
      <div className={`max-w-[72%] ${isSent ? "items-end" : "items-start"} flex flex-col gap-1`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
            isSent
              ? "bg-accent text-surface-0 rounded-br-sm font-medium"
              : "bg-surface-2 text-slate-200 rounded-bl-sm border border-border/50"
          }`}
        >
          {message.text}
        </div>
        <span className="text-xs text-muted/60 px-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
