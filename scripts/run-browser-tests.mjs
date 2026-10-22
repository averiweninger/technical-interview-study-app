import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("../node_modules/@playwright/test/cli.js", import.meta.url));
const args = process.argv.slice(2);
const explicitProject = args.some((arg) => arg === "--project" || arg.startsWith("--project="));
const inspectOnly = args.some((arg) => ["--list", "--help", "--version", "--ui"].includes(arg));
// A full run shares one localhost IP. Fresh app processes per viewport isolate the
// real ten-minute Auth limiter without weakening it or adding a runtime test bypass.
const projects = explicitProject || inspectOnly ? [null] : ["desktop", "mobile", "tablet"];
for (const project of projects) {
  if (project) console.log(`\nRunning ${project} checks with a fresh local app and synthetic fixture.`);
  const code = await new Promise((resolve) => {
    const child = spawn(process.execPath, [cli, "test", ...(project ? ["--project", project] : []), ...args], { stdio: "inherit" });
    child.once("error", () => resolve(1));
    child.once("exit", (status) => resolve(status ?? 1));
  });
  if (code !== 0) { process.exitCode = code; break; }
}
