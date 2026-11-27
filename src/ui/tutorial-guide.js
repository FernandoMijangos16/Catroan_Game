// ================= TUTORIAL: Ulises' panel (core/tutorial.js runs the script) =================
// Ulises stands in a little 3D view facing you (he does not spin: he is talking to you), next to a paper note with
// his words. "Siguiente" moves on; when he asks for something, the note says so and only that can be used.
const TG = { el: null, v: null, p: null, talk: 0, res: null, typing: null };
function tutGuideOpen(){
  if (!TG.el){
    const el = TG.el = document.createElement('div'); el.id = 'tut';
    el.innerHTML = `<div class="tutv"><canvas></canvas></div><div class="tutb"><div class="tuth"><b>Ulises</b><span>el viajero</span><em class="tutc"></em></div><p class="tutt"></p><div class="tutr"><span class="tuthint"></span><span class="tutbtns"></span></div></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { e.stopPropagation(); const b = e.target.closest('[data-tut]'); if (TG.typing) TG.typing(); if (b && TG.res){ SFX.click?.(); const r = TG.res; TG.res = null; r(b.dataset.tut); } });   // a button answers at once; elsewhere a click shows the whole text
  }
  TG.el.classList.add('show');
  if (!TG.v && miniInit()){
    const p = TG.p = travelerModel(); p.g.rotation.y = .35;
    const v = TG.v = miniView(TG.el.querySelector('canvas'), { w: 130, h: 150, res: 1, fov: 24, fps: 30, tick: (dt, t) => {
      TG.talk = Math.max(0, TG.talk - dt);
      const k = TG.talk > 0 ? 1 : 0;
      p.body.position.y = Math.sin(t*1.8)*.008;                                       // breathing
      p.head.rotation.y = Math.sin(t*.7)*.12 + k*Math.sin(t*5)*.05; p.head.rotation.x = k*Math.sin(t*7)*.04;
      if (p.armL){ p.armL.rotation.x = -(.2 + k*(.5 + Math.sin(t*4)*.25)); p.armL.rotation.z = k*.25; }   // the free hand explains while he talks
    } });
    v.sc.add(p.g); v.cam.position.set(.15, 1.7, 2.7); v.cam.lookAt(0, 1.36, 0);
    const key = new THREE.DirectionalLight(0xfff0d8, 1.4); key.position.set(.5, 1.8, 3); v.sc.add(key);   // light on his face, under the brim
  }
}
function tutGuideClose(){ if (TG.el) TG.el.classList.remove('show'); if (TG.res){ const r = TG.res; TG.res = null; r(false); } }
// his words appear quickly letter by letter (a click shows them all)
function tutWrite(html, o = {}){
  const el = TG.el, t = el.querySelector('.tutt'); TG.talk = 2.2;
  if (TG.p) setFaceExpr(TG.p, o.expr || 'sonrisa');
  el.querySelector('.tutc').textContent = TUT_CHAPTERS[TUT.chapter] ? `${TUT.chapter + 1}/${TUT_CHAPTERS.length} · ${TUT_CHAPTERS[TUT.chapter]}` : '';
  t.innerHTML = deEmo(html);
  const nodes = []; const walk = n => n.childNodes.forEach(c => c.nodeType === 3 ? nodes.push([c, c.textContent]) : walk(c)); walk(t);
  nodes.forEach(([c]) => c.textContent = '');
  let i = 0, ni = 0, done = false;
  const all = () => { done = true; nodes.forEach(([c, s]) => c.textContent = s); TG.typing = null; };
  TG.typing = all;
  (async () => { while (!done && ni < nodes.length){ const [c, s] = nodes[ni]; c.textContent = s.slice(0, ++i); if (i >= s.length){ ni++; i = 0; } if (i % 2 === 0) await new Promise(r => setTimeout(r, 12)); } if (!done) all(); })();
  el.classList.remove('nudge');
}
// a line with "Siguiente" (or other buttons): resolves with the button's key, false if the tutorial was closed
function tutSay(html, o = {}){
  if (!TUT.on) return Promise.resolve(false);
  TUT.allow.clear(); tutGlow(null);
  tutWrite(html, o);
  const btns = o.buttons || [['next', 'Siguiente ▶']];
  TG.el.querySelector('.tuthint').textContent = '';
  TG.el.querySelector('.tutbtns').innerHTML = btns.map(([k, n], i) => `<button data-tut="${k}" class="${i === btns.length - 1 ? 'primary' : ''}">${n}</button>`).join('');
  return new Promise(r => { TG.res = r; });
}
// a line that waits for something to happen in the game; o.allow = what can be used meanwhile, o.wait = nothing to do
async function tutAct(html, until, o = {}){
  if (!TUT.on) return false;
  TUT.allow = new Set(o.allow || []); tutGlow(TUT.glow);
  tutWrite(html, o);
  TG.el.querySelector('.tuthint').textContent = o.wait ? 'Espera un momento…' : 'Hazlo para seguir';
  TG.el.querySelector('.tutbtns').innerHTML = '';
  const gen = PAUSE.gen;
  while (!until()){ tutDodge(); await wait(250); if (!TUT.on || PAUSE.gen !== gen) return false; }
  TG.el.classList.remove('right');
  TUT.allow.clear(); tutGlow(null);
  return true;
}
// you tried something else: Ulises reminds you
function tutNudge(){ if (!TG.el) return; const el = TG.el; el.classList.remove('nudge'); void el.offsetWidth; el.classList.add('nudge'); TG.talk = .8; if (TG.p) setFaceExpr(TG.p, 'duda'); SFX.click?.(); }
// the button he is talking about shines (the action bar's tokens shine in stepHexbar)
function tutGlow(k){ document.querySelectorAll('.tutglow').forEach(x => x.classList.remove('tutglow')); if (k === 'fin') $('#b-endturn')?.classList.add('tutglow'); }
// the spot he asks for must never be under his note: if it is, he moves to the other side of the screen
function tutDodge(){
  const el = TG.el; if (!el || mode !== 'board') return;
  let x = null, z = null;
  const slot = G.setup ? tutSlot() : null;
  if (slot){ if (G.phase === 'setupV'){ const v = G.verts[slot.v]; x = v.x; z = v.z; } else if (G.phase === 'setupE'){ const e = G.edges[slot.e], a = G.verts[e.a], b = G.verts[e.b]; x = (a.x + b.x)/2; z = (a.z + b.z)/2; } }
  else if (TUT.targetE != null){ const e = G.edges[TUT.targetE], a = G.verts[e.a], b = G.verts[e.b]; x = (a.x + b.x)/2; z = (a.z + b.z)/2; }
  if (x === null) return;
  const p = new THREE.Vector3(x, .3, z).project(camera), r = canvas.getBoundingClientRect(), sx = r.left + (p.x + 1)/2*r.width, sy = r.top + (1 - p.y)/2*r.height;
  const box = el.getBoundingClientRect(), over = sx > box.left - 30 && sx < box.right + 30 && sy > box.top - 30 && sy < box.bottom + 30;
  if (over) el.classList.toggle('right', sx < innerWidth/2);   // to the half of the screen the spot is not in
}
