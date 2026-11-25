// Lints the joined game code, the way the browser sees it (all src/ files share one scope).
// Undefined names are errors (one of those once killed every click on the board); unused code is a warning.
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
execSync('node build.mjs --dev', { stdio: 'inherit' });
const html = readFileSync('dist/catroan.dev.html', 'utf8'), open = '<script type="module">';
const a = html.indexOf(open) + open.length, b = html.indexOf('</script>', a);
writeFileSync('dist/lint-game.mjs', html.slice(a, b));
try { execSync('npx --yes eslint@8 --no-eslintrc -c tools/eslintrc.json -f unix dist/lint-game.mjs', { stdio: 'inherit' }); console.log('Sin errores (las advertencias, si hay, son variables sin usar).'); }
catch { process.exitCode = 1; }   // the report above says what (line numbers are of dist/lint-game.mjs)
