import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

// Local GoTrue-shaped fixture only. The app uses its real SSR adapter; there is no auth bypass flag.
// No real accounts, emails, credentials, or hosted Supabase requests are used by browser tests.
type TestUser = { id: string; email: string; new_email?: string; aud: string; role: string; email_confirmed_at: string; app_metadata: object; user_metadata: Record<string, unknown>; created_at: string };
const accessTokens = new Map<string, TestUser>();
const refreshTokens = new Map<string, TestUser>();
const users = new Map<string, TestUser>();
const currentEmailConfirmed = new Set<string>();

function makeUser(email: string): TestUser {
  const existing = users.get(email);
  if (existing) return existing;
  const user = { id: randomUUID(), email, aud: "authenticated", role: "authenticated", email_confirmed_at: new Date().toISOString(), app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  users.set(email, user);
  return user;
}

function issueSession(user: TestUser) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const accessToken = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, exp: expiresAt, aud: "authenticated", role: "authenticated" })}.${randomUUID()}`;
  const refreshToken = randomUUID();
  accessTokens.set(accessToken, user);
  refreshTokens.set(refreshToken, user);
  return { access_token: accessToken, refresh_token: refreshToken, token_type: "bearer", expires_in: 3600, expires_at: expiresAt, user };
}

const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  response.setHeader("X-Supabase-Api-Version", "2024-01-01");
  const url = new URL(request.url ?? "/", "http://127.0.0.1:54329");
  const send = (status: number, value: object) => {
    response.writeHead(status); response.end(JSON.stringify(value));
  };
  if (url.pathname === "/health") return send(200, { ok: true });
  let raw = "";
  for await (const chunk of request) {
    raw += String(chunk);
    if (raw.length > 16_384) return send(413, { error: "too_large" });
  }
  let input: Record<string, unknown>;
  try { input = raw ? JSON.parse(raw) : {}; } catch { return send(400, { error: "invalid_json" }); }
  const token = request.headers.authorization?.replace(/^Bearer /, "") ?? "";

  if (url.pathname === "/auth/v1/user") {
    const user = accessTokens.get(token);
    if (user && request.method === "PUT") {
      if (input.email === "failure@example.test") return send(500, { code: "unexpected_failure", message: "Synthetic failure" });
      if (input.data && typeof input.data === "object") user.user_metadata = { ...user.user_metadata, ...input.data };
      if (typeof input.email === "string") user.new_email = input.email;
    }
    return user ? send(200, user) : send(401, { code: "bad_jwt", message: "Invalid session" });
  }
  if (url.pathname === "/auth/v1/token") {
    if (url.searchParams.get("grant_type") === "pkce") {
      if (input.auth_code !== "valid-pkce-code" || !input.code_verifier) return send(400, { code: "bad_code_verifier", message: "Invalid link" });
      return send(200, issueSession(makeUser("pkce@example.test")));
    }
    if (url.searchParams.get("grant_type") === "refresh_token") {
      const user = refreshTokens.get(String(input.refresh_token));
      if (!user) return send(400, { code: "refresh_token_not_found", message: "Expired session" });
      refreshTokens.delete(String(input.refresh_token));
      return send(200, issueSession(user));
    }
    const email = String(input.email);
    if (input.password !== "Synthetic-passphrase-123" || !email.endsWith("@example.test")) {
      return send(400, { code: "invalid_credentials", message: "Invalid credentials" });
    }
    return send(200, issueSession(makeUser(email)));
  }
  if (url.pathname === "/auth/v1/signup") {
    if (input.email === "disclosed@example.test") return send(422, { code: "user_already_exists", message: "User already registered" });
    const user = makeUser(String(input.email));
    if (input.data && typeof input.data === "object") user.user_metadata = { ...input.data };
    return send(200, { ...user, email_confirmed_at: null, identities: [] });
  }
  if (url.pathname === "/auth/v1/verify") {
    if (input.type === "email_change" && typeof input.token_hash === "string") {
      const [stage, id] = input.token_hash.split(":");
      const user = [...users.values()].find((value) => value.id === id);
      if (!user?.new_email) return send(403, { code: "otp_expired", message: "Expired link" });
      if (stage === "email-current") { currentEmailConfirmed.add(id); return send(200, { user, session: null }); }
      if (stage !== "email-new" || !currentEmailConfirmed.has(id)) return send(403, { code: "otp_expired", message: "Complete both links" });
      users.delete(user.email);
      user.email = user.new_email; delete user.new_email;
      users.set(user.email, user);
      return send(200, issueSession(user));
    }
    if (input.type === "email" && typeof input.token_hash === "string" && input.token_hash.startsWith("signup:")) {
      const user = users.get(input.token_hash.slice(7));
      return user ? send(200, issueSession(user)) : send(403, { code: "otp_expired", message: "Expired link" });
    }
    if (input.token_hash !== "valid-email-token" || input.type !== "email") return send(403, { code: "otp_expired", message: "Expired link" });
    return send(200, issueSession(makeUser("confirmed@example.test")));
  }
  if (url.pathname === "/auth/v1/logout") {
    const user = accessTokens.get(token);
    accessTokens.delete(token);
    for (const [key, value] of refreshTokens) if (value.id === user?.id) refreshTokens.delete(key);
    response.writeHead(204); response.end(); return;
  }
  return send(404, { error: "unsupported_fixture_route" });
});

server.listen(54329, "127.0.0.1");
process.on("SIGTERM", () => {
  server.closeAllConnections();
  server.close();
  process.exit(0);
});
