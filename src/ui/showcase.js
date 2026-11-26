// ================= SHOWCASE: the screen dims and your cards (or amulets) come to the front, big =================
const SHOW = { el: null, kind: null, sel: -1, tiles: [], o: null, views: [] };
function showcaseClose(){ if (!SHOW.el || !SHOW.kind) return; SHOW.el.classList.remove('show'); SHOW.views.forEach(v => v.alive = false); SHOW.views = []; pbHide(PB.note); SHOW.kind = null; }
function showcase(kind, title, tiles, o){
  let el = SHOW.el; if (!el){ el = SHOW.el = document.createElement('div'); el.id = 'showcase'; document.body.appendChild(el);
    el.addEventListener('click', e => { if (!e.target.closest('.sct')) showcaseClose(); });
    addEventListener('keydown', e => { if (!SHOW.kind) return; const n = SHOW.tiles.length; if (e.key === 'Escape') showcaseClose(); else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft'){ scSel((SHOW.sel + (e.key === 'ArrowRight' ? 1 : -1) + n) % n); e.preventDefault(); } else if (e.key === 'Enter' && SHOW.sel >= 0){ SHOW.o.onPick(SHOW.sel); e.preventDefault(); } }); }
  SHOW.views.forEach(v => v.alive = false); SHOW.views = []; SHOW.kind = kind; SHOW.tiles = tiles; SHOW.o = o; SHOW.sel = -1;
  const n = tiles.length, mid = (n - 1)/2;
  el.innerHTML = `<div class="sctitle">${title}</div><div class="scrow ${kind}">${tiles.map((t, i) => `<div class="sct" data-i="${i}" style="--r:${((i - mid)*Math.min(6, 28/Math.max(1, n))).toFixed(1)}deg;--y:${(Math.abs(i - mid)**2*2.2).toFixed(1)}px;z-index:${10 + i}">${t.html}</div>`).join('')}</div><div class="schint">Pasa el cursor para ver qué hace · toca para usar · toca afuera para cerrar</div>`;
  el.querySelectorAll('.sct').forEach(t => { const i = +t.dataset.i; t.addEventListener('pointerenter', () => scSel(i)); t.addEventListener('click', e => { e.stopPropagation(); if (SHOW.sel !== i && matchMedia('(pointer:coarse)').matches){ scSel(i); return; } o.onPick(i); }); });
  if (o.mount) o.mount(el);
  el.classList.add('show'); SFX.scroll?.();
}
function scSel(i){ pbPlace(); SHOW.sel = i; SHOW.el.querySelectorAll('.sct').forEach((t, k) => t.classList.toggle('on', k === i)); const t = SHOW.tiles[i]; if (t) sysNote(t.info, { ms: 0 }); SFX.click?.(); }
// --- the hand of development cards
function openHand(){
  const hand = G.players[0].cards || []; if (!hand.length) return;
  const tiles = hand.map(c => { const d = CARD_DEFS[c.t], [st, ok] = cardStatus(0, c); return { html: `<img src="${cardFaceURL(c.t, G.players[0].color, 2)}"><i class="${ok ? 'ok' : 'no'}"></i>`, info: `<span style="color:${d.col}">${d.kind}</span> · <b>${d.name}</b><br>${d.desc}<br><span class="${ok ? '' : 'muted'}">${ok ? ic('check') + ' ' : ''}${st}</span>` }; });
  showcase('cards', 'Tus cartas', tiles, { onPick: i => { const c = hand[i], [st, ok] = cardStatus(0, c); if (!ok){ sysNote(st, { ms: 2600 }); return; } showcaseClose(); clickCard(i); } });
}
// --- the wooden amulet box (next to the hand) and its showcase
const AMBOX = { el: null, v: null, key: '' };
function amuletsOf(p){ const a = G && G.players[p] ? G.players[p].amulets || {} : {}; return AMK.filter(k => a[k] > 0); }
function initAmuletBox(){
  const el = AMBOX.el = document.createElement('div'); el.id = 'amubox'; el.title = 'Caja de amuletos'; el.innerHTML = '<canvas></canvas><b></b>'; document.body.appendChild(el);
  el.addEventListener('click', e => { e.stopPropagation(); if (!document.body.classList.contains('boxfront') && !document.body.classList.contains('nocards')){ swapDeck(true); return; } openAmulets(); });
  if (!miniInit()) return;
  const S = { hov: 0, lid: 0 }; el.addEventListener('pointerenter', () => S.hov = 1); el.addEventListener('pointerleave', () => S.hov = 0);
  const v = AMBOX.v = miniView(el.querySelector('canvas'), { w: 112, h: 98, res: 1, fov: 30, fps: 24, tick: (dt, t) => { S.lid += (S.hov - S.lid)*Math.min(1, dt*8); if (AMBOX.inside) AMBOX.inside.children.forEach((o, i) => { o.position.y = .3 + S.lid*.14 + Math.sin(t*2 + i)*.015; if (o.userData.inner) o.userData.inner.rotation.y += dt*1.2; }); if (AMBOX.g) AMBOX.g.rotation.y = -.25 + Math.sin(t*.5)*.05; } });
  v.cam.position.set(0, 1.5, 1.55); v.cam.lookAt(0, .18, -.02);
  updateAmuletBox(true);
}
// an old, lidless crate where things get tossed when you don't know where else to put them
function chestModel(){
  const g = new THREE.Group(), wood = plankMat(1, 0x3e2816), wood2 = plankMat(5, 0x33200f), iron = ironMat();
  const W = 1.1, D = .74, H = .46;
  g.add(mesh(GEO.box, wood2, 0, 0, 0, W - .04, .05, D - .04));
  [[0, D/2, W, .045], [0, -D/2, W, .045]].forEach(([x, z, w, t]) => [0, .155, .31].forEach((y, r) => { const b = mesh(GEO.box, r === 1 ? wood2 : wood, x, y, z, w + (r === 2 ? .02 : 0), .145, t); b.rotation.z = (r - 1)*.01; g.add(b); }));
  [[-W/2, 0], [W/2, 0]].forEach(([x]) => [0, .155, .31].forEach((y, r) => g.add(mesh(GEO.box, r === 0 ? wood2 : wood, x, y, 0, .045, .145, D))));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { g.add(mesh(GEO.box, iron, sx*(W/2 - .02), -.005, sz*(D/2 - .02), .09, H + .02, .09)); });
  g.add(mesh(GEO.box, iron, 0, .2, D/2 + .03, W + .02, .04, .02)); g.add(mesh(GEO.box, iron, 0, .2, -D/2 - .03, W + .02, .04, .02));
  { const br = mesh(GEO.box, wood, .3, .44, 0, .06, .05, D + .1); br.rotation.x = .12; br.rotation.y = .3; g.add(br); }     // a loose broken slat
  // junk at the bottom
  g.add(mesh(GEO.cyl14, icm(0xc8a040, { m: .5 }), -.3, .1, .16, .07, .02, .07)); g.add(mesh(GEO.cyl14, icm(0xc8a040, { m: .5 }), -.24, .12, .2, .07, .02, .07));
  { const rope = new THREE.Mesh(new THREE.TorusGeometry(.13, .03, 4, 10), icm(0x8a7048)); rope.rotation.x = Math.PI/2; rope.position.set(.28, .08, -.14); g.add(rope); }
  AMBOX.lid = null; return g;
}
function updateAmuletBox(force){
  if (!AMBOX.el || !G) return;
  const list = amuletsOf(0), tot = list.reduce((s2, k) => s2 + G.players[0].amulets[k], 0), key = list.map(k => k + G.players[0].amulets[k]).join(',');
  AMBOX.el.querySelector('b').textContent = tot || ''; AMBOX.el.classList.toggle('empty', !tot);
  if (!AMBOX.v || (!force && key === AMBOX.key)) return; AMBOX.key = key;
  if (AMBOX.g) AMBOX.v.sc.remove(AMBOX.g);
  const g = AMBOX.g = chestModel(); AMBOX.v.sc.add(g);
  const inside = AMBOX.inside = new THREE.Group(); g.add(inside);
  list.slice(0, 4).forEach((k, i, a) => { const sp = spinner(amuletModel(k), .34); sp.position.set((i - (a.length - 1)/2)*.24, .3, (i % 2 ? -.1 : .08)); sp.rotation.x = 0; sp.rotation.z = (i % 2 ? -.5 : .4); inside.add(sp); });
}
// the crate and the deck trade places, spinning
function swapDeck(boxFront){ const b = document.body; if (b.classList.contains('boxfront') === boxFront) return; b.classList.add('deckspin'); b.classList.toggle('boxfront', boxFront); SFX.scroll?.(); setTimeout(() => b.classList.remove('deckspin'), 600); }
function openAmulets(){
  const list = amuletsOf(0);
  if (!list.length){ sysNote('Tu caja de amuletos está vacía. El <b>brujo</b> de las afueras te da amuletos por sus misiones.', { ms: 3200 }); return; }
  const A = G.players[0].amulets;
  const tiles = list.map(k => ({ html: `<canvas data-k="${k}"></canvas><span>${AMULETS[k].name}</span>${A[k] > 1 ? `<em>×${A[k]}</em>` : ''}`, info: `<b>${AMULETS[k].name}</b>${A[k] > 1 ? ` ×${A[k]}` : ''}<br>${AMULETS[k].desc}<br><span class="muted">${AMULETS[k].tgt === 'passive' ? 'Se usa solo cuando hace falta.' : AMULETS[k].tgt === 'road' ? 'Tócalo y luego elige un camino en el tablero.' : 'Tócalo y luego toca el letrero de un rival.'}</span>` }));
  showcase('amulets', 'Tus amuletos', tiles, { mount: el => { if (!miniInit()) return; el.querySelectorAll('canvas[data-k]').forEach(cv => { const o = spinner(amuletModel(cv.dataset.k), 1.1); const mv = miniView(cv, { w: 120, h: 120, res: 1, fov: 30, fps: 30, tick: dt => { o.userData.inner.rotation.y += dt*1.2; } }); mv.sc.add(o); mv.cam.position.set(0, .3, 2.4); mv.cam.lookAt(0, 0, 0); SHOW.views.push(mv); }); },
    onPick: i => { const k = list[i]; if (AMULETS[k].tgt === 'passive'){ sysNote(`<b>${AMULETS[k].name}</b>: ${AMULETS[k].desc}`, { ms: 3000 }); return; }
      if (AMULETS[k].tgt === 'road' && mode !== 'board'){ sysNote('Para demoler un camino vuelve al tablero.', { ms: 2600 }); return; }
      showcaseClose(); useAmulet(k); } });
}
