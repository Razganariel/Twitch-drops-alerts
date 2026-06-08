import crypto from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const KEY_ENV = "ENCRYPTION_KEY"

function getKey(): Buffer {
  const raw = process.env[KEY_ENV]
  if (!raw) throw new Error(`${KEY_ENV} is not set`)
  return Buffer.from(raw, "hex")
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([iv, authTag, encrypted]).toString("base64")
}

export function decrypt(ciphertext: string): string {
  const key = getKey()
  const raw = Buffer.from(ciphertext, "base64")
  const iv = raw.subarray(0, IV_LENGTH)
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const data = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(data) + decipher.final("utf8")
}

export function maskValue(value: string): string {
  if (value.length <= 8) return value.slice(0, 2) + "****"
  return value.slice(0, 4) + "****" + value.slice(-4)
}

export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("hex")
}
