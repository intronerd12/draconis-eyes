const axios = require('axios');
const { spawn, spawnSync } = require('child_process');
const path = require('path');

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000';
let aiProcess = null;
let startingPromise = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isLocalPythonService = () => {
  try {
    const u = new URL(PYTHON_SERVICE_URL);
    return u.hostname === '127.0.0.1' || u.hostname === 'localhost';
  } catch {
    return false;
  }
};

const detectPython = () => {
  const candidates = process.platform === 'win32'
    ? ['python', 'py']
    : ['python3', 'python'];

  for (const cmd of candidates) {
    const checkArgs = cmd === 'py' ? ['-3', '--version'] : ['--version'];
    try {
      const out = spawnSync(cmd, checkArgs, { stdio: 'pipe', timeout: 3000 });
      if (out.status === 0) {
        if (cmd === 'py') return { cmd, baseArgs: ['-3'] };
        return { cmd, baseArgs: [] };
      }
    } catch {}
  }
  return null;
};

const getUvicornArgs = () => {
  const u = new URL(PYTHON_SERVICE_URL);
  const host = u.hostname || '127.0.0.1';
  const port = Number(u.port || 8000);
  return ['-m', 'uvicorn', 'main:app', '--host', host, '--port', String(port)];
};

const isAiHealthy = async (timeout = 1500) => {
  try {
    const res = await axios.get(`${PYTHON_SERVICE_URL}/health`, { timeout });
    return !!res?.data?.status;
  } catch {
    return false;
  }
};

const startAiProcess = () => {
  if (aiProcess && !aiProcess.killed) return aiProcess;

  const py = detectPython();
  if (!py) {
    throw new Error('Python runtime not found for AI service startup');
  }

  const args = [...py.baseArgs, ...getUvicornArgs()];
  console.log(`[ai-manager] Starting AI service via: ${py.cmd} ${args.join(' ')}`);
  aiProcess = spawn(py.cmd, args, {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PYTHONUNBUFFERED: '1' },
    stdio: 'inherit',
  });

  aiProcess.on('exit', (code) => {
    console.log(`[ai-manager] AI service exited with code ${code}`);
    aiProcess = null;
  });
  aiProcess.on('error', (error) => {
    console.error('[ai-manager] AI service process error:', error?.message || error);
    aiProcess = null;
  });

  return aiProcess;
};

const ensureAiServiceRunning = async ({ timeoutMs = 30000 } = {}) => {
  if (await isAiHealthy()) return true;
  if (!isLocalPythonService()) return false;

  if (!startingPromise) {
    startingPromise = (async () => {
      try {
        startAiProcess();
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeoutMs) {
          if (await isAiHealthy()) return true;
          await sleep(1000);
        }
        return false;
      } catch (error) {
        console.error('[ai-manager] Failed to ensure AI service:', error?.message || error);
        return false;
      } finally {
        startingPromise = null;
      }
    })();
  }

  return startingPromise;
};

module.exports = {
  ensureAiServiceRunning,
  isAiHealthy,
};
