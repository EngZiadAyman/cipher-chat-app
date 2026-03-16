/**
 * crypto.js — End-to-End Encryption Utilities
 *
 * Strategy: Hybrid encryption (RSA-OAEP + AES-GCM)
 * ──────────────────────────────────────────────────
 * Each client generates an RSA-OAEP key pair on startup.
 * The public key is shared with the server (and forwarded to peers).
 *
 * To send a message:
 *   1. Generate a fresh random AES-GCM key.
 *   2. Encrypt the plaintext with AES-GCM  → { ciphertext, iv }
 *   3. Encrypt the AES key with the recipient's RSA public key → encryptedKey
 *   4. Send { encryptedMessage, encryptedKey, iv } over the wire.
 *
 * To receive a message:
 *   1. Decrypt encryptedKey with your RSA private key → AES key
 *   2. Decrypt encryptedMessage with the AES key + iv → plaintext
 *
 * The server only ever sees base64 blobs — it cannot read messages.
 */

// ── Helpers ────────────────────────────────────────────────────────────────

function bufToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToBuf(b64) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

// ── RSA Key Pair ───────────────────────────────────────────────────────────

export async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
  return keyPair;
}

export async function exportPublicKey(publicKey) {
  const exported = await crypto.subtle.exportKey("spki", publicKey);
  return bufToBase64(exported);
}

export async function importPublicKey(base64) {
  const buf = base64ToBuf(base64);
  return crypto.subtle.importKey(
    "spki",
    buf,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );
}

// ── AES-GCM Helpers ────────────────────────────────────────────────────────

async function generateAesKey() {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

async function exportAesKey(key) {
  const raw = await crypto.subtle.exportKey("raw", key);
  return raw;
}

async function importAesKey(rawBuf) {
  return crypto.subtle.importKey("raw", rawBuf, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

// ── Encrypt / Decrypt ──────────────────────────────────────────────────────

/**
 * Encrypt a plaintext string for a given recipient public key.
 * Returns { encryptedMessage, encryptedKey, iv } — all base64 strings.
 */
export async function encryptMessage(plaintext, recipientPublicKey) {
  // 1. Fresh AES key + IV
  const aesKey = await generateAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // 2. Encrypt plaintext with AES-GCM
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    encoded
  );

  // 3. Encrypt AES key with recipient RSA public key
  const rawAes = await exportAesKey(aesKey);
  const encryptedKey = await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    recipientPublicKey,
    rawAes
  );

  return {
    encryptedMessage: bufToBase64(ciphertext),
    encryptedKey: bufToBase64(encryptedKey),
    iv: bufToBase64(iv),
  };
}

/**
 * Decrypt an incoming encrypted payload using our RSA private key.
 * Returns the plaintext string.
 */
export async function decryptMessage(
  { encryptedMessage, encryptedKey, iv },
  privateKey
) {
  // 1. Decrypt AES key with our private key
  const rawAes = await crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    base64ToBuf(encryptedKey)
  );

  // 2. Import AES key
  const aesKey = await importAesKey(rawAes);

  // 3. Decrypt message
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBuf(iv) },
    aesKey,
    base64ToBuf(encryptedMessage)
  );

  return new TextDecoder().decode(plaintext);
}
