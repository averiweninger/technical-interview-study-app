import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { lessons } from "../../src/data/mock/lessons.ts";
import { questions } from "../../src/data/mock/questions.ts";

// Local GoTrue-shaped fixture only. The app uses its real SSR adapter; there is no auth bypass flag.
// No real accounts, emails, credentials, or hosted Supabase requests are used by browser tests.
type TestUser = { id: string; email: string; new_email?: string; aud: string; role: string; email_confirmed_at: string; app_metadata: object; user_metadata: Record<string, unknown>; created_at: string };
const accessTokens = new Map<string, TestUser>();
const refreshTokens = new Map<string, TestUser>();
const users = new Map<string, TestUser>();
const passwords = new Map<string, string>();
const recoveryLinks = new Map<string, string>();
const recoveryFailures = new Set<string>();
const preferenceFailures = new Set<string>();
const currentEmailConfirmed = new Set<string>();
// In-memory PostgREST-shaped records for persistence UI tests, NOT PostgreSQL/RLS verification.
const catalog = lessons.map((lesson) => ({ id: randomUUID(), slug: lesson.id, lesson_versions: [{ id: randomUUID(), version: 1 }] }));
const profiles = new Set<string>();
const questionCatalog = questions.map((question) => ({ id: randomUUID(), slug: question.id, question_versions: [{ id: randomUUID(), version: 1 }] }));
const attempts = new Map<string, Record<string, unknown>>();
type Progress = { user_id: string; lesson_id: string; lesson_version_id: string; status: string; resume_section: number; completed_at: string | null; created_at: string; updated_at: string };
const progress = new Map<string, Progress>();

