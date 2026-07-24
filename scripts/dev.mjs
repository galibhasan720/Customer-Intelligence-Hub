import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const npm = isWin ? "npm.cmd" : "npm";
const FE_PORT = 3000;

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd || root,
    stdio: "inherit",
    shell: opts.shell ?? false,
    env: process.env,
  });
  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

function pythonBin() {
  const win = path.join(root, "backend", ".venv", "Scripts", "python.exe");
  const nix = path.join(root, "backend", ".venv", "bin", "python");
  if (fs.existsSync(win)) return win;
  if (fs.existsSync(nix)) return nix;
  console.error("Missing backend/.venv — run: npm run setup");
  process.exit(1);
}

function prefixLog(name, colorCode, chunk) {
  const text = chunk.toString();
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    process.stdout.write(`\x1b[${colorCode}m[${name}]\x1b[0m ${line}\n`);
  }
}

console.log("→ Starting Postgres (Docker)…");
run("docker", ["compose", "-f", "backend/docker-compose.yml", "up", "-d", "postgres"], {
  shell: isWin,
});

console.log("→ Waiting for Postgres on :5432…");
run(npm, ["exec", "--", "wait-on", "tcp:127.0.0.1:5432"], { shell: isWin });

const py = pythonBin();
console.log("→ Applying migrations…");
run(py, ["-m", "scripts.migrations"], { cwd: path.join(root, "backend") });

console.log("→ Seeding demo data…");
run(py, ["-m", "scripts.seed_data"], { cwd: path.join(root, "backend") });

console.log(`→ Starting API (:8000) + Frontend (:${FE_PORT})…`);
console.log("   Open http://localhost:3000");
console.log("   Demo logins: customer@example.com / password123");
console.log("                organizer@example.com / password123\n");

const children = [];

const api = spawn(process.execPath, [path.join(root, "scripts", "run-api.mjs")], {
  cwd: root,
  stdio: ["ignore", "pipe", "pipe"],
  env: process.env,
  shell: false,
});
api.stdout.on("data", (d) => prefixLog("api", "36", d));
api.stderr.on("data", (d) => prefixLog("api", "36", d));
children.push(api);

const web = spawn(
  npm,
  [
    "run",
    "dev",
    "--prefix",
    "frontend",
    "--",
    "--host",
    "127.0.0.1",
    "--port",
    String(FE_PORT),
  ],
  {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    env: process.env,
    // npm.cmd on Windows needs shell
    shell: isWin,
  },
);
web.stdout.on("data", (d) => prefixLog("web", "35", d));
web.stderr.on("data", (d) => prefixLog("web", "35", d));
children.push(web);

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (signal) shutdown(1);
    shutdown(code ?? 0);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
