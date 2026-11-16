const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const candidateNodes = [
  path.resolve(__dirname, 'node'),
  '/tmp/bin/node',
  '/home/godson/.config/Cursor/User/globalStorage/anysphere.cursor-agent-worker/agent-cli/.local/share/cursor-agent/versions/2026.11.11-b912975/node',
  process.execPath,
];

let selectedNode = process.execPath;
for (const cand of candidateNodes) {
  if (fs.existsSync(cand)) {
    try {
      fs.accessSync(cand, fs.constants.X_OK);
      selectedNode = cand;
      break;
    } catch (e) {
      // ignore
    }
  }
}

const tscCli = path.resolve(__dirname, '../node_modules/typescript/bin/tsc');
const viteCli = path.resolve(__dirname, '../node_modules/vite/bin/vite.js');

// 1. Run tsc
const tscProc = spawn(selectedNode, [tscCli], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PATH: `${path.dirname(selectedNode)}:${process.env.PATH || ''}`,
  },
});

tscProc.on('exit', (code) => {
  if (code !== 0) {
    process.exit(code || 1);
  }
  // 2. Run vite build
  const viteProc = spawn(selectedNode, [viteCli, 'build', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PATH: `${path.dirname(selectedNode)}:${process.env.PATH || ''}`,
    },
  });

  viteProc.on('exit', (viteCode) => {
    process.exit(viteCode || 0);
  });
});

