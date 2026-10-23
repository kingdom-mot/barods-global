// `npm start`: run the self-contained server when the build made one (Hostinger), otherwise `next start`.
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const standalone = existsSync('.next/standalone/server.js');
const [cmd, args] = standalone ? ['node', ['.next/standalone/server.js']] : ['npx', ['next', 'start']];
const child = spawn(cmd, args, { stdio: 'inherit', env: { HOSTNAME: '0.0.0.0', ...process.env } });
child.on('exit', (code) => process.exit(code ?? 0));
