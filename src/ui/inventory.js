// ================= FLOATING INVENTORY WINDOWS (diamond slots with spinning 3D models) =================
// one shared tiny renderer draws every slot of every window
const SLOT_R = { r: null, sc: null, cam: null };
function slotRenderer(){
  if (SLOT_R.r) return SLOT_R;
  try {
    const r2 = new THREE.WebGLRenderer({ antialias: false, alpha: true }); r2.setSize(64, 64); r2.setPixelRatio(1); r2.outputColorSpace = THREE.SRGBColorSpace;
    const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xfff4e0, 0x5a4a3a, 2.3));
    const dl = new THREE.DirectionalLight(0xfff0d8, 2.6); dl.position.set(2, 3, 2.5); sc.add(dl);
    Object.assign(SLOT_R, { r: r2, sc, cam: new THREE.PerspectiveCamera(30, 1, .05, 50) });
  } catch {}
  return SLOT_R;
}
const WINS = [];
function floatWin(o){
  const W = { id: o.id, keys: o.keys, slots: {}, cv: {}, pivots: {}, spin: {}, t: 0, acc: 0, S: o.S || 58, h: false, x: o.x, y: o.y, side: o.side || 'l', o, active: null };
  const KEY = 'hexterra-' + (o.store || o.id);
  try { Object.assign(W, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch {}
  const el = document.createElement('div'); el.id = o.id; el.className = 'fwin edfr'; W.el = el;
  el.innerHTML = `<div class="ibar"><b class="edtag" title="Arrastra para mover · doble clic: tamaño normal">${o.label || ''}</b><button class="flip"></button></div><div class="slots">${o.keys.map(k => `<div class="islot zero" data-k="${k}" title="${o.title(k)}"><span class="nm">${o.name ? o.name(k) : o.title(k)}</span><div class="sq"><div class="dia"></div><canvas width="64" height="64"></canvas><b>0</b><em class="need"></em></div></div>`).join('')}</div>${['tl', 'tr', 'bl', 'br'].map(c => `<i class="rs ${c}" data-c="${c}"></i>`).join('')}`;
  document.body.appendChild(el);
  o.keys.forEach(k => { const s = el.querySelector(`.islot[data-k="${k}"]`); W.slots[k] = s; W.cv[k] = s.querySelector('canvas').getContext('2d'); W.spin[k] = 0; });
  W.apply = noClamp => {
    el.style.setProperty('--s', W.S + 'px'); el.classList.toggle('h', W.h);
    el.querySelector('.flip').innerHTML = W.h ? '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M5 2v12M5 14l-3-3M5 14l3-3M11 14V2M11 2l-3 3M11 2l3 3" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg> Vertical' : '<svg viewBox="0 0 16 16" width="13" height="13"><path d="M2 5h12M14 5l-3-3M14 5l-3 3M14 11H2M2 11l3-3M2 11l3 3" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/></svg> Horizontal';
    el.style.transformOrigin = 'top left';
    let r = el.getBoundingClientRect();
    if (!noClamp && r.height > innerHeight - 90 && W.S > 34){ W.S = Math.max(34, W.S*(innerHeight - 90)/r.height); el.style.setProperty('--s', W.S + 'px'); r = el.getBoundingClientRect(); }
    if (!W.drag){ W.x = W.side === 'r' ? innerWidth - 4 - r.width : 4; const top = topFor(W.side); W.y = clamp(W.y, top, Math.max(top, innerHeight - r.height - 6)); }
    el.style.left = W.x + 'px'; el.style.top = W.y + 'px';
  };
  W.apply();
  W.save = () => { try { localStorage.setItem(KEY, JSON.stringify({ S: W.S, h: W.h, y: W.y, side: W.side })); } catch {} };
  el.querySelector('.flip').addEventListener('click', e => { e.stopPropagation(); W.h = !W.h; W.apply(); W.save(); SFX.click?.(); });
  el.querySelector('.edtag').addEventListener('dblclick', e => { e.stopPropagation(); W.S = o.S || 58; W.side = o.side || 'l'; W.apply(); dockWins(W); W.save(); SFX.click?.(); });
  let op = null;
  el.addEventListener('pointerdown', e => {
    if (e.target.closest('.ibar') && !e.target.closest('.edtag')) return;   // the name plate moves the window like the rest of the frame
    e.preventDefault(); e.stopPropagation();
    if (W.payTo){ op = { kind: 'move', x0: e.clientX, y0: e.clientY, moved: 0 }; return; }   // the thief bar: a tap, never a drag
    const rs = e.target.closest('.rs'), r0 = el.getBoundingClientRect();
    W.x = r0.left; W.y = r0.top; W.drag = true;
    op = { kind: rs ? 'resize' : 'move', c: rs?.dataset.c, x0: e.clientX, y0: e.clientY, X: W.x, Y: W.y, S: W.S, r0, moved: 0 };
    try { el.setPointerCapture(e.pointerId); } catch {}
  });
  el.addEventListener('pointermove', e => {
    if (!op) return;
    const dx = e.clientX - op.x0, dy = e.clientY - op.y0; op.moved = Math.max(op.moved, Math.hypot(dx, dy));
    if (op.moved > 4) el.classList.add('drag');
    if (W.payTo) return;
    if (op.kind === 'move'){ W.x = op.X + dx; W.y = op.Y + dy; }
    else {
      const sx = op.c[1] === 'r' ? 1 : -1, sy = op.c[0] === 'b' ? 1 : -1, n = o.keys.length*.9 + .3;
      const major = W.h ? dx*sx : dy*sy, minor = W.h ? dy*sy : dx*sx;
      W.S = clamp(op.S + (major/n + minor)/2, 34, 150); W.apply(true);
      const r1 = el.getBoundingClientRect();
      W.x = sx < 0 ? op.r0.right - r1.width : op.X; W.y = sy < 0 ? op.r0.bottom - r1.height : op.Y;
    }
    W.apply();
  });
  const end = e => {
    if (!op) return;
    const click = op.moved < 5 && op.kind === 'move'; op = null; el.classList.remove('drag');
    if (W.payTo){ if (click){ const k = o.keys.find(k => { const r = W.slots[k].getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }); if (k) W.payTo(k); } return; }   // the thief bar: taps only
    { const r = el.getBoundingClientRect(); W.side = r.left + r.width/2 < innerWidth/2 ? 'l' : 'r'; W.drag = false; W.apply(); dockWins(W); } W.save();
    if (click && (W.payTo || o.onSlot)){ const k = o.keys.find(k => { const r = W.slots[k].getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }); if (k) (W.payTo || o.onSlot)(k); }
  };
  el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  el.addEventListener('pointerenter', () => el.classList.add('hov')); el.addEventListener('pointerleave', () => el.classList.remove('hov'));
  addEventListener('resize', () => { W.apply(); dockWins(); });
  W.update = () => { if (!G) return; o.keys.forEach(k => { const n = o.count(k), s = W.slots[k]; s.querySelector('b').textContent = n; s.classList.toggle('zero', n === 0); s.classList.toggle('active', W.active === k); }); };
  W.setNeeds = cost => { o.keys.forEach(k => { const s = W.slots[k], need = cost && cost[k], em = s.querySelector('.need'); s.classList.toggle('want', !!need); if (need){ em.textContent = '×' + need; em.classList.toggle('ok', o.count(k) >= need); } }); };
  W.models = () => { const R = slotRenderer(); if (!R.r) return; o.keys.forEach(k => { if (W.pivots[k]) R.sc.remove(W.pivots[k]); const it = o.model(k), box = new THREE.Box3().setFromObject(it), c = box.getCenter(new THREE.Vector3()); it.position.sub(c); const pv = new THREE.Group(); pv.add(it); pv.visible = false; pv.userData.sz = box.getSize(new THREE.Vector3()).length(); R.sc.add(pv); W.pivots[k] = pv; }); };
  WINS.push(W);
  return W;
}
const topFor = side => { const c = $('#corner'); return c && (side === 'r') === (CORNER_SIDE === 'r') ? Math.round(c.getBoundingClientRect().bottom + 8) : Math.round(46*UI_S); };
// windows always live along the screen edges (materials left, buildings right); same-side windows never overlap
function dockWins(moved){
  ['l', 'r'].forEach(side => {
    const ws = WINS.filter(W => W.side === side && W.el.style.display !== 'none').sort((a, b) => (a === moved ? -1 : b === moved ? 1 : a.y - b.y));
    const placed = [];
    ws.forEach(W => { let r = W.el.getBoundingClientRect(); for (const P of placed){ const q = P.el.getBoundingClientRect(); if (W.y < q.bottom + 6 && W.y + r.height > q.top - 6) W.y = q.bottom + 6; } if (W.y + r.height > innerHeight - 6){ const above = placed.length ? placed[0].el.getBoundingClientRect().top - r.height - 6 : 44; if (above >= 44) W.y = above; } W.apply(); placed.push(W); });
  });
}
function stepWins(dt){
  const R = slotRenderer(); if (!R.r || !G) return;
  WINS.forEach(W => {
    W.t += dt; W.acc += dt; if (W.acc < 1/30) return; const step = W.acc; W.acc = 0;
    W.keys.forEach((k, i) => {
      const pv = W.pivots[k], ctx = W.cv[k]; if (!pv) return;
      W.spin[k] = Math.max(0, W.spin[k] - step*1.6);
      pv.visible = true; pv.rotation.y = W.t*1.1 + i*1.3 + W.spin[k]*W.spin[k]*6; pv.rotation.z = .42 + Math.sin(W.t*1.3 + i)*.06; pv.rotation.x = .12;
      const z = pv.userData.sz; R.cam.position.set(0, z*.5, z*1.5); R.cam.lookAt(0, 0, 0);
      pv.scale.setScalar(1 + Math.sin(Math.min(1, W.spin[k])*Math.PI)*.18);
      R.r.render(R.sc, R.cam); ctx.clearRect(0, 0, 64, 64); ctx.drawImage(R.r.domElement, 0, 0);
      pv.visible = false;
    });
  });
}
// ---------- resources window ----------
let INV = { el: null, slots: {}, pending: { madera: 0, ladrillo: 0, lana: 0, trigo: 0, mineral: 0 } };
const invShown = r => G ? Math.max(0, G.players[0].res[r] - INV.pending[r]) : 0;
let PIECES = null;
function initInventory(){
  const pending = { madera: 0, ladrillo: 0, lana: 0, trigo: 0, mineral: 0 };
  INV = floatWin({ id: 'inv', label: 'Recursos', store: 'inv3', S: 54, keys: RES, side: 'l', x: 4, y: 48, title: r => RES_NAME[r], name: r => RES_NAME[r], count: r => invShown(r), model: k => makeResourceItem(k) });
  INV.pending = pending; INV.models();
  PIECES = floatWin({ id: 'pieces', label: 'Construcciones', store: 'pieces3', S: 54, keys: ['camino', 'pueblo', 'ciudad'], side: 'r', x: 4, y: Math.round(($('#corner')?.getBoundingClientRect().bottom || 120) + 8), name: k => ({ camino: 'Caminos', pueblo: 'Pueblos', ciudad: 'Ciudades' })[k], title: k => ({ camino: 'Caminos', pueblo: 'Pueblos', ciudad: 'Ciudades' })[k] + ' (toca para verlos en el tablero)',
    count: k => G ? ({ camino: G.players[0].roads, pueblo: G.players[0].pueblos, ciudad: G.players[0].ciudades })[k] : 0,
    model: k => pieceModel(k), onSlot: k => { highlightPieces(PIECES.active === k ? null : k); SFX.click?.(); } });
  PIECES.models();
  setTimeout(() => dockWins(), 60);
  updateInventory();
}
function pieceModel(k){
  if (k === 'camino'){ const g = new THREE.Group(), r = fencedRoad(0, { x: -.5, z: 0 }, { x: .5, z: 0 }); r.position.set(0, 0, 0); r.rotation.y = .5; g.add(r); return outlineItem(g); }
  const v = boardVillage(0, k === 'ciudad', k === 'ciudad' ? 3 : 2, k === 'ciudad' ? 11 : 5); return outlineItem(v);
}
function updateInventory(){ WINS.forEach(W => W.update()); updateAmuletBox(); }
const stepInventory = dt => stepWins(dt);
// glowing outline on the main player's pieces of one kind
const HL = { kind: null, items: [] };
const GLOW_MAT = new THREE.ShaderMaterial({
  uniforms: { t: { value: 0 }, col: { value: new THREE.Color(0xffd34a) } }, side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  vertexShader: 'uniform float t; void main(){ vec3 n = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position, 1.); mv.xyz += n*(-mv.z)*(.0042 + .0016*sin(t*5.)); gl_Position = projectionMatrix*mv; }',
  fragmentShader: 'uniform vec3 col; uniform float t; void main(){ gl_FragColor = vec4(col*(.8 + .2*sin(t*5.)), 1.); }',
});
function highlightPieces(kind){
  HL.items.forEach(o => o.parent && o.parent.remove(o)); HL.items = []; HL.kind = kind;
  if (PIECES){ PIECES.active = kind; PIECES.update(); }
  if (!kind || !G || !boardScene) return;
  const roots = kind === 'camino' ? G.edges.filter(e => e.road === 0 && e.mesh).map(e => e.mesh) : G.verts.filter(v => v.building && v.building.p === 0 && v.building.type === kind && v.mesh).map(v => v.mesh);
  roots.forEach(root => {
    const meshes = []; root.traverse(o => { if (o.isMesh && !o.userData.glow && !o.userData.outline) meshes.push(o); });
    meshes.forEach(m => { const gm = new THREE.Mesh(m.geometry, GLOW_MAT); gm.userData.glow = true; gm.raycast = () => {}; m.add(gm); HL.items.push(gm); });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: fxTex().spark, color: 0xffd34a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: .55 }));
    root.updateMatrixWorld(); const p = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3()); sp.position.copy(p); sp.position.y += .05; sp.scale.setScalar(kind === 'camino' ? .5 : .7); sp.userData.glowSprite = true; boardScene.add(sp); HL.items.push(sp);
  });
  if (!roots.length) notify(`Aún no tienes ${({ camino: 'caminos', pueblo: 'pueblos', ciudad: 'ciudades' })[kind]} en el tablero`, G.players[0].color, 'sys');
}
function stepHighlight(t){ GLOW_MAT.uniforms.t.value = t; HL.items.forEach(o => { if (o.userData.glowSprite) o.material.opacity = .35 + .25*Math.sin(t*5); }); }
// a delivery promise for resources the main player gets: counts update when the item lands
function invExpect(res, n, ms = 9000){
  const tok = { res, n }; INV.pending[res] += n;
  setTimeout(() => { if (tok.n > 0){ INV.pending[res] = Math.max(0, INV.pending[res] - tok.n); tok.n = 0; updateInventory(); refresh(); } }, ms);
  return tok;
}
function flyToInventory(tok, sx, sy, delay = 0){
  setTimeout(() => {
    const slot = INV.slots[tok.res]; if (!slot){ landInv(tok); return; }
    const sr = (slot.querySelector('.sq') || slot).getBoundingClientRect(), tx = sr.left + sr.width/2, ty = sr.top + sr.height/2;
    const img = document.createElement('img'); img.className = 'invfly'; img.src = RES_IMG[tok.res] || ''; document.body.appendChild(img);
    const mx = (sx + tx)/2 + (Math.random() - .5)*80, my = Math.min(sy, ty) - 90 - Math.random()*60;
    const a = img.animate([
      { transform: `translate(${sx}px, ${sy}px) scale(.5) rotate(0deg)`, opacity: .2 },
      { transform: `translate(${sx}px, ${sy - 20}px) scale(1.1) rotate(-40deg)`, opacity: 1, offset: .12 },
      { transform: `translate(${mx}px, ${my}px) scale(1.35) rotate(-200deg)`, offset: .5 },
      { transform: `translate(${tx}px, ${ty}px) scale(.55) rotate(-360deg)`, opacity: .9 },
    ], { duration: 1050, easing: 'cubic-bezier(.45,.05,.4,1)' });
    a.onfinish = () => { img.remove(); landInv(tok); };
  }, delay*1000);
}
function landInv(tok){
  if (tok.n > 0){ tok.n--; INV.pending[tok.res] = Math.max(0, INV.pending[tok.res] - 1); }
  const s = INV.slots[tok.res]; if (s){ s.classList.remove('pulse'); void s.offsetWidth; s.classList.add('pulse'); }
  INV.spin[tok.res] = 1; SFX.pick?.(); updateInventory(); refresh();
}
const toScreen = v => { const p = v.clone().project(camera), r = canvas.getBoundingClientRect(); return [r.left + (p.x + 1)/2*r.width, r.top + (1 - p.y)/2*r.height]; };

