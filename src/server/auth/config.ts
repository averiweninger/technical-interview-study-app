import "server-only";

/** A configured origin prevents attacker-controlled Host/redirect headers from entering email links. */
export function getAppOrigin() {
  const value = process.env.APP_URL ?? (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("Configure APP_URL with the application origin."); }
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && loopback)) ||
      url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("APP_URL must be an HTTPS origin, or HTTP on localhost.");
  }
  return url.origin;
}

export function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  if (!process.env.APP_URL && process.env.NODE_ENV !== "production") {
    return ["http://localhost:3000", "http://127.0.0.1:3000"].includes(origin);
  }
  return origin === getAppOrigin();
}

// Auth is server-only in this slice, so browser JavaScript never needs to read session cookies.
export function authCookieOptions() {
  return { httpOnly: true, sameSite: "lax" as const, secure: getAppOrigin().startsWith("https:"), path: "/" };
}
