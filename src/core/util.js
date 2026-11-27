import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const NG = { on: false };   // online match state (filled in net/net-game.js); declared first so every hook can read it
const $ = s => document.querySelector(s);
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
// double click skips animations: pending waits end now, new ones are near-instant for a moment, scenes run faster.
// Nothing is decided for the player — only the waiting is cut.
const SKIP = { until: 0, timers: new Set() };
const skipping = () => performance.now() < SKIP.until;
// pause (ui/pause.js): a wait that ends while paused is held until the game resumes; PAUSE.gen changes when the game is
// thrown away (restart, continue, exit), and waits from the old game then never end, so nothing stale runs on the new one
const PAUSE = { on: false, frozen: false, q: [], gen: 0, at: 0 };
const PREFS = { fast: false };
try { PREFS.fast = localStorage.getItem('hexterra-fast') === '1'; } catch {}
const wait = ms => new Promise(res => { if (skipping()) ms = Math.min(ms, 40); else if (PREFS.fast) ms *= .5;
  const gen = PAUSE.gen, r = () => { if (gen !== PAUSE.gen) return; if (PAUSE.frozen) PAUSE.q.push(res); else res(); };
  const t = { r }; t.id = setTimeout(() => { SKIP.timers.delete(t); r(); }, ms); SKIP.timers.add(t); });
function skipAnims(){
  SKIP.until = performance.now() + 1200;
  SKIP.timers.forEach(t => { clearTimeout(t.id); t.r(); }); SKIP.timers.clear();
  if (typeof tween !== 'undefined' && tween) tween.start -= 1e6;
  if (typeof SCR !== 'undefined' && SCR.hurry) SCR.hurry();
}
addEventListener('dblclick', e => { if (e.target.closest && e.target.closest('input,textarea,.edtag,#chat')) return; skipAnims(); });
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
function shuffle(arr, rng=Math.random){for(let i=arr.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}
const pick = (arr, rng=Math.random) => arr[Math.floor(rng()*arr.length)];
const angDiff = (a,b) => Math.abs(Math.atan2(Math.sin(a-b), Math.cos(a-b)));

