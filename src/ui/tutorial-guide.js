// ================= TUTORIAL: Nándor's panel (core/tutorial.js runs the script) =================
// Nándor stands in a little 3D view facing you (he does not spin: he is talking to you), next to a paper note with
// his words. "Siguiente" moves on; when he asks for something, the note says so and only that can be used.
const TG = { el: null, v: null, p: null, talk: 0, res: null, typing: null };
function tutGuideOpen(){
  if (!TG.el){
    const el = TG.el = document.createElement('div'); el.id = 'tut';
    el.innerHTML = `<div class="tutv"><canvas></canvas></div><div class="tutb"><div class="tuth"><b>Nándor</b><span>el viajero</span><em class="tutc"></em></div><p class="tutt"></p><div class="tutr"><span class="tuthint"></span><span class="tutbtns"></span></div></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { e.stopPropagation(); const b = e.target.closest('[data-tut]'); if (TG.typing) TG.typing(); if (b && TG.res){ SFX.click?.(); const r = TG.res; TG.res = null; r(b.dataset.tut); } });   // a button answers at once; elsewhere a click shows the whole text
  }
  TG.el.classList.add('show');
  if (!TG.lift) TG.lift = setInterval(() => { if (TUT.on) tutLift(); }, 400);   // the bottom of the screen changes (boxes, village): his note keeps above it
  if (!TG.v && miniInit()){
    const p = TG.p = travelerModel(); p.g.rotation.y = .35;
    const v = TG.v = miniView(TG.el.querySelector('canvas'), { w: 180, h: 190, res: 1, fov: 24, fps: 30, tick: (dt, t) => {
      TG.talk = Math.max(0, TG.talk - dt);
      const k = TG.talk > 0 ? 1 : 0;
      p.body.position.y = Math.sin(t*1.8)*.008;                                       // breathing
      p.head.rotation.y = Math.sin(t*.7)*.12 + k*Math.sin(t*5)*.05; p.head.rotation.x = k*Math.sin(t*7)*.04;
      if (p.armL){ p.armL.rotation.x = -(.2 + k*(.5 + Math.sin(t*4)*.25)); p.armL.rotation.z = k*.25; }   // the free hand explains while he talks
    } });
    v.sc.add(p.g); v.cam.position.set(.2, 1.95, 2.25); v.cam.lookAt(0, 1.6, 0);   // from the chest up, with room for the straw hat
    const key = new THREE.DirectionalLight(0xfff0d8, 1.4); key.position.set(.5, 1.8, 3); v.sc.add(key);   // light on his face, under the brim
  }
}
function tutGuideClose(){ if (TG.el) TG.el.classList.remove('show'); if (TG.res){ const r = TG.res; TG.res = null; r(false); } }
// his words appear quickly letter by letter (a click shows them all)
function tutWrite(html, o = {}){
  const el = TG.el, t = el.querySelector('.tutt'); TG.talk = 2.2; SFX.talk?.({ gender: 'm' });
  if (TG.p) setFaceExpr(TG.p, o.expr || 'sonrisa');
  el.querySelector('.tutc').textContent = TUT_CHAPTERS[TUT.chapter] ? `${TUT.chapter + 1}/${TUT_CHAPTERS.length} · ${TUT_CHAPTERS[TUT.chapter]}` : '';
  t.innerHTML = deEmo(html);
  const nodes = []; const walk = n => n.childNodes.forEach(c => c.nodeType === 3 ? nodes.push([c, c.textContent]) : walk(c)); walk(t);
  nodes.forEach(([c]) => c.textContent = '');
  let i = 0, ni = 0, done = false;
  const all = () => { done = true; nodes.forEach(([c, s]) => c.textContent = s); TG.typing = null; };
  TG.typing = all;
  (async () => { while (!done && ni < nodes.length){ const [c, s] = nodes[ni]; c.textContent = s.slice(0, ++i); if (i >= s.length){ ni++; i = 0; } if (i % 2 === 0) await new Promise(r => setTimeout(r, 12)); } if (!done) all(); })();
  el.classList.remove('nudge', 'tuck');
}
// a line with "Siguiente" (or other buttons): resolves with the button's key, false if the tutorial was closed
function tutSay(html, o = {}){
  if (!TUT.on) return Promise.resolve(false);
  TUT.allow.clear(); tutGlow(null); tutArrow(null);
  tutWrite(html, o);
  const btns = o.buttons || [['next', 'Siguiente ▶']];
  TG.el.querySelector('.tuthint').textContent = '';
  TG.el.querySelector('.tutbtns').innerHTML = btns.map(([k, n], i) => `<button data-tut="${k}" class="${i === btns.length - 1 ? 'primary' : ''}">${n}</button>`).join('');
  return new Promise(r => { TG.res = r; });
}
// a line that waits for something to happen in the game; o.allow = what can be used meanwhile, o.wait = nothing to do
async function tutAct(html, until, o = {}){
  if (!TUT.on) return false;
  TUT.allow = new Set(o.allow || []); tutGlow(null);
  tutWrite(html, o);
  TG.el.querySelector('.tuthint').textContent = o.wait ? 'Espera un momento…' : 'Hazlo para seguir';
  TG.el.querySelector('.tutbtns').innerHTML = ''; tutGlow(TUT.glow);   // after clearing the row: "Terminar turno" may go in it
  const gen = PAUSE.gen;
  while (!until()){ tutDodge(); await wait(250); if (!TUT.on || PAUSE.gen !== gen) return false; }
  TG.el.classList.remove('alt', 'tuck'); tutArrow(null);
  TUT.allow.clear(); tutGlow(null);
  return true;
}
// you tried something else: Nándor reminds you
function tutNudge(){ if (!TG.el) return; const el = TG.el; el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge'); TG.talk = .8; if (TG.p) setFaceExpr(TG.p, 'duda'); SFX.click?.(); }
// the button he is talking about shines (the action bar's tokens shine in stepHexbar)
function tutGlow(k){
  document.querySelectorAll('.tutglow').forEach(x => x.classList.remove('tutglow'));
  const b = $('#b-endturn'); if (!b) return;
  if (k === 'fin' && TG.el){ TG.el.querySelector('.tutbtns').appendChild(b); b.classList.add('intut', 'tutglow'); }   // his note asks for it, the button is right there
  else if (b.classList.contains('intut')){ b.classList.remove('intut'); document.body.appendChild(b); }
}
// the spot he asks for must never be under his note: if it is, he moves to the other side of the screen
function tutDodge(){
  const el = TG.el; if (!el) return;
  tutLift(); tutArrowUpdate();
  { const a = PB.ask && PB.ask.classList.contains('on') ? PB.ask.getBoundingClientRect() : null, b = el.getBoundingClientRect();   // a villager's question (with buttons) goes over his note: he steps aside
    el.classList.toggle('tuck', !!a && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top); }
  if (mode !== 'board') return;
  let x = null, z = null;
  const slot = G.setup ? tutSlot() : null;
  if (slot){ if (G.phase === 'setupV'){ const v = G.verts[slot.v]; x = v.x; z = v.z; } else if (G.phase === 'setupE'){ const e = G.edges[slot.e], a = G.verts[e.a], b = G.verts[e.b]; x = (a.x + b.x)/2; z = (a.z + b.z)/2; } }
  else if (TUT.targetE != null){ const e = G.edges[TUT.targetE], a = G.verts[e.a], b = G.verts[e.b]; x = (a.x + b.x)/2; z = (a.z + b.z)/2; }
  if (x === null) return;
  const p = new THREE.Vector3(x, .3, z).project(camera), r = canvas.getBoundingClientRect(), sx = r.left + (p.x + 1)/2*r.width, sy = r.top + (1 - p.y)/2*r.height;
  const box = el.getBoundingClientRect(), over = sx > box.left - 30 && sx < box.right + 30 && sy > box.top - 30 && sy < box.bottom + 30;
  if (over) el.classList.add('alt');   // to the other corner, until this step is done
}

// in his corner (bottom right, where "Terminar turno" goes), his note sits above whatever is at the bottom of the screen
function tutLift(){
  const el = TG.el; if (!el || el.classList.contains('alt')) return;
  const z = parseFloat(getComputedStyle(el).zoom) || 1, note = el.querySelector('.tutb'), nw = note.offsetWidth*z, right = innerWidth - (el.querySelector('canvas').offsetWidth - 10)*z - 6, left = right - nw;
  const tops = [];
  { const c = $('#hexbar canvas'); if (c && c.offsetParent && mode === 'board'){ const r = c.getBoundingClientRect(); tops.push(r.top + r.height*.13); } }   // where the tokens start (the canvas has room above them)
  [$('#v-help'), ...document.querySelectorAll('#pbox .pb.on')].forEach(e => { if (!e || !e.offsetParent) return; const r = e.getBoundingClientRect(); if (r.height > 4 && r.right > left && r.left < right) tops.push(r.top); });   // only what is under his note
  const lift = Math.max(70*z, tops.length ? innerHeight - Math.min(...tops) + 6 : 0);   // at least up by his face
  el.style.setProperty('--tutlift', (lift/z).toFixed(1) + 'px');
}
// a brass arrow over what he asks you to touch
function tutArrow(pt){
  let a = $('#tut-arrow');
  if (!a){ a = document.createElement('div'); a.id = 'tut-arrow'; a.innerHTML = '<svg viewBox="0 0 11 12" shape-rendering="crispEdges"><path fill="#2a1a0c" d="M3 0h5v6h3v1h-1v1h-1v1h-1v1h-1v1h-1v1H5v-1H4v-1H3V9H2V8H1V7H0V6h3z"/><path fill="#e9c46a" d="M4 1h3v6h2v1H8v1H7v1H6v1H5v-1H4V9H3V8H2V7h2z"/><path fill="#fff3c0" d="M4 1h1v6H4z"/></svg>'; document.body.appendChild(a); }
  if (!pt){ a.classList.remove('on'); return; }
  a.style.left = Math.round(pt[0]) + 'px'; a.style.top = Math.round(pt[1]) + 'px'; a.classList.add('on');
}
function tutArrowUpdate(){
  if (!TUT.on || !G || !modal.classList.contains('hidden')) return tutArrow(null);   // a window is open: it has the floor
  const top = r => r && r.width ? [r.left + r.width/2, r.top - 4] : null, el = s => { const e = $(s); return e && e.offsetParent ? e.getBoundingClientRect() : null; };
  const board = (x, z) => { if (mode !== 'board') return null; const p = new THREE.Vector3(x, .35, z).project(camera), r = canvas.getBoundingClientRect(); return [r.left + (p.x + 1)/2*r.width, r.top + (1 - p.y)/2*r.height - 18]; };
  let pt = null; const k = TUT.glow;
  if (k && k !== 'fin' && mode === 'board' && HB.cam && HB.cv){ const T = HB.tokens.find(t => t.k === k); if (T){ const p = T.g.getWorldPosition(new THREE.Vector3()); p.y += .35; p.project(HB.cam); const r = HB.cv.getBoundingClientRect(); pt = [r.left + (p.x + 1)/2*r.width, r.top + (1 - p.y)/2*r.height - 30]; } }
  else if (G.setup && tutSlot() && (G.phase === 'setupV' || G.phase === 'setupE')){ const s = tutSlot(); if (G.phase === 'setupV'){ const v = G.verts[s.v]; pt = board(v.x, v.z); } else { const e = G.edges[s.e], a = G.verts[e.a], b = G.verts[e.b]; pt = board((a.x + b.x)/2, (a.z + b.z)/2); } }
  else if (TUT.targetE != null && G.buildMode){ const e = G.edges[TUT.targetE], a = G.verts[e.a], b = G.verts[e.b]; pt = board((a.x + b.x)/2, (a.z + b.z)/2); }
  else if (TUT.allow.has('jugadores') && (G.amuletPick || !TUT.allow.has('amuletos'))){ const pl = [...document.querySelectorAll('#players .pl')].filter(e => e.offsetParent)[1]; pt = pl ? top(pl.getBoundingClientRect()) : null; }
  else if (TUT.allow.has('amuletos')) pt = top(el('#amubox'));
  else if (TUT.allow.has('cartas')){ const c = [...document.querySelectorAll('#cards *')].map(e => e.getBoundingClientRect()).filter(r => r.width > 20)[0]; pt = top(c); }
  else if (TUT.allow.has('misiones')) pt = top(el('#quest-icon'));
  else if (TUT.allow.has('visitar') && TUT.plan){ const v = G.verts[TUT.plan[0].v]; pt = board(v.x, v.z); }
  else if (TUT.allow.has('puerto')){ const pi = tutMyPort(), g = PORT_GROUPS.find(g => g.userData.port === pi); if (g) pt = board(g.position.x, g.position.z); }
  if (pt && (pt[0] < 0 || pt[1] < 0 || pt[0] > innerWidth || pt[1] > innerHeight)) pt = null;
  tutArrow(pt);
}
// Enter (and Space on the board) = Siguiente
addEventListener('keydown', e => {
  if (!TUT.on || PAUSE.on || !TG.el || !TG.el.classList.contains('show') || e.target.closest?.('input,textarea')) return;
  if (!(e.key === 'Enter' || (e.key === ' ' && mode !== 'village'))) return;
  if (TG.typing){ TG.typing(); e.preventDefault(); return; }
  const btns = TG.el.querySelectorAll('.tutbtns [data-tut]');
  if (TG.res && btns.length === 1){ e.preventDefault(); SFX.click?.(); const r = TG.res; TG.res = null; r(btns[0].dataset.tut); }
});
