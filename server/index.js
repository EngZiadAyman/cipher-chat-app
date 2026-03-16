const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", users: users.size });
});

// In-memory user store: socketId -> { username, publicKey }
const users = new Map();

io.on("connection", (socket) => {
  console.log(`[+] Socket connected: ${socket.id}`);

  // ── JOIN ──────────────────────────────────────────────────────────────────
  socket.on("join", ({ username, publicKey }) => {
    // Reject duplicate usernames
    const taken = [...users.values()].some((u) => u.username === username);
    if (taken) {
      socket.emit("join_error", { message: `Username "${username}" is already taken.` });
      return;
    }

    users.set(socket.id, { username, publicKey });
    console.log(`[+] ${username} joined (${socket.id})`);

    // Send the new user the current user list (excluding themselves)
    const others = buildUserList(socket.id);
    socket.emit("joined", { socketId: socket.id, users: others });

    // Broadcast updated list to everyone else
    socket.broadcast.emit("user_joined", {
      socketId: socket.id,
      username,
      publicKey,
    });
  });

  // ── KEY EXCHANGE ──────────────────────────────────────────────────────────
  // A client requests the public key of a specific peer
  socket.on("request_key", ({ targetId }) => {
    const target = users.get(targetId);
    if (target) {
      socket.emit("receive_key", {
        socketId: targetId,
        username: target.username,
        publicKey: target.publicKey,
      });
    }
  });

  // ── PRIVATE MESSAGE ───────────────────────────────────────────────────────
  // payload: { toId, encryptedMessage, encryptedKey, iv }
  // The server only relays the encrypted blob — it cannot read the content.
  socket.on("private_message", ({ toId, encryptedMessage, encryptedKey, iv }) => {
    const sender = users.get(socket.id);
    if (!sender) return;

    io.to(toId).emit("private_message", {
      fromId: socket.id,
      fromUsername: sender.username,
      encryptedMessage, // base64 AES-encrypted ciphertext
      encryptedKey,     // base64 RSA-encrypted AES key
      iv,               // base64 AES IV
      timestamp: Date.now(),
    });
  });

  // ── TYPING INDICATOR ──────────────────────────────────────────────────────
  socket.on("typing", ({ toId, isTyping }) => {
    const sender = users.get(socket.id);
    if (!sender) return;
    io.to(toId).emit("typing", {
      fromId: socket.id,
      fromUsername: sender.username,
      isTyping,
    });
  });

  // ── DISCONNECT ────────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      console.log(`[-] ${user.username} disconnected`);
      users.delete(socket.id);
      io.emit("user_left", { socketId: socket.id, username: user.username });
    }
  });
});

function buildUserList(excludeId) {
  return [...users.entries()]
    .filter(([id]) => id !== excludeId)
    .map(([id, { username, publicKey }]) => ({ socketId: id, username, publicKey }));
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🚀 Chat server running on http://localhost:${PORT}\n`);
});
