// ================= VILLAGER LIFE (schedules, chats, trade, homes) =================
const BUBBLE_CACHE = new Map();
// a rendered (pixel) picture of a 3D icon, for canvases that cannot hold a live model
const ICON_SNAP = new Map();
function iconSnap(k){
  if (ICON_SNAP.has(k)) return ICON_SNAP.get(k);
  let cv = null;
  if (snapInit()){ const o = spinner(iconModel(k), 1); o.rotation.set(.3, -.5, 0); SNAP.sc.add(o); SNAP.cam.position.set(0, .25, 2.3); SNAP.cam.lookAt(0, 0, 0); SNAP.r.setClearColor(0, 0); SNAP.r.render(SNAP.sc, SNAP.cam); SNAP.sc.remove(o);
    cv = document.createElement('canvas'); cv.width = cv.height = 48; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(SNAP.r.domElement, 0, 0, 96, 96, 0, 0, 48, 48); }
  ICON_SNAP.set(k, cv); return cv;
}
function bubbleMat(txt){
  if (BUBBLE_CACHE.has(txt)) return BUBBLE_CACHE.get(txt);
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 52; const c = cv.getContext('2d');
  c.fillStyle = '#fffaf0'; c.strokeStyle = '#2a2420'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(10, 4); c.lineTo(54, 4); c.quadraticCurveTo(60, 4, 60, 10); c.lineTo(60, 34); c.quadraticCurveTo(60, 40, 54, 40); c.lineTo(36, 40); c.lineTo(30, 49); c.lineTo(27, 40); c.lineTo(10, 40); c.quadraticCurveTo(4, 40, 4, 34); c.lineTo(4, 10); c.quadraticCurveTo(4, 4, 10, 4); c.closePath(); c.fill(); c.stroke();
  const ik = EMO[txt] || (String(txt).startsWith('ic:') ? txt.slice(3) : null), snap = ik ? iconSnap(ik) : null;
  if (snap){ c.imageSmoothingEnabled = false; c.drawImage(snap, 14, 3, 36, 36); }
  else { c.font = '700 22px "Pixelify Sans",monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#2a2420'; c.fillText(String(txt).slice(0, 2), 32, 23); }
  const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false }); BUBBLE_CACHE.set(txt, m); return m;
}
function say3D(p, txt, dur=2.4){
  if (!p.bub){ p.bub = new THREE.Sprite(bubbleMat(txt)); p.bub.scale.set(.62, .5, 1); p.g.add(p.bub); }
  p.bub.material = bubbleMat(txt); p.bub.position.y = 2.15*p.S + (p.kid ? .25 : 0); p.bub.visible = true; p.bubT = dur;
}
const CHAT_ICONS = ['💬','😄','❗','❓','🙂','😂','👋','🎶','🤔'];
const TRADE_ICONS = ['🌾','🪵','🧱','🐑','🔩','🥖','🧀','🍎','🐟'];
const CARRY_COLORS = { '🌾': 0xe3c46a, '🪵': 0x7a5232, '🧱': 0xb0563a, '🐑': 0xf4f1ea, '🔩': 0xc9ced6, '🥖': 0xd9a050, '🧀': 0xf2cc56, '🍎': 0xd9402a, '🐟': 0x8ab0c8 };
const hourNow = () => (DAY.t*24) % 24;
const isNight = () => { const h = hourNow(); return h >= 21.5 || h < 6; };
const isEvening = () => { const h = hourNow(); return h >= 18 && h < 21.5; };
const RES_EMOJI = { '🌾': 'trigo', '🪵': 'madera', '🧱': 'ladrillo', '🐑': 'lana', '🔩': 'mineral' };
function setCarry(p, what){
  if (p.carry){ p.carry.parent && p.carry.parent.remove(p.carry); p.carry = null; }
  if (what === null || what === undefined) return;
  let m;
  if (typeof what === 'string'){ m = makeResourceItem(what); m.scale.setScalar(.36); m.position.set(0, -.42, .14); }
  else m = mesh(GEO.blobs[1], what, 0, -.36, .12, .13, .11, .13);
  p.elbowL.add(m); p.carry = m;
}
// ---- shop signs: little 3D icons for each trade
function shopIcon(kind, color){
  const g = new THREE.Group();
  switch (kind){
    case 'abarrotes': { const it = makeResourceItem('trigo'); it.scale.setScalar(.5); g.add(it); g.add(mesh(GEO.sphere, 0xd9402a, .14, .1, .05, .06, .06, .06)); break; }
    case 'doctor': g.add(mesh(GEO.box, 0x2a8a4a, 0, -.12, 0, .1, .34, .05)); g.add(mesh(GEO.box, 0x2a8a4a, 0, 0, 0, .3, .1, .05)); break;
    case 'cuartel': { const sh = mesh(GEO.cyl14, color, 0, 0, 0, .18, .04, .18); sh.rotation.x = Math.PI/2; g.add(sh); g.add(mesh(GEO.box, 0xc89a40, 0, -.14, .03, .04, .28, .02)); g.add(mesh(GEO.box, 0xc89a40, 0, 0, .03, .28, .04, .02)); break; }
    case 'carniceria': g.add(mesh(GEO.sphere, 0xa84a3a, 0, 0, 0, .13, .16, .11)); g.add(mesh(GEO.cyl, 0xf0e6d2, 0, .12, 0, .025, .12, .025)); break;
    case 'telas': [0x8a2a5a, 0x2a5a8a, 0xc9a040].forEach((c, i) => { const b = mesh(GEO.cyl, c, (i - 1)*.1, -.12, 0, .05, .26, .05); g.add(b); }); break;
    case 'alfareria': { const it = makeSpecialItem('vasija'); it.scale.setScalar(.5); g.add(it); break; }
    case 'carpinteria': { const it = makeResourceItem('madera'); it.scale.setScalar(.45); g.add(it); g.add(mesh(GEO.box, 0x9aa0a8, .05, .12, 0, .26, .06, .015)); break; }
    case 'mariscos': g.add(mesh(GEO.sphere, 0x8ab0c8, 0, 0, 0, .2, .08, .05)); { const t = mesh(GEO.cone4, 0x6a90a8, .24, -.08, 0, .07, .12, .03); t.rotation.z = Math.PI/2; g.add(t); } g.add(mesh(GEO.sphere, 0x111111, -.13, .02, .04, .015, .015, .01)); break;
  }
  return g;
}
const SHOP_DEFS = {
  abarrotes:   { name: 'Abarrotes', role: 'comerciante', wall: 'plaster', icon: '🧺', carry: '🍎' },
  doctor:      { name: 'Doctor', role: 'doctor', wall: 'plaster', icon: '🌿', carry: 0x5a9a3a },
  cuartel:     { name: 'Cuartel', role: 'guardia', wall: 'rock', icon: '🛡️', carry: null },
  carniceria:  { name: 'Carnicería', role: 'carnicero', wall: 'wood', icon: '🍖', carry: 0xa84a3a, biome: 'pradera' },
  telas:       { name: 'Telas', role: 'comerciante', wall: 'plaster', icon: '🧵', carry: 0x8a2a5a, biome: 'pradera' },
  alfareria:   { name: 'Alfarería', role: 'alfarero', wall: 'brick', icon: '🏺', carry: 0xb5653a, biome: 'cerro' },
  carpinteria: { name: 'Carpintería', role: 'carpintero', wall: 'wood', icon: '🪚', carry: '🪵', biome: 'bosque' },
  mariscos:    { name: 'Mariscos', role: 'pescador', wall: 'wood', icon: '🐟', carry: '🐟', biome: 'mar' },
};
// ---- navigation over the village path network
function buildNav(lines, links){
  const nodes = [], adj = [];
  const add = (x, z) => { for (let i=0;i<nodes.length;i++){ if (Math.abs(nodes[i][0] - x) < .6 && Math.abs(nodes[i][1] - z) < .6) return i; } nodes.push([x, z]); adj.push([]); return nodes.length - 1; };
  const link = (a, b) => { if (a === b) return; const w = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]); if (!adj[a].some(e => e.j === b)) { adj[a].push({ j: b, w }); adj[b].push({ j: a, w }); } };
  const ids = lines.map(pts => { const r = pts.map(p => add(p[0], p[1])); for (let i=1;i<r.length;i++) link(r[i-1], r[i]); return r; });
  // connect every line end to the nearest node of another line
  ids.forEach((r, li) => [r[0], r[r.length - 1]].forEach(a => {
    let best = -1, bd = 1e9;
    ids.forEach((q, lj) => { if (lj === li) return; q.forEach(b => { const d = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]); if (d < bd){ bd = d; best = b; } }); });
    if (best >= 0 && bd < 9) link(a, best);
  }));
  for (let a=0;a<nodes.length;a++) for (let b=a+1;b<nodes.length;b++){ const d = Math.hypot(nodes[a][0] - nodes[b][0], nodes[a][1] - nodes[b][1]); if (d < 2.2) link(a, b); }
  return { nodes, adj };
}
function navRoute(V, fx, fz, tx, tz){
  const N = V.nav; if (!N || Math.hypot(tx - fx, tz - fz) < 7) return [];
  const near = (x, z) => { let b = 0, bd = 1e9; N.nodes.forEach((n, i) => { const d = Math.hypot(n[0] - x, n[1] - z); if (d < bd){ bd = d; b = i; } }); return [b, bd]; };
  const [s, ds] = near(fx, fz), [e, de] = near(tx, tz);
  if (ds + de > Math.hypot(tx - fx, tz - fz)*1.1 || s === e) return [];
  const n = N.nodes.length, dist = new Float64Array(n).fill(1e18), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
  dist[s] = 0;
  for (let it=0; it<n; it++){
    let u = -1, bd = 1e18; for (let i=0;i<n;i++) if (!done[i] && dist[i] < bd){ bd = dist[i]; u = i; }
    if (u < 0 || u === e) break; done[u] = 1;
    for (const { j, w } of N.adj[u]) if (dist[u] + w < dist[j]){ dist[j] = dist[u] + w; prev[j] = u; }
  }
  if (prev[e] < 0) return [];
  const path = []; for (let u = e; u >= 0; u = prev[u]) path.push(N.nodes[u]);
  path.reverse();
  if (path.length > 1 && Math.hypot(path[1][0] - fx, path[1][1] - fz) < Math.hypot(path[1][0] - path[0][0], path[1][1] - path[0][1])) path.shift();
  return path.map(q => [q[0] + (Math.random() - .5)*.5, q[1] + (Math.random() - .5)*.5]);
}
function goTo(p, x, z, then, interruptible=false){ const pos = p.g.position; p.st = { kind: 'walk', tx: x, tz: z, then, t: 0, interruptible, wps: p.V ? navRoute(p.V, pos.x, pos.z, x, z) : [], wi: 0 }; p.stuck = 0; }
function idle(p, dur){ p.st = { kind: 'idle', t: dur }; }
function intent(p, icon){ say3D(p, icon, 1.8); }
function available(q){ return q.g.visible && !q.guard && !(q.work && !isEvening()) && !q.vendor && (q.st.kind === 'idle' || (q.st.kind === 'walk' && q.st.interruptible)) && q.chatCD <= 0; }
function goHome(V, p, stay){
  if (!p.home){ goTo(p, 0, 0, () => idle(p, 3)); return; }
  goTo(p, p.home.door[0], p.home.door[1], () => enterHouse(p, p.home, stay));
}
function enterHouse(p, h, stay){ p.st = { kind: 'enter', t: 0, h, stay, fx: p.g.position.x, fz: p.g.position.z }; }
function newMeet(V, x, z, members, topic){
  const m = { x, z, members, t: 0, done: false, kids: !!members[0].kid, topic: topic || pick(['la cosecha', 'el clima', 'los caminos nuevos', 'el mercado', 'los vecinos', 'el ladrón', 'la taberna', 'los animales', 'el precio del trigo']) };
  V.meets.push(m); slotMeet(m); members.forEach(w => walkToSlot(V, w, m)); return m;
}
function startChat(V, p, radius=14){
  for (const m of V.meets){ if (m.members.length < 3 && !m.done && Math.hypot(m.x - p.g.position.x, m.z - p.g.position.z) < radius && (!!p.kid === !!m.kids)){ m.members.push(p); slotMeet(m); walkToSlot(V, p, m); return true; } }
  const cands = V.people.filter(q => q !== p && available(q) && (!!q.kid === !!p.kid) && Math.hypot(q.g.position.x - p.g.position.x, q.g.position.z - p.g.position.z) < radius);
  if (!cands.length) return false;
  cands.sort((a, b) => Math.hypot(a.g.position.x - p.g.position.x, a.g.position.z - p.g.position.z) - Math.hypot(b.g.position.x - p.g.position.x, b.g.position.z - p.g.position.z));
  const q = cands[0];
  const [mx, mz] = V.freeAround((p.g.position.x + q.g.position.x)/2, (p.g.position.z + q.g.position.z)/2, 1.5);
  say3D(q, '👋', 1.4);
  newMeet(V, mx, mz, [p, q]); return true;
}
function slotMeet(m){ const n = m.members.length; m.members.forEach((w, i) => { const a = i/n*Math.PI*2 + .4; w.slot = [m.x + Math.cos(a)*.8, m.z + Math.sin(a)*.8]; }); }
function walkToSlot(V, w, m){ goTo(w, w.slot[0], w.slot[1], () => { w.st = { kind: 'meetWait', meet: m, t: 0 }; }); w.st.meet = m; }
function endMeet(V, m){ m.done = true; m.members.forEach(w => { if (w.st.meet === m){ w.chatCD = 30 + Math.random()*30; idle(w, .8 + Math.random()); w.talking = 0; } }); V.meets = V.meets.filter(q => q !== m); }
function goToSeat(p, seat, dur, icon){ seat.occ = p; goTo(p, seat.front[0], seat.front[1], () => { p.st = { kind: 'sit', seat, t: dur, icon }; p.g.position.set(seat.pos[0], p.g.position.y, seat.pos[1]); p.g.rotation.y = seat.rot; }); }
// ---- errands: every outing has a reason and ends somewhere sensible
const ERRANDS = {
  water(V, p){ intent(p, '💧'); const a = Math.random()*6.28; goTo(p, Math.cos(a)*2.3, Math.sin(a)*2.3, () => { p.st = { kind: 'well', t: 4.5 }; }); return true; },
  market(V, p){ const open = V.stalls.filter(s => s.vendor && s.vendor.st.kind === 'vend'); if (!open.length) return false; const s = pick(open); intent(p, '🛒'); goTo(p, s.front[0] + (Math.random() - .5)*.6, s.front[1] + (Math.random() - .5)*.6, () => { p.st = { kind: 'trade', stall: s, t: 5.5, step: 0 }; }); return true; },
  garden(V, p){ if (!V.gardens.length) return false; const g = V.gardens.slice().sort((a, b) => Math.hypot(a.x - (p.home?.x ?? 0), a.z - (p.home?.z ?? 0)) - Math.hypot(b.x - (p.home?.x ?? 0), b.z - (p.home?.z ?? 0)))[Math.random() < .7 ? 0 : 1] || V.gardens[0]; intent(p, '🌱'); goTo(p, g.ap[0], g.ap[1], () => { p.st = { kind: 'tend', t: 12 + Math.random()*10, look: [g.x, g.z] }; }); return true; },
  visit(V, p){
    const others = V.homes.filter(h => h !== p.home); if (!others.length) return false;
    const occupied = others.filter(h => V.people.some(q => q.home === h && q.st.kind === 'inside'));
    const h = pick(occupied.length ? occupied : others); intent(p, '🚪');
    goTo(p, h.door[0], h.door[1], () => {
      const q = V.people.find(w => w.home === h && w.st.kind === 'inside' && !w.guard);
      if (q){ q.g.visible = true; q.g.position.set(h.door[0], V.vh(h.door[0], h.door[1]), h.door[1]); q.g.rotation.y = h.face; say3D(q, '😄', 1.5);
        const [ox, oz] = toWorld(h.x, h.z, h.face, 0, h.d/2 + 2.2); newMeet(V, ox, oz, [p, q], 'cómo está la familia'); }
      else { say3D(p, '🚪', 1.5); idle(p, 3); p.after = 'plaza'; }
    }); return true; },
  plaza(V, p){ intent(p, '💬'); const [x, z] = V.freeAround(0, 0, V.plazaR + 2); goTo(p, x, z, () => { if (!startChat(V, p, 12)){ const seat = V.seats.find(s => !s.occ && !s.tavern); if (seat) goToSeat(p, seat, 15 + Math.random()*15); else idle(p, 4); } }); return true; },
  bench(V, p){ const seat = V.seats.find(s => !s.occ && !s.tavern); if (!seat) return false; intent(p, '🪑'); goToSeat(p, seat, 20 + Math.random()*25); return true; },
  stroll(V, p){ if (!V.sitesPts.length) return false; const sp = pick(V.sitesPts); intent(p, '🌻'); goTo(p, sp[0], sp[1], () => { p.st = { kind: 'watch', t: 8 + Math.random()*8 }; }); return true; },
  lunch(V, p){ p.lunchDay = Math.floor(V.dayN()); intent(p, '🍲'); goHome(V, p, 20 + Math.random()*20); return true; },
  tavern(V, p){ if (!V.tavern) return false; intent(p, '🍺'); const seat = V.seats.find(s => s.tavern && !s.occ); if (seat){ goToSeat(p, seat, 25 + Math.random()*30, '🍺'); return true; } goTo(p, V.tavern.door[0], V.tavern.door[1], () => enterHouse(p, V.tavern, 25 + Math.random()*30)); return true; },
  home(V, p){ intent(p, '🏠'); goHome(V, p, 20 + Math.random()*30); return true; },
  shop(V, p){
    const h = hourNow(); if (!V.shops || !V.shops.length || h < 7 || h >= 19) return false;
    const open = V.shops.filter(s => s.vendor && s.kind !== 'cuartel' && (p.old || s.kind !== 'doctor' || Math.random() < .3)); if (!open.length) return false;
    const s = pick(open); intent(p, s.icon);
    if (s.vendor.st.kind === 'vend' && Math.random() < .6) goTo(p, s.front[0] + (Math.random() - .5)*.6, s.front[1] + (Math.random() - .5)*.6, () => { p.st = { kind: 'trade', stall: s, t: 5.5, step: 0, shop: s }; });
    else goTo(p, s.door[0], s.door[1], () => { if (s.vendor.st.kind === 'vend'){ say3D(s.vendor, '👋', 1.4); } enterHouse(p, s.h, 5 + Math.random()*7); });
    return true; },
};
function runErrand(V, p, list){ for (const name of list){ if (ERRANDS[name](V, p)) return true; } return false; }
function weighted(opts){ const tot = opts.reduce((a, o) => a + o[1], 0); let r = Math.random()*tot; for (const o of opts){ r -= o[1]; if (r <= 0) return o[0]; } return opts[0][0]; }
function decide(V, p){
  const h = hourNow(), night = isNight(), evening = isEvening(), noon = h >= 12 && h < 13.5;
  if (p.after){ const a = p.after; p.after = null; if (runErrand(V, p, [a])) return; }
  if (p.guard){ p.patrol = (p.patrol + 1) % p.posts.length; const [x, z] = p.posts[p.patrol]; goTo(p, x, z, () => { idle(p, 5 + Math.random()*6); }); return; }
  if (night){ if (p.g.visible) intent(p, '🌙'); goHome(V, p, 999); return; }
  if (noon && p.lunchDay !== Math.floor(V.dayN()) && !p.kid){ ERRANDS.lunch(V, p); return; }
  if (p.work && h >= 6.5 && h < 18.5){ if (Math.hypot(p.g.position.x - p.hx, p.g.position.z - p.hz) > 3) intent(p, '🔨'); goTo(p, p.hx, p.hz, () => { p.st = { kind: 'work', t: 25 + Math.random()*30 }; }); return; }
  if (p.shop && h >= 7 && h < 19 && Math.random() < .45){ goTo(p, p.shop.door[0], p.shop.door[1], () => enterHouse(p, p.shop.h, 10 + Math.random()*18)); return; }
  if (p.vendor && h >= 7 && h < (p.shop ? 19 : 18)){ goTo(p, p.vendor.back[0], p.vendor.back[1], () => { p.st = { kind: 'vend', t: (p.shop ? 14 : 30) + Math.random()*20 }; }); return; }
  if (p.kid){
    if (evening || noon){ const par = V.people.find(q => q !== p && q.home === p.home && !q.kid && q.g.visible && q.st.kind === 'walk'); if (par){ p.st = { kind: 'follow', who: par, t: 25 }; return; } if (evening){ ERRANDS.home(V, p); return; } }
    if (Math.random() < .7){ p.st = { kind: 'play', t: 20 + Math.random()*20 }; return; }
    if (startChat(V, p, 18)) return;
    ERRANDS.plaza(V, p); return;
  }
  let list;
  if (evening) list = [weighted([['tavern', p.old ? 1 : 4], ['plaza', 2], ['home', 3]])];
  else if (h < 12) list = [weighted([['water', 2], ['market', 2], ['shop', 4], ['garden', 2], ['visit', 2], ['bench', p.old ? 3 : .5], ['stroll', 1]])];
  else list = [weighted([['market', 1.5], ['shop', 3.5], ['visit', 3], ['plaza', 3], ['bench', p.old ? 3 : 1], ['garden', 1.5], ['stroll', 1.5]])];
  list.push('plaza', 'home');
  runErrand(V, p, list);
}
function stepToward(V, p, tx, tz, speed, dt){
  const pos = p.g.position, dx = tx - pos.x, dz = tz - pos.z, d = Math.hypot(dx, dz);
  if (d < .3) return true;
  p.spd = Math.min(speed, p.spd + dt*speed*2);
  let want = Math.atan2(dx, dz);
  // step aside for the player instead of bumping into them
  if (mode === 'village'){
    const px = ctl.pos.x - pos.x, pz = ctl.pos.z - pos.z, pd = Math.hypot(px, pz);
    if (pd < 2.4){ const rel = Math.atan2(Math.sin(Math.atan2(px, pz) - want), Math.cos(Math.atan2(px, pz) - want)); if (Math.abs(rel) < 1.1) want -= Math.sign(rel || 1)*(1.25 - Math.abs(rel)*.5); }
    if (pd < 1.2) p.spd = Math.min(p.spd, .35);
  }
  turnTo(p.g, want, Math.min(1, dt*6));
  const facing = Math.cos(want - p.g.rotation.y), st = Math.min(d, p.spd*dt*Math.max(.25, facing)), ox = pos.x, oz = pos.z;
  pos.x += Math.sin(p.g.rotation.y)*st; pos.z += Math.cos(p.g.rotation.y)*st;
  for (const h of V.colliders){ const ex = pos.x - h.x, ez = pos.z - h.z; if (Math.abs(ex) > h.r + .5 || Math.abs(ez) > h.r + .5) continue; const e = Math.hypot(ex, ez), mn = h.r + .32; if (e < mn && e > 1e-4){ pos.x = h.x + ex/e*mn; pos.z = h.z + ez/e*mn; } }
  for (const q of V.people){ if (q === p || !q.g.visible) continue; const ex = pos.x - q.g.position.x, ez = pos.z - q.g.position.z; if (Math.abs(ex) > .7 || Math.abs(ez) > .7) continue; const e = Math.hypot(ex, ez); if (e < .6 && e > 1e-4){ pos.x = q.g.position.x + ex/e*.6; pos.z = q.g.position.z + ez/e*.6; } }
  if (mode === 'village'){ const ex = pos.x - ctl.pos.x, ez = pos.z - ctl.pos.z, e = Math.hypot(ex, ez); if (e < .85 && e > 1e-4){ pos.x = ctl.pos.x + ex/e*.85; pos.z = ctl.pos.z + ez/e*.85; } }
  if (Math.hypot(pos.x - ox, pos.z - oz) < st*.3) p.stuck += dt; else p.stuck = Math.max(0, p.stuck - dt);
  pos.y = V.vh(pos.x, pos.z);
  p.ph += dt*p.spd*(p.kid ? 4.6 : 5.8);
  p.moving = true;
  return false;
}
function faceTo(p, x, z, dt){ turnTo(p.g, Math.atan2(x - p.g.position.x, z - p.g.position.z), Math.min(1, dt*5)); }
function personTick(V, p, dt, t){
  p.moving = false;
  if (p.chatCD > 0) p.chatCD -= dt;
  if (p.bubT > 0){ p.bubT -= dt; if (p.bubT <= 0 && p.bub) p.bub.visible = false; }
  if (p.carryT > 0){ p.carryT -= dt; if (p.carryT <= 0) setCarry(p, null); }
  const st = p.st;
  switch (st.kind){
    case 'idle': st.t -= dt; p.spd = 0; if (isNight() && !p.guard && st.t > .5) st.t = .5; if (st.t <= 0) decide(V, p); break;
    case 'walk': {
      st.t += dt;
      if (isNight() && st.interruptible && !p.guard){ goHome(V, p, 999); break; }
      const wp = st.wi < st.wps.length ? st.wps[st.wi] : null;
      if (wp){ stepToward(V, p, wp[0], wp[1], p.speed, dt); if (Math.hypot(wp[0] - p.g.position.x, wp[1] - p.g.position.z) < .8 || p.stuck > 1.5){ st.wi++; p.stuck = 0; } break; }
      const arrived = stepToward(V, p, st.tx, st.tz, p.speed, dt);
      if (arrived){ p.spd = 0; const th = st.then; idle(p, .8); if (th) th(); }
      else if (p.stuck > 3 || st.t > 90){ p.spd = 0; const th = st.then; if (th && Math.hypot(st.tx - p.g.position.x, st.tz - p.g.position.z) < 1.8) th(); else idle(p, 1 + Math.random()*2); }
      break; }
    case 'follow': {
      st.t -= dt; const w = st.who;
      if (st.t <= 0 || !w.g.visible){ if (!w.g.visible && w.st.kind === 'inside' && w.home === p.home){ enterHouse(p, p.home, w.st.t); break; } idle(p, 1); break; }
      const bx = w.g.position.x - Math.sin(w.g.rotation.y)*1.1 + .5, bz = w.g.position.z - Math.cos(w.g.rotation.y)*1.1;
      if (Math.hypot(bx - p.g.position.x, bz - p.g.position.z) > .8) stepToward(V, p, bx, bz, Math.max(p.speed, w.spd + .3), dt); else { p.spd = 0; faceTo(p, w.g.position.x, w.g.position.z, dt); }
      break; }
    case 'meetWait': {
      const m = st.meet; st.t += dt; p.spd = 0; faceTo(p, m.x, m.z, dt);
      if (m.done){ idle(p, 1); break; }
      if (m.members.every(w => w.st.kind === 'meetWait' || w.st.kind === 'chat')){ m.members.forEach(w => { w.st = { kind: 'chat', meet: m }; }); m.t = 9 + Math.random()*8 + m.members.length*2; m.speaker = 0; m.next = 0; }
      else if (st.t > 20) endMeet(V, m);
      break; }
    case 'chat': {
      const m = st.meet; p.spd = 0;
      faceTo(p, m.x, m.z, dt);
      if (m.members[0] === p){
        m.t -= dt; m.next -= dt; if (isNight() && m.t > 2) m.t = 2;
        if (m.next <= 0){ m.speaker = (m.speaker + 1 + Math.floor(Math.random()*(m.members.length - 1))) % m.members.length; const sp = m.members[m.speaker]; sp.talking = 1.8; say3D(sp, pick(CHAT_ICONS), 1.8); m.next = 2 + Math.random()*.8; }
        if (m.t <= 0) endMeet(V, m);
      }
      if (p.talking > 0) p.talking -= dt;
      break; }
    case 'enter': {
      st.t += dt; const h = st.h, k = Math.min(1, st.t/.8);
      const ix = h.door[0] + (h.x - h.door[0])*.35, iz = h.door[1] + (h.z - h.door[1])*.35;
      p.g.position.x = st.fx + (ix - st.fx)*k; p.g.position.z = st.fz + (iz - st.fz)*k; faceTo(p, h.x, h.z, dt); p.ph += dt*3; p.moving = true; p.spd = .5;
      if (k >= 1){ p.g.visible = false; setCarry(p, null); p.st = { kind: 'inside', h, t: st.stay }; }
      break; }
    case 'inside': {
      st.t -= dt;
      const leave = isNight() ? false : (st.t <= 0 || st.t > 900);
      if (leave && Math.random() < dt*.6){ p.g.visible = true; const [ox, oz] = toWorld(st.h.x, st.h.z, st.h.face, 0, st.h.d/2 + 1.3); p.g.position.set(ox, V.vh(ox, oz), oz); p.g.rotation.y = st.h.face; idle(p, 1.5 + Math.random()*2);
        const sh = st.h.shop; if (sh && p !== sh.vendor){ if (sh.carry != null){ setCarry(p, typeof sh.carry === 'string' ? (RES_EMOJI[sh.carry] || CARRY_COLORS[sh.carry] || 0xd9a050) : sh.carry); p.carryT = 35; } say3D(p, pick(['😊', '👍', sh.icon]), 1.5); p.after = Math.random() < .5 ? 'home' : 'plaza'; } }
      break; }
    case 'sit': st.t -= dt; p.spd = 0; if (st.icon && Math.random() < dt*.12) say3D(p, st.icon); if (!st.icon && Math.random() < dt*.03) say3D(p, pick(['😌','🎶','☀️'])); if (st.t <= 0 || (isNight() && hourNow() > 23)){ st.seat.occ = null; p.g.position.set(st.seat.front[0], p.g.position.y, st.seat.front[1]); idle(p, .5); } break;
    case 'watch': st.t -= dt; p.spd = 0; if (Math.random() < dt*.1) say3D(p, pick(['👀','😮','🙂'])); if (st.t <= 0) idle(p, 1); break;
    case 'trade': {
      const s = st.stall; st.t -= dt; p.spd = 0; faceTo(p, s.back[0], s.back[1], dt);
      const v = s.vendor;
      if (st.step === 0){ st.item = pick(TRADE_ICONS); say3D(p, st.item, 1.8); p.talking = 1.4; st.step = 1; }
      else if (st.step === 1 && st.t < 3.8){ if (v){ say3D(v, '🪙', 1.8); v.talking = 1.4; } st.step = 2; }
      else if (st.step === 2 && st.t < 1.8){ say3D(p, '🤝', 1.4); if (v) say3D(v, '🙂', 1.4); st.step = 3; }
      if (st.step === 0 && st.shop){ st.item = st.shop.carry && typeof st.shop.carry === 'string' ? st.shop.carry : pick(TRADE_ICONS); }
      if (st.t <= 0){ setCarry(p, st.shop && st.shop.carry != null ? (typeof st.shop.carry === 'string' ? (RES_EMOJI[st.shop.carry] || CARRY_COLORS[st.shop.carry] || 0xd9a050) : st.shop.carry) : RES_EMOJI[st.item] || (CARRY_COLORS[st.item] ?? 0xd9a050)); p.carryT = 40; p.chatCD = 10; intent(p, '🏠'); goHome(V, p, 10 + Math.random()*12); }
      if (p.talking > 0) p.talking -= dt;
      break; }
    case 'vend': { st.t -= dt; if (hourNow() >= 18 || isNight() || (hourNow() >= 12 && hourNow() < 12.2 && p.lunchDay !== Math.floor(V.dayN()))) st.t = Math.min(st.t, 0); p.spd = 0; faceTo(p, p.vendor.front[0], p.vendor.front[1], dt); if (Math.random() < dt*.06) say3D(p, pick(['🪙','📣','🙂'])); if (p.talking > 0) p.talking -= dt; if (st.t <= 0) decide(V, p); break; }
    case 'work': st.t -= dt; p.spd = 0; if (isNight() || hourNow() >= 18.5 || (hourNow() >= 12 && hourNow() < 13.5 && p.lunchDay !== Math.floor(V.dayN()))) st.t = Math.min(st.t, 0); if (st.t <= 0){ if (Math.random() < .25 && startChat(V, p, 10)) break; decide(V, p); } break;
    case 'well': st.t -= dt; p.spd = 0; faceTo(p, 0, 0, dt); if (st.t <= 0){ setCarry(p, 0x6a8aa8); p.carryT = 40; intent(p, '🏠'); goHome(V, p, 10 + Math.random()*10); } break;
    case 'tend': st.t -= dt; if (isNight()) st.t = Math.min(st.t, 0); p.spd = 0; faceTo(p, st.look[0], st.look[1], dt); if (st.t <= 0){ setCarry(p, pick([0xe8892a, 0x5fae48, 0xd9402a])); p.carryT = 40; intent(p, '🏠'); goHome(V, p, 10 + Math.random()*10); } break;
    case 'play': {
      st.t -= dt;
      const kids = V.people.filter(q => q.kid && q.st.kind === 'play' && q.g.visible);
      if (st.t <= 0 || isNight()){ if (V.it === p) V.it = null; idle(p, 1); break; }
      if (kids.length < 2){ const c = V.people.find(q => q.kid && q !== p && q.g.visible && q.st.kind === 'idle'); if (c){ c.st = { kind: 'play', t: st.t }; say3D(c, '😄', 1.2); } else { const [x, z] = [Math.cos(t*.4 + p.ph)*(V.plazaR + 2), Math.sin(t*.4 + p.ph)*(V.plazaR + 2)]; stepToward(V, p, x, z, 1.4, dt); } break; }
      if (!V.it || !kids.includes(V.it)) V.it = p;
      if (V.it === p){
        let best = null, bd = 1e9; kids.forEach(q => { if (q === p || q.tagCD > 0) return; const d = Math.hypot(q.g.position.x - p.g.position.x, q.g.position.z - p.g.position.z); if (d < bd){ bd = d; best = q; } });
        if (best){ stepToward(V, p, best.g.position.x, best.g.position.z, 2, dt); if (bd < .75){ V.it = best; p.tagCD = 2.5; say3D(best, '😆', 1.2); say3D(p, '🙌', 1.2); } }
      } else {
        const it = V.it.g.position, pos = p.g.position, dx = pos.x - it.x, dz = pos.z - it.z, d = Math.hypot(dx, dz) || 1;
        let tx = pos.x + dx/d*3, tz = pos.z + dz/d*3; const r = Math.hypot(tx, tz), R = V.plazaR + 6;
        if (r > R){ const a = Math.atan2(tz, tx) + 1.2; tx = Math.cos(a)*R*.85; tz = Math.sin(a)*R*.85; }
        if (d < 6) stepToward(V, p, tx, tz, 1.75, dt); else p.spd = 0;
      }
      if (p.tagCD > 0) p.tagCD -= dt;
      break; }
  }
  p.poseAcc = (p.poseAcc || 0) + dt;
  if (p.poseAcc >= 1/12){ const pdt = p.poseAcc; p.poseAcc = 0; applyPose(p, t, pdt); }
}
function applyPose(p, t, dt){
  const k = Math.min(1, dt*9), st = p.st, kind = st.kind;
  const E = (o, v) => { o.rotation.x += (v - o.rotation.x)*k; };
  const cam = camera.position, pos = p.g.position;
  // head: look at the player if close, at the speaker when chatting, or around
  let hy = Math.sin(t*.37 + p.ph*2)*.35, hp = 0;
  if (kind === 'chat' && st.meet){ const sp = st.meet.members[st.meet.speaker]; if (sp && sp !== p){ const rel = Math.atan2(sp.g.position.x - pos.x, sp.g.position.z - pos.z) - p.g.rotation.y; hy = clamp(Math.atan2(Math.sin(rel), Math.cos(rel)), -1, 1); } }
  const pdx = cam.x - pos.x, pdz = cam.z - pos.z;
  if (Math.hypot(pdx, pdz) < 5 && mode === 'village' && kind !== 'chat'){ const rel = Math.atan2(pdx, pdz) - p.g.rotation.y; hy = clamp(Math.atan2(Math.sin(rel), Math.cos(rel)), -1.1, 1.1); hp = -.12; }
  if (p.talking > 0) hp += Math.sin(t*9)*.08;
  p.head.rotation.y += (hy - p.head.rotation.y)*k; p.head.rotation.x += (hp - p.head.rotation.x)*k;
  p.body.scale.y = p.S*(1 + Math.sin(t*1.6 + p.ph)*.012);
  let bodyY = 0, lean = p.old ? .12 : 0;
  const holds = p.guard || p.tool === 'baston' || p.tool === 'cayado' || p.tool === 'lanza';
  const carryL = !!p.carry;
  if (p.moving){
    const run = p.spd > 1.4, s = Math.sin(p.ph), c = Math.cos(p.ph), amp = (run ? .75 : .5)*Math.min(1, p.spd/Math.max(.3, p.speed) + .15);
    p.legL.rotation.x = -s*amp; p.legR.rotation.x = s*amp;
    p.kneeL.rotation.x = .06 + Math.max(0, c)*amp*1.6; p.kneeR.rotation.x = .06 + Math.max(0, -c)*amp*1.6;
    if (carryL){ p.armL.rotation.x = -.45; p.elbowL.rotation.x = -1.1; } else { p.armL.rotation.x = s*amp*.8; p.elbowL.rotation.x = -.2 - Math.max(0, s)*.35 - (run ? .6 : 0); }
    if (holds){ p.armR.rotation.x = -.25; p.elbowR.rotation.x = -.55; } else { p.armR.rotation.x = -s*amp*.8; p.elbowR.rotation.x = -.2 - Math.max(0, -s)*.35 - (run ? .6 : 0); }
    bodyY = Math.abs(c)*.04*(p.kid ? 2 : 1); p.body.rotation.z = s*.03; lean = (p.old ? .16 : .05) + (run ? .12 : 0);
  } else if (kind === 'sit'){
    E(p.legL, -1.45); E(p.legR, -1.4); E(p.kneeL, 1.5); E(p.kneeR, 1.45);
    E(p.armL, -.45); E(p.armR, -.45); E(p.elbowL, -.75); E(p.elbowR, -.75);
    bodyY = .53 - .92*p.S; lean = -.05; p.body.rotation.z = 0;
  } else if (kind === 'tend'){
    const sw = Math.sin(t*3 + p.ph);
    E(p.legL, -1.1); E(p.legR, -.9); E(p.kneeL, 2.0); E(p.kneeR, 1.8);
    p.armL.rotation.x = -1 + sw*.3; p.armR.rotation.x = -1.1 - sw*.3; E(p.elbowL, -.4); E(p.elbowR, -.4);
    bodyY = -.38*p.S; lean = .55; p.body.rotation.z = 0;
  } else if (kind === 'well'){
    const sw = Math.sin(t*4 + p.ph);
    E(p.legL, 0); E(p.legR, 0); E(p.kneeL, .15); E(p.kneeR, .15);
    p.armL.rotation.x = -1.2 + sw*.5; p.armR.rotation.x = -1.2 - sw*.5; E(p.elbowL, -.6); E(p.elbowR, -.6); lean = .2;
  } else if (kind === 'work' && p.tool){
    const sw = Math.sin(t*4 + p.ph);
    p.armR.rotation.x = -1 + sw*.8; p.elbowR.rotation.x = -.35 - Math.max(0, -sw)*.6;
    p.armL.rotation.x = -.7 + sw*.35; p.elbowL.rotation.x = -.7;
    p.kneeL.rotation.x = p.kneeR.rotation.x = .15 + Math.max(0, sw)*.12; E(p.legL, 0); E(p.legR, 0);
    lean = .1 + Math.max(0, sw)*.14;
    if (p.lastSw !== undefined && p.lastSw > -.85 && sw <= -.85) workSound(p.role, pos.x, pos.z);
    p.lastSw = sw;
  } else {
    E(p.legL, 0); E(p.legR, 0); E(p.kneeL, p.old ? .12 : .03); E(p.kneeR, p.old ? .12 : .03);
    if (p.talking > 0){ const g2 = Math.sin(t*5 + p.ph); p.armR.rotation.x = -.7 + g2*.35; p.elbowR.rotation.x = -.9; p.armL.rotation.x = carryL ? -.45 : -.2 + Math.max(0, -g2)*.4; p.elbowL.rotation.x = carryL ? -1.1 : -.5; }
    else { E(p.armL, carryL ? -.45 : 0); E(p.elbowL, carryL ? -1.1 : -.18); E(p.armR, holds ? -.25 : 0); E(p.elbowR, holds ? -.55 : -.18); }
    p.armL.rotation.z = -.06 - Math.sin(t*1.6 + p.ph)*.02; p.armR.rotation.z = .06 + Math.sin(t*1.6 + p.ph)*.02;
    p.body.rotation.z *= 1 - k;
  }
  p.body.position.y += (bodyY - p.body.position.y)*(p.moving ? 1 : k);
  p.body.rotation.x += (lean - p.body.rotation.x)*k;
}

