import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    cwd: opts.cwd || root,
    stdio: "inherit",
    shell: opts.shell ?? false,
    env: process.env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function pythonBin() {
  const win = path.join(root, "backend", ".venv", "Scripts", "python.exe");
  const nix = path.join(root, "backend", ".venv", "bin", "python");
  if (fs.existsSync(win)) return win;
  if (fs.existsSync(nix)) return nix;
  return null;
}

console.log("→ Installing root npm deps…");
run(isWin ? "npm.cmd" : "npm", ["install"], { shell: isWin });

console.log("→ Installing frontend npm deps…");
run(isWin ? "npm.cmd" : "npm", ["install"], {
  cwd: path.join(root, "frontend"),
  shell: isWin,
});

const venvPython = pythonBin();
if (!venvPython) {
  console.log("→ Creating backend/.venv…");
  run("python", ["-m", "venv", ".venv"], { cwd: path.join(root, "backend"), shell: isWin });
}

const py = pythonBin();
if (!py) {
  console.error("Could not find/create backend/.venv Python");
  process.exit(1);
}

console.log("→ Installing backend Python deps…");
run(py, ["-m", "pip", "install", "-r", "requirements.txt"], {
  cwd: path.join(root, "backend"),
});

function ensureEnv(exampleRel, envRel) {
  const example = path.join(root, exampleRel);
  const envFile = path.join(root, envRel);
  if (!fs.existsSync(envFile) && fs.existsSync(example)) {
    fs.copyFileSync(example, envFile);
    console.log(`→ Created ${envRel} from example`);
  }
}

ensureEnv("backend/.env.example", "backend/.env");
ensureEnv("frontend/.env.example", "frontend/.env");

console.log("\nSetup complete. Start the stack with:\n  npm run dev\n");
