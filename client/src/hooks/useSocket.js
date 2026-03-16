import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";
import {
  generateKeyPair,
  exportPublicKey,
  importPublicKey,
  encryptMessage,
  decryptMessage,
} from "../utils/crypto";

const SERVER_URL = "http://localhost:3001";

export function useSocket(username) {
  const socketRef = useRef(null);
  const keyPairRef = useRef(null); // { publicKey, privateKey }
  const peerKeysRef = useRef({}); // socketId -> CryptoKey (imported public key)

  const [mySocketId, setMySocketId] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState({}); // socketId -> Message[]
  const [typingMap, setTypingMap] = useState({}); // socketId -> bool
  const [status, setStatus] = useState("idle"); // idle | connecting | ready | error
  const [error, setError] = useState(null);

  const addMessage = useCallback((peerId, msg) => {
    setMessages((prev) => ({
      ...prev,
      [peerId]: [...(prev[peerId] || []), msg],
    }));
  }, []);

  const connect = useCallback(async () => {
    if (socketRef.current) return;
    setStatus("connecting");

    try {
      // Generate RSA key pair
      const keyPair = await generateKeyPair();
      keyPairRef.current = keyPair;
      const publicKeyB64 = await exportPublicKey(keyPair.publicKey);

      const socket = io(SERVER_URL, { transports: ["websocket"] });
      socketRef.current = socket;

      socket.on("connect", () => {
        socket.emit("join", { username, publicKey: publicKeyB64 });
      });

      socket.on("join_error", ({ message }) => {
        setError(message);
        setStatus("error");
        socket.disconnect();
        socketRef.current = null;
      });

      socket.on("joined", async ({ socketId, users: peers }) => {
        setMySocketId(socketId);
        // Import all existing peer keys
        for (const peer of peers) {
          const key = await importPublicKey(peer.publicKey);
          peerKeysRef.current[peer.socketId] = key;
        }
        setUsers(peers);
        setStatus("ready");
      });

      socket.on("user_joined", async ({ socketId, username: uname, publicKey }) => {
        const key = await importPublicKey(publicKey);
        peerKeysRef.current[socketId] = key;
        setUsers((prev) => [...prev, { socketId, username: uname, publicKey }]);
      });

      socket.on("user_left", ({ socketId, username: uname }) => {
        delete peerKeysRef.current[socketId];
        setUsers((prev) => prev.filter((u) => u.socketId !== socketId));
        // Leave a system note in that conversation
        addMessage(socketId, {
          id: Date.now(),
          type: "system",
          text: `${uname} has left the chat.`,
          timestamp: Date.now(),
        });
      });

      socket.on(
        "private_message",
        async ({ fromId, fromUsername, encryptedMessage, encryptedKey, iv, timestamp }) => {
          try {
            const plaintext = await decryptMessage(
              { encryptedMessage, encryptedKey, iv },
              keyPairRef.current.privateKey
            );
            addMessage(fromId, {
              id: `${fromId}-${timestamp}`,
              type: "received",
              text: plaintext,
              from: fromUsername,
              timestamp,
            });
          } catch (e) {
            console.error("Decryption failed:", e);
            addMessage(fromId, {
              id: `${fromId}-${timestamp}`,
              type: "received",
              text: "[Failed to decrypt message]",
              from: fromUsername,
              timestamp,
            });
          }
        }
      );

      socket.on("typing", ({ fromId, isTyping }) => {
        setTypingMap((prev) => ({ ...prev, [fromId]: isTyping }));
      });

      socket.on("disconnect", () => {
        setStatus("idle");
      });

      socket.on("connect_error", () => {
        setError("Cannot connect to server. Is the backend running?");
        setStatus("error");
      });
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }, [username, addMessage]);

  const sendMessage = useCallback(
    async (toId, text) => {
      const recipientKey = peerKeysRef.current[toId];
      if (!recipientKey || !socketRef.current) return false;

      try {
        const payload = await encryptMessage(text, recipientKey);
        socketRef.current.emit("private_message", { toId, ...payload });

        // Add to our own local messages immediately (we don't re-encrypt for self)
        addMessage(toId, {
          id: `${mySocketId}-${Date.now()}`,
          type: "sent",
          text,
          timestamp: Date.now(),
        });
        return true;
      } catch (e) {
        console.error("Encryption failed:", e);
        return false;
      }
    },
    [mySocketId, addMessage]
  );

  const sendTyping = useCallback((toId, isTyping) => {
    socketRef.current?.emit("typing", { toId, isTyping });
  }, []);

  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return {
    connect,
    sendMessage,
    sendTyping,
    mySocketId,
    users,
    messages,
    typingMap,
    status,
    error,
  };
}
