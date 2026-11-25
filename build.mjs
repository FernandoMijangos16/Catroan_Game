// Hexterra build: joins src/ (in manifest order) into one HTML.
//   node build.mjs        → dist/catroan.html (minified + light obfuscation) and dist/catroan.dev.html (readable)
//   node build.mjs --dev  → only the readable build
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { minify } from 'terser';
import { transform } from 'esbuild';

const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const manifest = JSON.parse(read('./src/manifest.json'));
const template = read('./src/index.html');
const css = read('./src/styles/main.css').replace(/\n$/, '');
const js = manifest.map(f => read('./src/' + f)).join('').replace(/\n$/, '');
const page = (style, script, tpl = template) => tpl.replace('/*@STYLES*/', () => '\n' + style + '\n').replace('//@SCRIPT', () => script);

mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('./dist/catroan.dev.html', import.meta.url), page(css, js));
console.log('dev   →', (page(css, js).length/1024).toFixed(0), 'KB');
if (process.argv.includes('--dev')) process.exit(0);

// production: minify everything, rename internal names (top-level included), drop console/debugger and comments
const out = await minify(js, {
  module: true, toplevel: true, ecma: 2020,
  compress: { passes: 2, drop_console: true, drop_debugger: true, pure_getters: false },
  mangle: { toplevel: true },
  format: { comments: false },
});
const mcss = (await transform(css, { loader: 'css', minify: true })).code.trim();
const tight = template.replace(/>\s+</g, '><');            // only the page markup, never the script's strings
const html = page(mcss, out.code, tight);
writeFileSync(new URL('./dist/catroan.html', import.meta.url), html);
console.log('prod  →', (html.length/1024).toFixed(0), 'KB');
