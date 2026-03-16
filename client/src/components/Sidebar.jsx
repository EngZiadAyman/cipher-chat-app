import { Lock, Circle } from "lucide-react";

function Avatar({ name, size = "md" }) {
  const initials = name.slice(0, 2).toUpperCase();
  const colors = [
    "from-violet-500 to-purple-600",
    "from-sky-500 to-blue-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-teal-600",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  const sizeClasses = size === "sm" ? "w-8 h-8 text-xs" : "w-10 h-10 text-sm";

  return (
    <div
      className={`${sizeClasses} rounded-xl bg-gradient-to-br ${colors[idx]} flex items-center justify-center font-semibold text-white shrink-0`}
    >
      {initials}
    </div>
  );
}

export default function Sidebar({
  users,
  myUsername,
  selectedUser,
  onSelectUser,
  unreadMap,
}) {
  return (
    <aside className="w-72 bg-surface-1 border-r border-border flex flex-col">
      {/* Header */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-2 mb-1">
          <Lock size={14} className="text-accent" />
          <span className="text-xs font-medium text-accent uppercase tracking-widest">
            Cipher
          </span>
        </div>
        <h2 className="text-white font-semibold text-base">Messages</h2>
      </div>

      {/* Current user */}
      <div className="px-4 py-3 border-b border-border/50 bg-surface-0/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar name={myUsername} size="sm" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-surface-1" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{myUsername}</p>
            <p className="text-muted text-xs">You · Online</p>
          </div>
        </div>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto py-2">
        {users.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="w-10 h-10 bg-surface-2 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Circle size={16} className="text-muted" />
            </div>
            <p className="text-muted text-sm">No one else here yet</p>
            <p className="text-muted/60 text-xs mt-1">
              Open another browser tab to chat
            </p>
          </div>
        ) : (
          users.map((user) => {
            const isSelected = selectedUser?.socketId === user.socketId;
            const unread = unreadMap[user.socketId] || 0;

            return (
              <button
                key={user.socketId}
                onClick={() => onSelectUser(user)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 ${
                  isSelected
                    ? "bg-accent/10 border-r-2 border-accent"
                    : "hover:bg-surface-2/50 border-r-2 border-transparent"
                }`}
              >
                <div className="relative">
                  <Avatar name={user.username} size="sm" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${
                      isSelected ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {user.username}
                  </p>
                  <p className="text-muted text-xs">Online</p>
                </div>
                {unread > 0 && !isSelected && (
                  <span className="bg-accent text-surface-0 text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs text-muted/60">
          <Lock size={10} className="text-accent/60" />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </aside>
  );
}
