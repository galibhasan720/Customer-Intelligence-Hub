import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

function pythonBin() {
  const win = path.join(root, "backend", ".venv", "Scripts", "python.exe");
  const nix = path.join(root, "backend", ".venv", "bin", "python");
  if (fs.existsSync(win)) return win;
  if (fs.existsSync(nix)) return nix;
  console.error("Missing backend/.venv — run: npm run setup");
  process.exit(1);
}

const py = pythonBin();
const uvicorn = isWin
  ? path.join(root, "backend", ".venv", "Scripts", "uvicorn.exe")
  : path.join(root, "backend", ".venv", "bin", "uvicorn");

const bin = fs.existsSync(uvicorn) ? uvicorn : null;
const result = bin
  ? spawnSync(bin, ["app.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"], {
      cwd: path.join(root, "backend"),
      stdio: "inherit",
      env: process.env,
    })
  : spawnSync(py, ["-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"], {
      cwd: path.join(root, "backend"),
      stdio: "inherit",
      env: process.env,
    });

process.exit(result.status ?? 1);
