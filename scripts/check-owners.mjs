// Third lock on the four editors (full-site spec 6.1). Runs before the build.
// For each content file, the last commit's author email is compared with content-owners.json.
// It fails only when a role mailbox changed a file that belongs to a different role.
// The webmaster may change anything. Any other author (the developer) passes.
// No git, or history cut short by a shallow clone: it warns and lets the build go on.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const owners = JSON.parse(readFileSync(join(root, 'content-owners.json'), 'utf8'));
const webmaster = owners.webmaster.toLowerCase();
const roleMailboxes = new Set([webmaster, ...Object.values(owners.files).map((e) => e.toLowerCase())]);

function git(args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

let shallow = false;
try {
  shallow = git(['rev-parse', '--is-shallow-repository']) === 'true';
} catch {
  console.warn('[check-owners] git is not available here. Skipping the owner check.');
  process.exit(0);
}

const problems = [];
for (const [file, owner] of Object.entries(owners.files)) {
  let author = '';
  try {
    author = git(['log', '-1', '--format=%ae', '--', file]).toLowerCase();
  } catch {
    author = '';
  }
  if (!author) {
    console.warn(`[check-owners] no history for ${file}${shallow ? ' (shallow clone)' : ''}. Skipping it.`);
    continue;
  }
  if (!roleMailboxes.has(author)) continue; // developer or other non-editor commit
  if (author === webmaster || author === owner.toLowerCase()) continue;
  problems.push(`${file} was last changed by ${author}, but it belongs to ${owner}.`);
}

if (problems.length) {
  console.error('[check-owners] A login changed a file it does not own. The build is stopped so the live site does not change.');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('Undo that commit on GitHub (or have the webmaster save the file again), then redeploy.');
  process.exit(1);
}
console.log('[check-owners] content files are owned correctly.');
