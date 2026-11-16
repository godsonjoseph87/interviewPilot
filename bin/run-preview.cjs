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

const viteCli = path.resolve(__dirname, '../node_modules/vite/bin/vite.js');

const child = spawn(selectedNode, [viteCli, 'preview', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PATH: `${path.dirname(selectedNode)}:${process.env.PATH || ''}`,
  },
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

