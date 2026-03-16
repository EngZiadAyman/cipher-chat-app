# 🔐 Cipher — End-to-End Encrypted Chat

A clean, professional real-time chat prototype with end-to-end encryption using RSA-OAEP + AES-GCM hybrid encryption.

---

## 📁 Project Structure

```
chat-app/
├── server/                    # Node.js + Express + Socket.IO backend
│   ├── index.js               # Main server — only relays encrypted blobs
│   └── package.json
│
└── client/                    # React + Tailwind frontend
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── hooks/
        │   └── useSocket.js   # Socket.IO + encryption state management
        ├── utils/
        │   └── crypto.js      # Web Crypto API: RSA + AES helpers
        └── components/
            ├── LoginScreen.jsx
            ├── Sidebar.jsx
            ├── ChatWindow.jsx
            ├── MessageBubble.jsx
            └── TypingIndicator.jsx
```

---

## 🔑 How Encryption Works

```
Alice wants to send "Hello" to Bob:

1. KEY GENERATION (on login)
   Each client runs: crypto.subtle.generateKey("RSA-OAEP", 2048)
   → Private key  stays in browser memory (never leaves)
   → Public key   is exported and shared with the server

2. SENDING A MESSAGE
   ┌─────────────────────────────────────────────────┐
   │  Alice's Browser                                │
   │                                                 │
   │  plaintext = "Hello"                            │
   │  aesKey    = crypto.subtle.generateKey(AES-GCM) │ ← fresh per message
   │  iv        = crypto.getRandomValues(12 bytes)   │
   │                                                 │
   │  ciphertext   = AES-GCM.encrypt(plaintext, iv)  │
   │  encryptedKey = RSA-OAEP.encrypt(aesKey,        │
   │                   Bob's public key)             │
   │                                                 │
   │  → send { ciphertext, encryptedKey, iv }        │
   └─────────────────────────────────────────────────┘
              │  (server only sees base64 blobs)
              ▼
   ┌─────────────────────────────────────────────────┐
   │  Bob's Browser                                  │
   │                                                 │
   │  aesKey    = RSA-OAEP.decrypt(encryptedKey,     │
   │               Bob's private key)               │
   │  plaintext = AES-GCM.decrypt(ciphertext, iv)    │
   │  → display "Hello"                              │
   └─────────────────────────────────────────────────┘

The server is a dumb relay — it never touches plaintext.
```

**Algorithms used:**
- `RSA-OAEP` with 2048-bit modulus + SHA-256 — asymmetric key exchange
- `AES-GCM` with 256-bit keys + 96-bit random IV — symmetric message encryption
- Everything via the browser's native **Web Crypto API** (no third-party crypto libs)

---

## ⚙️ Prerequisites

- **Node.js** v18 or later (v20 LTS recommended)
- **npm** v9+
- A modern browser (Chrome, Firefox, Edge, Safari — all support Web Crypto)

---

## 🚀 Setup & Run

### Step 1 — Install server dependencies
```bash
cd chat-app/server
npm install
```

### Step 2 — Install client dependencies
```bash
cd ../client
npm install
```

### Step 3 — Start the backend server
```bash
# From chat-app/server/
npm start
# or for auto-reload during development:
npm run dev
```
You should see: `🚀 Chat server running on http://localhost:3001`

### Step 4 — Start the frontend (in a new terminal)
```bash
# From chat-app/client/
npm run dev
```
You should see: `Local: http://localhost:5173`

### Step 5 — Open the app
Open **http://localhost:5173** in your browser.

To test a real conversation, open a **second browser tab** (or a private/incognito window) and join with a different username. Messages exchanged between the two tabs are fully encrypted.

---

## 🧪 Testing E2E Encryption

Open your browser's DevTools → Network tab.

Look for WebSocket frames — you'll see payloads like:
```json
{
  "encryptedMessage": "base64...",
  "encryptedKey":     "base64...",
  "iv":               "base64..."
}
```
No plaintext ever appears on the wire or in server logs.

---

## ✨ Features

| Feature | Status |
|---------|--------|
| Real-time messaging (WebSocket) | ✅ |
| End-to-end encryption (RSA + AES) | ✅ |
| Private 1:1 conversations | ✅ |
| Typing indicator | ✅ |
| Online presence | ✅ |
| Unread badge | ✅ |
| User join/leave notifications | ✅ |
| Clean dark UI | ✅ |
| No plaintext on server | ✅ |
