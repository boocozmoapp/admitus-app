import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const AUTH_COOKIE = "admitus_session";
export const AUTH_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSecret() {
  return process.env.AUTH_SECRET || process.env.OPENROUTER_API_KEY || "admitus-local-dev-secret-change-me";
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function sign(payload: string) {
  return base64Url(createHmac("sha256", getSecret()).update(payload).digest());
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function createVerificationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}

export function createSession(userId: number) {
  const expires = Math.floor(Date.now() / 1000) + AUTH_MAX_AGE_SECONDS;
  const payload = `${userId}.${expires}`;
  return `${payload}.${sign(payload)}`;
}

export function parseSession(token: string | undefined | null) {
  if (!token) return null;
  const [userIdRaw, expiresRaw, signature] = token.split(".");
  if (!userIdRaw || !expiresRaw || !signature) return null;
  const payload = `${userIdRaw}.${expiresRaw}`;
  if (sign(payload) !== signature) return null;
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires < Math.floor(Date.now() / 1000)) return null;
  const userId = Number(userIdRaw);
  if (!Number.isInteger(userId) || userId <= 0) return null;
  return { userId, expires };
}
