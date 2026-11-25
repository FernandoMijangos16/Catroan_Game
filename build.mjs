// Hexterra build: joins src/ (in manifest order) into one HTML.
//   node build.mjs        → dist/catroan.html (minified + light obfuscation), dist/catroan.dev.html (readable)
//                            and dist/desktop/ (offline copy for Electron: local three.js + font)
//   node build.mjs --dev  → only the readable build
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
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

// desktop (Electron): same production page, but three.js and the font are local files so it runs offline
const swap = (s, from, to) => { if (!s.includes(from)) throw new Error('desktop build: text not found → ' + from); return s.replace(from, () => to); };
let desk = html;
desk = swap(desk, '<link rel="preconnect" href="https://fonts.googleapis.com">', '');
desk = swap(desk, '<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">',
  "<style>@font-face{font-family:'Pixelify Sans';src:url(fonts/PixelifySans.ttf) format('truetype');font-weight:400 700;font-display:block}</style>");
desk = swap(desk, 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', './vendor/three/three.module.js');
desk = swap(desk, 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/', './vendor/three/addons/');
desk = swap(desk, 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js', './vendor/peerjs/peerjs.min.js');
const D = new URL('./dist/desktop/', import.meta.url);
rmSync(D, { recursive: true, force: true });
const copy = (from, to) => { const t = new URL(to, D); mkdirSync(new URL('./', t), { recursive: true }); copyFileSync(new URL(from, import.meta.url), t); };
writeFileSync((mkdirSync(D, { recursive: true }), new URL('index.html', D)), desk);
copy('./node_modules/three/build/three.module.js', 'vendor/three/three.module.js');
copy('./node_modules/three/LICENSE', 'vendor/three/LICENSE');
for (const f of ['controls/OrbitControls.js', 'utils/BufferGeometryUtils.js']) copy('./node_modules/three/examples/jsm/' + f, 'vendor/three/addons/' + f);
copy('./node_modules/peerjs/dist/peerjs.min.js', 'vendor/peerjs/peerjs.min.js');
copy('./node_modules/peerjs/LICENSE', 'vendor/peerjs/LICENSE');
copy('./assets/fonts/PixelifySans.ttf', 'fonts/PixelifySans.ttf');
copy('./assets/fonts/OFL.txt', 'fonts/OFL.txt');
console.log('desk  → dist/desktop/');
