import { useState } from "react";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";

export default function LoginScreen({ onJoin, error, status }) {
  const [username, setUsername] = useState("");
  const loading = status === "connecting";

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed.length < 2) return;
    onJoin(trimmed);
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10"
          style={{
            background:
              "radial-gradient(circle, rgba(110,231,183,0.4) 0%, transparent 70%)",
          }}
        />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      </div>

      <div className="relative w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 border border-border mb-6 relative glow">
            <Lock className="text-accent" size={28} />
          </div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            Cipher
          </h1>
          <p className="text-muted text-sm mt-2 font-light">
            End-to-end encrypted messaging
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-1 border border-border rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-widest mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name..."
                maxLength={24}
                autoFocus
                disabled={loading}
                className="w-full bg-surface-2 border border-border text-white placeholder-muted/50 rounded-xl px-4 py-3 text-sm font-light focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-200 disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="bg-red-950/50 border border-red-800/50 rounded-xl px-4 py-3 text-red-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={username.trim().length < 2 || loading}
              className="w-full flex items-center justify-center gap-2 bg-accent text-surface-0 font-semibold text-sm rounded-xl px-4 py-3 hover:bg-accent/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-surface-0/30 border-t-surface-0 rounded-full animate-spin" />
                  Generating keys...
                </>
              ) : (
                <>
                  Enter Chat
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* E2E info */}
        <div className="mt-6 flex items-start gap-3 text-xs text-muted bg-surface-1/50 border border-border/50 rounded-xl px-4 py-3">
          <ShieldCheck size={14} className="text-accent mt-0.5 shrink-0" />
          <span>
            Your browser generates a unique RSA-2048 key pair. Messages are
            AES-256 encrypted client-side — the server never sees plaintext.
          </span>
        </div>
      </div>
    </div>
  );
}
