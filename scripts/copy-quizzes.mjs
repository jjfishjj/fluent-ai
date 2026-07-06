// Copies the standalone static microsites into the Vite build output so the
// existing Vercel deployment serves them alongside the app:
//   /quizzes/, /quizzes/memory-quiz/, /quizzes/memory-genius-quiz/
//   /pitch/   (Fluent AI × Brain Lab pitch deck)
// Runs after `vite build` (see vercel.json buildCommand). Single source of
// truth lives in the matching repo folders.
import { cpSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// repo-relative source files -> copied to dist/<same path>
const files = [
  'quizzes/index.html',
  'quizzes/memory-quiz/index.html',
  'quizzes/memory-genius-quiz/index.html',
  'pitch/index.html',
];

let copied = 0;
for (const f of files) {
  const src = join(root, f);
  if (!existsSync(src)) { console.warn(`[copy-quizzes] missing: ${f}`); continue; }
  const dest = join(root, 'dist', f);
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
  copied++;
}
console.log(`[copy-quizzes] copied ${copied}/${files.length} static files into dist/`);
