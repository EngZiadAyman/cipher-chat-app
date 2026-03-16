export default function TypingIndicator({ username }) {
  return (
    <div className="flex items-center gap-3 animate-fade-in">
      <div className="flex items-center gap-1 bg-surface-2 border border-border/50 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot w-1.5 h-1.5 bg-muted rounded-full animate-pulse-dot"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-muted/60">{username} is typing…</span>
    </div>
  );
}
