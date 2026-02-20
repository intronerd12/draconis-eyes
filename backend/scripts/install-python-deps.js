const { spawnSync } = require('child_process');
const path = require('path');

const isRender = String(process.env.RENDER || '').toLowerCase() === 'true';
const forceInstall = String(process.env.DRAGON_INSTALL_PY_DEPS || '').toLowerCase() === '1';

if (!isRender && !forceInstall) {
  console.log('[postinstall] Skipping Python dependency install (not Render).');
  process.exit(0);
}

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
  console.error('[postinstall] Python not found. Cannot install AI dependencies.');
  process.exit(1);
}

const run = (args) => {
  const out = spawnSync(py.cmd, [...py.baseArgs, ...args], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: process.env,
  });
  return out.status === 0;
};

console.log('[postinstall] Installing Python dependencies from requirements.txt ...');
const ok = run(['-m', 'pip', 'install', '-r', 'requirements.txt']);
if (!ok) {
  console.error('[postinstall] Failed to install Python dependencies.');
  process.exit(1);
}

// Best-effort ML install. If this fails on the platform, app can still run in heuristic mode.
console.log('[postinstall] Installing optional ML dependencies from requirements-ml.txt ...');
const mlOk = run(['-m', 'pip', 'install', '-r', 'requirements-ml.txt']);
if (!mlOk) {
  console.warn('[postinstall] Warning: ML dependencies failed to install. AI will run in fallback mode.');
}

console.log('[postinstall] Python dependencies installed.');
