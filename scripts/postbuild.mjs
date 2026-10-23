// After `next build` on a Node host (Hostinger): put the public files and built assets next to the
// self-contained server, which only serves what's inside .next/standalone. Vercel doesn't need this.
import { cpSync, existsSync } from 'node:fs';

if (existsSync('.next/standalone')) {
  cpSync('public', '.next/standalone/public', { recursive: true });
  cpSync('.next/static', '.next/standalone/.next/static', { recursive: true });
  console.log('postbuild: copied public/ and .next/static/ into .next/standalone');
}
