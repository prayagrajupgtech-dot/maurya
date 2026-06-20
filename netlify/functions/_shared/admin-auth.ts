import { jsonResponse, sha256 } from "./http.js";

const COOKIE_NAME = "maurya_admin_session";
const SESSION_DURATION_SECONDS = 12 * 60 * 60;

function getRequiredEnv(name: "ADMIN_PASSWORD" | "ADMIN_SESSION_SECRET") {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getRequiredEnv("ADMIN_SESSION_SECRET")),
    { hash: "SHA-256", name: "HMAC" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Buffer.from(signature).toString("base64url");
}

async function safeEqual(left: string, right: string) {
  const [leftHash, rightHash] = await Promise.all([sha256(left), sha256(right)]);
  let difference = 0;
  for (let index = 0; index < leftHash.length; index += 1) {
    difference |= leftHash.charCodeAt(index) ^ rightHash.charCodeAt(index);
  }
  return difference === 0;
}

function readCookie(request: Request) {
  const cookies = request.headers.get("cookie") || "";
  for (const cookie of cookies.split(";")) {
    const [name, ...valueParts] = cookie.trim().split("=");
    if (name === COOKIE_NAME) return valueParts.join("=");
  }
  return "";
}

export async function verifyAdminPassword(password: string) {
  return safeEqual(password, getRequiredEnv("ADMIN_PASSWORD"));
}

export async function createAdminSessionCookie(request: Request) {
  const payload = encodeBase64Url(JSON.stringify({ expiresAt: Date.now() + SESSION_DURATION_SECONDS * 1000 }));
  const token = `${payload}.${await sign(payload)}`;
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_DURATION_SECONDS}${secure}`;
}

export function clearAdminSessionCookie(request: Request) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0${secure}`;
}

export async function isAdminRequest(request: Request) {
  const token = readCookie(request);
  const separator = token.lastIndexOf(".");
  if (separator < 1) return false;

  const payload = token.slice(0, separator);
  const providedSignature = token.slice(separator + 1);
  const expectedSignature = await sign(payload);
  if (!(await safeEqual(providedSignature, expectedSignature))) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { expiresAt?: unknown };
    return typeof session.expiresAt === "number" && session.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export async function requireAdmin(request: Request) {
  if (await isAdminRequest(request)) return null;
  return jsonResponse({ error: "Admin authentication required." }, 401);
}