function makeUser(email: string): TestUser {
  const existing = users.get(email);
  if (existing) return existing;
  const user = { id: randomUUID(), email, aud: "authenticated", role: "authenticated", email_confirmed_at: new Date().toISOString(), app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  users.set(email, user);
  if (email.startsWith("preference-persist-")) user.user_metadata = { first_name: "Taylor", last_name: "Saved", career_path_id: "business-analytics", unrelated_marker: "keep-fixture-metadata" };
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

  // Test-only mailbox. Never present in the application or used against hosted Auth.
  if (url.pathname === "/__recovery" && request.method === "POST") {
    return send(200, { token_hash: recoveryLinks.get(String(input.email)) ?? null });
  }
  if (url.pathname === "/auth/v1/recover") {
    const email = String(input.email);
    if (users.has(email)) recoveryLinks.set(email, randomUUID());
    return send(200, {});
  }

  if (url.pathname.startsWith("/rest/v1/")) {
    const service = request.headers.apikey === "sb_secret_synthetic_e2e_only";
    const actor = accessTokens.get(token);
    const table = url.pathname.slice("/rest/v1/".length);
    const equals = (field: string) => {
      const value = url.searchParams.get(field);
      return value?.startsWith("eq.") ? value.slice(3) : undefined;
    };
    const denied = () => send(actor ? 403 : 401, { code: "42501", message: "Permission denied" });
    const pageRows = <T extends Record<string, unknown>,>(rows: T[]) => {
      const order = url.searchParams.get("order")?.split(".")[0];
      if (order) rows.sort((a, b) => String(a[order]).localeCompare(String(b[order])));
      for (const [field, value] of url.searchParams) {
        if (value.startsWith("gt.")) rows = rows.filter((row) => String(row[field]) > value.slice(3));
      }
      const offset = Number(url.searchParams.get("offset") ?? 0);
      return rows.slice(offset, offset + Number(url.searchParams.get("limit") ?? rows.length));
    };
    if (table === "lessons" && request.method === "GET" && service) {
      if (!equals("slug")) return send(200, catalog);
      const lesson = catalog.find((row) => row.slug === equals("slug"));
      return lesson ? send(200, lesson) : send(406, { code: "PGRST116" });
    }
    if (table === "questions" && request.method === "GET" && service) {
      if (!equals("slug")) return send(200, questionCatalog);
      const question = questionCatalog.find((row) => row.slug === equals("slug"));
      return question ? send(200, question) : send(406, { code: "PGRST116" });
    }
    if (table === "question_attempts") {
      if (!service) return denied();
      if (request.method === "POST") {
        if (!profiles.has(String(input.user_id))) return send(409, { code: "23503" });
        const key = `${input.user_id}:${input.submission_key}`;
        if (attempts.has(key)) return send(409, { code: "23505" });
        const row = { id: randomUUID(), ...input };
        attempts.set(key, row);
        return send(201, row);
      }
      if (request.method === "GET") {
        const owner = equals("user_id");
        if (!owner) return denied();
        const rows = [...attempts.values()].filter((row) => row.user_id === owner && (!equals("submission_key") || row.submission_key === equals("submission_key")));
        return send(200, pageRows(rows));
      }
    }
    if (table === "profiles" && request.method === "POST" && service) {
      if (![...users.values()].some((user) => user.id === input.id)) return send(409, { code: "23503" });
      profiles.add(String(input.id));
      return send(201, {});
    }
    if (table === "lesson_progress") {
      if (actor?.email === "progress-failure@example.test") return send(503, { code: "unavailable" });
      if (request.method === "GET") {
        if (!actor) return denied();
        const rows = [...progress.values()].filter((row) => equals("user_id") === actor.id && row.user_id === actor.id && (!equals("lesson_id") || row.lesson_id === equals("lesson_id")));
        return send(200, pageRows(rows));
      }
      if (!service) return denied();
      if (request.method === "POST") {
        const key = `${input.user_id}:${input.lesson_id}`;
        if (!profiles.has(String(input.user_id))) return send(409, { code: "23503" });
        const now = new Date().toISOString();
        if (!progress.has(key)) progress.set(key, { user_id: String(input.user_id), lesson_id: String(input.lesson_id), lesson_version_id: String(input.lesson_version_id), status: "started", resume_section: 0, completed_at: null, created_at: now, updated_at: now });
        return send(201, {});
      }
      if (request.method === "PATCH") {
        const row = progress.get(`${equals("user_id")}:${equals("lesson_id")}`);
        if (row && row.status === equals("status") && row.lesson_version_id === equals("lesson_version_id")) Object.assign(row, input, { updated_at: new Date().toISOString() });
        return send(200, {});
      }
    }
    return denied();
  }

  if (url.pathname === "/auth/v1/user") {
    const user = accessTokens.get(token);
    if (user && request.method === "PUT") {
      const preferenceFailureKey = `${user.id}:${input.data && typeof input.data === "object" && Object.keys(input.data).length === 1 ? "theme" : "form"}`;
      if (user.email.startsWith("preference-retry-") && input.data && typeof input.data === "object" && "theme" in input.data && !preferenceFailures.has(preferenceFailureKey)) {
        preferenceFailures.add(preferenceFailureKey);
        return send(503, { code: "unavailable", message: "Synthetic preference save failure" });
      }
      if (typeof input.password === "string") {
        if (user.email.startsWith("recovery-update-failure-") && !recoveryFailures.has(user.id)) {
          recoveryFailures.add(user.id);
          return send(422, { code: "weak_password", message: "Synthetic policy failure" });
        }
        passwords.set(user.id, input.password);
      }
      if (user.email === "path-save-failure@example.test" && input.data && typeof input.data === "object" && "career_path_id" in input.data) return send(503, { code: "unavailable" });
      if (input.email === "failure@example.test") return send(500, { code: "unexpected_failure", message: "Synthetic failure" });
      if (input.data && typeof input.data === "object") {
        for (const [key, value] of Object.entries(input.data)) {
          if (value === null) delete user.user_metadata[key];
          else user.user_metadata[key] = value;
        }
      }
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
    const existingUser = users.get(email);
    if (input.password !== (existingUser ? passwords.get(existingUser.id) ?? "Synthetic-passphrase-123" : "Synthetic-passphrase-123") || !email.endsWith("@example.test")) {
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
    if (input.type === "recovery") {
      const entry = [...recoveryLinks].find(([, value]) => value === input.token_hash);
      if (!entry) return send(403, { code: "otp_expired", message: "Invalid or expired link" });
      recoveryLinks.delete(entry[0]);
      return send(200, issueSession(users.get(entry[0])!));
    }
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
