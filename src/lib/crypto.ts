import crypto from "node:crypto";
import { env } from "@/lib/env";

const ALGORITHM = "aes-256-gcm";

function resolveKey(): Buffer {
  if (env.piiEncryptionKey) {
    try {
      const key = Buffer.from(env.piiEncryptionKey, "base64");
      if (key.length === 32) {
        return key;
      }
    } catch {
      // fallback below
    }
  }

  return crypto.createHash("sha256").update("creai-default-dev-key").digest();
}

export function encryptContact(plain: string) {
  const key = resolveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptContact(encoded: string) {
  const key = resolveKey();
  const payload = Buffer.from(encoded, "base64");
  const iv = payload.subarray(0, 12);
  const tag = payload.subarray(12, 28);
  const encrypted = payload.subarray(28);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function maskContact(contact: string) {
  const digits = contact.replace(/\D/g, "");
  if (digits.length < 7) {
    return "***";
  }

  const head = digits.slice(0, 3);
  const tail = digits.slice(-4);
  return `${head}-****-${tail}`;
}

export function hashContact(contact: string) {
  return crypto.createHash("sha256").update(contact.trim()).digest("hex");
}
