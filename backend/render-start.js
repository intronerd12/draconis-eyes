const { spawn, spawnSync } = require('child_process');
const path = require('path');

const root = __dirname;
const args = process.argv.slice(2);
const noTrain = args.includes('--no-train');

const detectPython = () => {
  const candidates = ['python3', 'python', 'py'];
  for (const cmd of candidates) {
    const checkArgs = cmd === 'py' ? ['-3', '--version'] : ['--version'];
    try {
      const out = spawnSync(cmd, checkArgs, { stdio: 'pipe' });
      if (out.status === 0) {
        if (cmd === 'py') return { cmd, baseArgs: ['-3'] };
        return { cmd, baseArgs: [] };
      }
    } catch {}
  }
  return null;
};

const py = detectPython();
if (!py) {
  console.error('[render-start] Python is not available. AI service cannot start.');
  process.exit(1);
}

const env = { ...process.env };
env.PYTHONUNBUFFERED = '1';
if (noTrain) env.DRAGON_AUTO_TRAIN = '0';

const nodeProc = spawn('node', ['server.js'], {
  cwd: root,
  env,
  stdio: 'inherit',
});

const aiArgs = [...py.baseArgs, '-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'];
const aiProc = spawn(py.cmd, aiArgs, {
  cwd: root,
  env,
  stdio: 'inherit',
});

let shuttingDown = false;

const stopAll = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  try { nodeProc.kill('SIGTERM'); } catch {}
  try { aiProc.kill('SIGTERM'); } catch {}
  setTimeout(() => process.exit(code), 300);
};

nodeProc.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`[render-start] Node server exited (${code ?? 0}). Stopping AI service.`);
    stopAll(code ?? 1);
  }
});

aiProc.on('exit', (code) => {
  if (!shuttingDown) {
    console.error(`[render-start] AI service exited (${code ?? 0}). Stopping Node server.`);
    stopAll(code ?? 1);
  }
});

process.on('SIGINT', () => stopAll(0));
process.on('SIGTERM', () => stopAll(0));
