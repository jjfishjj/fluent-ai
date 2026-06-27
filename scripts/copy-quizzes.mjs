// Copies the standalone quizzes into the Vite build output so the existing
// Vercel deployment serves them at /quizzes/, /quizzes/memory-quiz/ and
// /quizzes/memory-genius-quiz/. Runs after `vite build` (see vercel.json
// buildCommand and package.json postbuild). Single source of truth: /quizzes.
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist', 'quizzes');

const files = [
  'index.html',
  'memory-quiz/index.html',
  'memory-genius-quiz/index.html',
];

mkdirSync(dist, { recursive: true });
let copied = 0;
for (const f of files) {
  const src = join(root, 'quizzes', f);
  if (!existsSync(src)) { console.warn(`[copy-quizzes] missing: ${f}`); continue; }
  const dest = join(dist, f);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
  copied++;
}
console.log(`[copy-quizzes] copied ${copied}/${files.length} files into dist/quizzes/`);
