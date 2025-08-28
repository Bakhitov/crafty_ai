import crypto from "crypto";

const ALGO = "aes-256-gcm";
const VERSION = 1;

function getMasterKey(): Buffer {
  const secret = process.env.KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error("KEY_ENCRYPTION_SECRET is not set");
  }
  // Derive 32 bytes key from secret using SHA-256
  return crypto.createHash("sha256").update(secret).digest();
}

export type EncryptedPayload = {
  cipher: string; // base64
  iv: string; // base64
  tag: string; // base64
  version: number;
};

export const KeyCrypto = {
  encrypt(plainText: string): EncryptedPayload {
    const key = getMasterKey();
    const iv = crypto.randomBytes(12); // GCM recommended 12 bytes
    const cipher = crypto.createCipheriv(ALGO, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(plainText, "utf8")),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return {
      cipher: encrypted.toString("base64"),
      iv: iv.toString("base64"),
      tag: tag.toString("base64"),
      version: VERSION,
    };
  },

  decrypt(payload: EncryptedPayload): string {
    if (payload.version !== VERSION) {
      // In future could support migration logic
    }
    const key = getMasterKey();
    const iv = Buffer.from(payload.iv, "base64");
    const tag = Buffer.from(payload.tag, "base64");
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.cipher, "base64")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  },
};
