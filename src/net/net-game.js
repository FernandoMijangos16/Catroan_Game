// ================= ONLINE MATCH (phase 2) =================
// Every client keeps the whole game in G with ITS OWN seat as player 0 (the rest of the code is written from player 0's view),
// so seats are rotated when the state goes out (local → global) and when it comes in (global → local).
// The client that is acting runs the rules and broadcasts the state: the owner of the current seat, or the host for bots.
// The others apply it, redraw what changed and only answer when a rule needs their own decision (discarding on a 7, a trade).
Object.assign(NG, { on: false, seat: 0, n: 0, ver: 0, applying: false, relaying: false, inLog: false, hold: false, held: null, asks: {}, ck: {}, board: null,
  timer: 0, last: null, lastAt: 0, turnSeen: -1, setupSeen: '', started: false, startReq: false, regLocal: false, dice: null, lost: {}, hostLostAt: 0, waitV: null, joinT: 0 });
NG.tok = (() => { try { let t = sessionStorage.getItem('catroan-tok'); if (!t){ t = Math.random().toString(36).slice(2, 12); sessionStorage.setItem('catroan-tok', t); } return t; } catch { return Math.random().toString(36).slice(2, 12); } })();
// ---------- seats ----------
const gSeat = l => (l + NG.seat) % NG.n, lSeat = g => ((g - NG.seat) % NG.n + NG.n) % NG.n;
const mapP = (v, f) => typeof v === 'number' && v >= 0 ? f(v) : v;
function netOwns(l){ if (!NG.on) return true; const P = G.players[l]; return P && P.bot ? NG.seat === 0 : l === 0; }
function netAuth(){ return !NG.on || !G || (G.phase === 'register' ? NG.seat === 0 : netOwns(G.current)); }
function isRemote(l){ return NG.on && l !== 0 && !!G.players[l] && !G.players[l].bot; }
function humanSeats(){ return G.players.map((_, i) => i).filter(i => !G.players[i].bot && !G.players[i].empty); }
const myPeer = () => (NET.peers.find(p => p.isMe) || {}).peer || null;
const hostPeer = () => (NET.peers.find(p => p.presence && p.presence.host) || {}).peer || null;
const seatPeer = l => (G.players[l] || {}).pid || null;
// ---------- light hygiene for whatever comes from other players ----------
const cleanName = s => String(s == null ? '' : s).replace(/[<>&"'`$\\]/g, '').trim().slice(0, 12);
const okColor = c => /^#[0-9a-f]{6}$/i.test(c || '');
function deepClean(o){ if (typeof o === 'string') return o.replace(/[<>]/g, ''); if (Array.isArray(o)) return o.map(deepClean); if (o && typeof o === 'object'){ const r = {}; for (const k in o) r[k] = deepClean(o[k]); return r; } return o; }
// html written by another client: only plain formatting tags survive, images travel as [[key|class]] and are rebuilt here
function netHtml(h){
  const doc = new DOMParser().parseFromString('<div>' + String(h || '').slice(0, 4000) + '</div>', 'text/html'), root = doc.body.firstChild; if (!root) return '';
  const OK = new Set(['B', 'I', 'U', 'EM', 'SMALL', 'STRONG', 'SPAN', 'BR']);
  const walk = el => [...el.children].forEach(c => { if (!OK.has(c.tagName)){ c.replaceWith(doc.createTextNode(c.textContent)); return; }
    [...c.attributes].forEach(a => { const n = a.name.toLowerCase(); if (n === 'class' || n === 'data-k' || n === 'title') return; if (n === 'style' && !/url|expression|@|\\|javascript/i.test(a.value)) return; c.removeAttribute(a.name); }); walk(c); });
  walk(root);
  return root.innerHTML.replace(/\[\[(\w+)\|([\w -]*)\]\]/g, (m, k, cls) => RES.includes(k) ? resImg(k, cls || 'ri') : SPECIAL[k] ? specImg(k, cls || 'ri') : '');
}
const packHtml = h => String(h || '').replace(/<img class="([\w -]*)" data-k="(\w+)" src="[^"]*" alt="[^"]*">/g, '[[$2|$1]]');
const cleanItems = o => { const r = {}; if (o && typeof o === 'object') for (const k in o){ const n = Math.max(0, Math.min(20, o[k] | 0)); if (n && (RES.includes(k) || SPECIAL[k])) r[k] = n; } return r; };
// ---------- transport: one 'game' topic; anything bigger than a message travels in pieces ----------
function netSend(o){
  if (!NET.room) return; const s = JSON.stringify(o);
  const emit = d => NET.room.emit('game', d).catch(e => { if (e && e.code === 'not_permitted' && !NG.warned){ NG.warned = true; sysNote('No tienes permiso para jugar en esta sala: pide que te compartan el artifact con permiso para participar.', { ms: 6000 }); } });
  if (s.length <= 1400){ emit(o); return; }
  const id = Math.random().toString(36).slice(2, 9), n = Math.ceil(s.length/1200);
  for (let i=0;i<n;i++) emit({ t: 'ck', id, i, n, s: s.slice(i*1200, (i + 1)*1200) });
}
function netGameMsg(m){
  if (!m || m.isMe) return; let d = m.data; if (!d || typeof d !== 'object') return;
  if (d.t === 'ck'){ const n = d.n | 0; if (n < 1 || n > 60) return; const c = NG.ck[d.id] ||= { n, p: [], got: 0, at: Date.now() }; const i = d.i | 0; if (i < 0 || i >= c.n) return; if (c.p[i] == null){ c.p[i] = String(d.s || ''); c.got++; } if (c.got < c.n) return; delete NG.ck[d.id]; try { d = JSON.parse(c.p.join('')); } catch { return; } }
  const from = m.peer;
  try {
    if (d.t === 'seat') return netGotSeat(d, from);
    if (d.t === 'full'){ if (d.tok === NG.tok && !NG.on && MENU.el) MENU.el.querySelector('.jnote').textContent = d.why === 'started' ? 'Esa partida ya empezó.' : 'Esa partida ya está llena.'; return; }
    if (!NG.on || !G) return;
    if (d.t === 'snap') return netApply(d.s, from);
    if (d.t === 'log') return netShowLog(d, from);
    if (d.t === 'hist'){ const A = G.players[lSeat(d.f | 0)]; if (!A) return; NG.relaying = true; try { histPush(netPersp(netHtml(d.h), A.name), okColor(d.c) ? d.c : '#aaa'); } finally { NG.relaying = false; } return; }
    if (d.t === 'dice') return netShowDice(d);
    if (d.t === 'ask'){ if ((d.to | 0) === NG.seat) netAnswer(d, from); return; }
    if (d.t === 'ans'){ const a = NG.asks[d.id]; if (a && (!a.pid || a.pid === from)) a.res(d.d); return; }
    if (d.t === 'op'){ if (netAuth()) netApplyOp(d, from); return; }
    if (d.t === 'reg'){ if (NG.seat === 0) netHostReg(d, from); return; }
    if (d.t === 'regname'){ if (NG.seat === 0) netHostRegName(d, from); return; }
    if (d.t === 'bye'){ if (from === hostPeer() || NG.seat !== 0) netEnded('El anfitrión cerró la partida.'); return; }
  } catch (e) { console.warn('net', e); }
}
// ---------- the state, out ----------
function netSnap(){
  const pl = [];
  G.players.forEach((P, l) => { const o = JSON.parse(JSON.stringify(P)); delete o.tok; if (o.fx) for (const k in o.fx) if (o.fx[k] && typeof o.fx[k].from === 'number') o.fx[k].from = gSeat(o.fx[k].from); pl[gSeat(l)] = o; });
  return { v: ++NG.ver, ph: G.phase, cur: gSeat(G.current), ord: G.order ? G.order.map(gSeat) : null, dice: G.dice, rob: G.robber, deck: G.deck, army: mapP(G.army, gSeat), lon: mapP(G.longest, gSeat),
    mer: G.merchant, bag: G.bag, pt: G.playedTurn, tid: G.turnId, over: !!G.over, win: mapP(G.winner, gSeat), su: !!G.setup, pt2: G.playT || 0, qat: G.qAt || {}, to: G.tradeOpen, tc: G.trades ? { t: G.trades.t, l: G.trades.l.map(([a, b, n]) => [gSeat(a), gSeat(b), n]) } : null, sk: SETUP.k, sq: (SETUP.queue || []).map(gSeat),
    q: (G.quests || []).map(q => ({ ...q, p: gSeat(q.p), txt: packHtml(q.txt) })), gos: G.gossip, nm: G.names, pl,
    b: G.verts.filter(v => v.building).map(v => [v.id, gSeat(v.building.p), v.building.type === 'ciudad' ? 1 : 0, v.name]), r: G.edges.filter(e => e.road !== null).map(e => [e.id, gSeat(e.road)]) };
}
function netDirty(){ if (!NG.on || NG.applying || !G || !netAuth()) return; clearTimeout(NG.timer); NG.timer = setTimeout(() => netFlush(), 160); }
// force: also when the action just handed the turn to someone else (we were the ones acting)
function netFlush(force){ clearTimeout(NG.timer); if (!NG.on || NG.applying || !G || !NET.room) return; if (!force && !netAuth()) return; NG.last = netSnap(); NG.lastAt = Date.now(); NG.resend = 0; netSend({ t: 'snap', s: NG.last }); }
// the last one who spoke repeats itself a few times (2.5 s, 5 s, 10 s later), so a lost message never leaves anyone behind
setInterval(() => { if (NG.on && NG.last && NG.last.v === NG.ver && (NG.resend || 0) < 3 && Date.now() - NG.lastAt > 2500*(1 << (NG.resend || 0))){ NG.resend = (NG.resend || 0) + 1; netSend({ t: 'snap', s: NG.last }); } netWatch(); }, 1000);
// ---------- the state, in ----------
const plateSig = () => G.players.map(P => [P.name, P.color, P.avatar, P.bot ? 1 : 0, P.empty ? 1 : 0].join(':')).join('|');
function netApply(s, from){
  if (!s || typeof s.v !== 'number' || !Array.isArray(s.pl) || s.pl.length !== NG.n || s.v <= NG.ver) return;
  if (from && from !== hostPeer() && !G.players.some(P => P.pid === from)) return;   // only people seated at this table
  if (NG.hold){ if (!NG.held || NG.held.v < s.v) NG.held = s; return; }            // our own decision is open: after it
  const qtx = (s.q || []).map(q => q && q.txt); s = deepClean(s); (s.q || []).forEach((q, i) => { if (q) q.txt = qtx[i]; }); NG.ver = s.v; NG.applying = true;
  const me0 = G.players[0], keep = NG.regLocal ? { name: me0.name, color: me0.color, avatar: me0.avatar } : null;
  const B = { res: { ...me0.res }, setup: G.setup, over: G.over, sig: plateSig(), qs: new Set((G.quests || []).filter(q => q.p === 0).map(q => q.id)), ph: G.phase };
  try {
    s.pl.forEach((o, g) => { const l = lSeat(g), P = G.players[l]; if (!o || !P) return;
      if (o.fx) for (const k in o.fx) if (o.fx[k] && typeof o.fx[k].from === 'number') o.fx[k].from = lSeat(o.fx[k].from);
      o.name = cleanName(o.name) || 'Jugador'; if (!okColor(o.color)) o.color = P.color; o.avatar = avOk(o.avatar || 'campesino');
      Object.keys(P).forEach(k => { if (!(k in o) && k !== 'tok') delete P[k]; }); Object.assign(P, o); });
    if (keep){ Object.assign(G.players[0], keep); regTaken(); }
    Object.assign(G, { phase: s.ph, current: lSeat(s.cur | 0), order: Array.isArray(s.ord) ? s.ord.map(lSeat) : null, dice: s.dice, deck: s.deck || [], army: mapP(s.army, lSeat), longest: mapP(s.lon, lSeat), merchant: s.mer, bag: Array.isArray(s.bag) ? s.bag.filter(v => v >= 11 && v <= 66) : null, playedTurn: s.pt, turnId: s.tid | 0,
      over: !!s.over, winner: mapP(s.win, lSeat), setup: !!s.su, tradeOpen: s.to, gossip: s.gos || [], names: s.nm || [], playT: +s.pt2 || 0,
      qAt: s.qat && typeof s.qat === 'object' ? Object.fromEntries(Object.entries(s.qat).filter(([k, v]) => /^\d+$/.test(k) && typeof v === 'number')) : {},
      trades: s.tc && Array.isArray(s.tc.l) ? { t: s.tc.t | 0, l: s.tc.l.filter(x => Array.isArray(x)).map(([a, b, n]) => { const x = lSeat(a | 0), y = lSeat(b | 0); return [Math.min(x, y), Math.max(x, y), n | 0]; }) } : null });
    SETUP.k = s.sk | 0; SETUP.queue = (s.sq || []).map(lSeat);
    G.quests = (s.q || []).map(q => ({ ...q, p: lSeat(q.p | 0), txt: netHtml(q.txt) }));
    // board pieces: draw what is new, take away what is gone
    const nb = new Map((s.b || []).map(([vid, g, c, name]) => [vid, { p: lSeat(g), type: c ? 'ciudad' : 'pueblo', name }])), changed = new Set(), fresh = G.verts.filter(v => v.building).length === 0 && nb.size > 2;
    G.verts.forEach(v => { const b = nb.get(v.id);
      if (!b){ if (v.building){ changed.add(v.building.p); v.building = null; if (v.mesh){ boardScene.remove(v.mesh); v.mesh = null; } } return; }
      if (b.name) v.name = b.name;
      if (!v.building || v.building.p !== b.p || v.building.type !== b.type){ v.building = { p: b.p, type: b.type }; changed.add(b.p); if (boardScene){ drawBuilding(v.id, fresh); if (b.p !== 0 && mode === 'board' && !fresh) focusBoard?.(v.x, v.z, G.players[b.p].color); } } });
    const nr = new Map(s.r || []);
    G.edges.forEach(e => { const g = nr.get(e.id), p = g === undefined ? null : lSeat(g); if (p === e.road) return;
      if (e.mesh){ boardScene.remove(e.mesh); e.mesh = null; } if (e.road !== null) changed.add(e.road); e.road = p; if (p !== null){ changed.add(p); if (boardScene) drawRoad(e.id); } });
    changed.forEach(p => updateClusters(p));
    if (G.robber !== s.rob && G.tiles[s.rob]){ G.robber = s.rob; if (boardScene){ if (!G.setup && mode === 'board') SFX.robber?.(); placeRobberMesh(); } }
    if (Array.isArray(G.dice)) document.querySelectorAll('.die').forEach((el, i) => el.textContent = G.dice[i] || '–');
    if (plateSig() !== B.sig){ PLATES.forEach(p => p.build()); updatePlates(true); }
    // what this state means for me
    if (NG.dice && !NG.dice.done && G.turnId === NG.dice.tid && G.phase !== 'rolling'){ NG.dice.done = true; netShowProduction(B.res); }
    (G.quests || []).forEach(q => { if (q.p === 0 && q.state === 'new' && !B.qs.has(q.id)){ const v = G.verts[q.vid]; notify(q.kind === 'brujo' ? `🔮 El brujo de las afueras de <b>${v.name}</b> te anda buscando <b>(!)</b>` : `📜 Colgaron un folleto en el cartel del pozo de <b>${v.name}</b> <b>(!)</b>`, G.players[0].color, 'sys'); drawQuestMarks(); } });
    if (G.setup && /setup/.test(G.phase) && G.current !== 0){ const P = G.players[G.current]; setupTip(`<i style="--c:${P.color}"></i><b>${P.name}</b> está colocando su ${SETUP.k < G.players.length ? 'primer' : 'segundo'} pueblo…`); }
    if (B.setup && !G.setup && G.order && /setup/.test(B.ph)){ setupTip(''); clearSetupMarkers(); setupPreview(null); if (G.players[0].startPick) startPick(() => regSummary(() => {})); else regSummary(() => {}); }
    if (!B.over && G.over && typeof G.winner === 'number') setTimeout(() => showWin(G.winner), 400);
    refresh();
  } finally { NG.applying = false; }
  netWaitRender();
  netKick();
}
// whoever now owns the current seat carries on: placing during the setup, or starting the turn (the host plays the bots)
function netKick(){
  if (!NG.on || !G || G.over || G.phase === 'register') return;
  if (G.setup){ if (G.phase === 'setup' && netOwns(G.current)){ const key = SETUP.k + ':' + G.current; if (NG.setupSeen !== key){ NG.setupSeen = key; setTimeout(() => { if (G.setup && G.phase === 'setup' && netOwns(G.current)) nextSetup(); }, 350); } } return; }
  if (G.phase === 'roll' && NG.turnSeen !== G.turnId && netOwns(G.current)) netTurnStart();
}
function netTurnStart(){
  NG.turnSeen = G.turnId; const P = G.players[G.current];
  if (P.bot){ if (NG.seat === 0) botTurn(G.current); return; }
  if (G.current === 0){ notify('🔔 <b>Es tu turno</b>' + (mode !== 'board' ? ' · vuelve al tablero para jugar' : ''), P.color, 'sys'); SFX.turn?.(); }
}
// ---------- what the others did, told from my side of the table ----------
function netPersp(h, A){
  const me = G.players[0].name, esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), R = [
    [/Tenías más de 7 cartas: descartaste/g, `${A} tenía más de 7 cartas y descartó`], [/\bSacaste\b/g, `${A} sacó`], [/\bMoviste\b/g, `${A} movió`], [/\bLe robaste\b/g, `${A} le robó`], [/\ble robaste\b/g, 'le robó'],
    [/\bJugaste\b/g, `${A} jugó`], [/\bCompraste\b/g, `${A} compró`], [/\bFundaste\b/g, `${A} fundó`], [/\bConstruiste\b/g, `${A} construyó`], [/\bColocaste tu\b/g, `${A} colocó su`], [/\bCambiaste\b/g, `${A} cambió`], [/en tu puerto/g, 'en su puerto'],
    [/\bLanzaste\b/g, `${A} lanzó`], [/Demoliste uno de tus caminos y recuperaste/g, `${A} demolió uno de sus caminos y recuperó`], [/\bDemoliste\b/g, `${A} demolió`], [/\brecuperaste\b/g, 'se quedó con'],
    [/\bEntregaste\b/g, `${A} entregó`], [/\brecibiste\b/g, 'recibió'], [/\bRecibiste\b/g, `${A} recibió`], [/\bEncontraste\b/g, `${A} encontró`], [/\bTienes el\b/g, `${A} tiene el`], [/\bTienes la\b/g, `${A} tiene la`],
    [/Propusiste un trueque: das/g, `${A} propuso un trueque: da`], [/Rechazaste el trueque de/g, `${A} rechazó el trueque de`], [/Nadie aceptó tu trueque/g, `Nadie aceptó el trueque de ${A}`],
    [/aceptó tu trueque/g, `aceptó el trueque de ${A}`], [/rechazó tu carta de trueque/g, `rechazó la carta de trueque de ${A}`], [/rechazó tu trueque/g, `rechazó el trueque de ${A}`],
    [/hizo un trueque contigo: te dio/g, `hizo un trueque con ${A}: le dio`], [/\bte cambió\b/g, `le cambió a ${A}`], [/Trueque con ([^:]+): diste (.+?) y recibiste/g, `${A} hizo un trueque con $1: dio $2 y recibió`],
    [/\bte robó\b/g, `le robó a ${A}`], [/ · recibes /g, ` · ${A} recibe `], [/ · esta vez no produjiste nada/g, ''],
    [/\bsobre ti\b/g, `sobre ${A}`], [/\bde ti\b/g, `de ${A}`], [/\ba ti\b/g, `a ${A}`], [/hizo que cosecharas/g, `hizo que ${A} cosechara`], [/Tus tierras se recuperaron/g, `Las tierras de ${A} se recuperaron`],
    [/se te echó a perder/g, `a ${A} se le echó a perder`], [/tu construcción falló/g, `la construcción de ${A} falló`], [/¡Ganaste la partida!/g, `${A} ganó la partida`]];
  R.forEach(([re, to]) => { h = h.replace(re, (...m) => to.replace(/\$(\d)/g, (x, i) => m[+i] || '')); });
  // and when I am the one it happened to
  if (me) h = h.replace(new RegExp(`le robó (una carta|1 .+?) a ${esc(me)}\\b`, 'g'), '<b>te robó $1</b>').replace(new RegExp(`sobre ${esc(me)}\\b`, 'g'), 'sobre ti').replace(new RegExp(`(con|a) ${esc(me)}\\b`, 'g'), (m, w) => w === 'con' ? 'contigo' : 'a ti');
  return h;
}
function netShowLog(d, from){
  const A = G.players[lSeat(d.f | 0)]; if (!A) return;
  NG.relaying = true; try { notify(netPersp(netHtml(d.h), A.name), okColor(d.c) ? d.c : '#aaa'); } finally { NG.relaying = false; }
}
// the roller's dice also tumble on everyone else's board; then each one sees the beams of what it got
function netShowDice(d){
  const a = Math.max(1, Math.min(6, d.d && d.d[0] | 0)), b = Math.max(1, Math.min(6, d.d && d.d[1] | 0));
  NG.dice = { tid: d.tid | 0, s: a + b, done: false, rob: G.robber, verts: G.verts.map(v => v.building ? { p: v.building.p, c: v.building.type === 'ciudad' } : null) };
  if (mode === 'board' && boardScene) throwDice(a, b, () => {});
}
function netShowProduction(before){
  const D = NG.dice, me = G.players[0], gains = {}; RES.forEach(r => { const x = me.res[r] - (before[r] || 0); if (x > 0) gains[r] = x; });
  if (D.s !== 7 && mode === 'board' && boardScene){
    const left = { ...gains }, shows = [];
    G.tiles.forEach(t => { if (t.num !== D.s || t.i === D.rob) return; const r = TERRAIN[t.type].res, to = [];
      t.verts.forEach(vid => { const b = D.verts[vid]; if (!b) return; const n = b.c ? 2 : 1, own = b.p === 0 ? Math.min(n, left[r] || 0) : 0; if (own) left[r] -= own; to.push({ x: G.verts[vid].x, z: G.verts[vid].z, p: b.p, n, tok: own && INV.el ? invExpect(r, own) : null }); });
      if (to.length) shows.push({ tile: t, res: r, to }); });
    if (shows.length) revealProduction(shows);
  }
  if (Object.keys(gains).length && D.s !== 7) notify(`Recibes ${resStr(gains)}`, me.color, 'sys');
}
// ---------- decisions only that player can make ----------
function netAsk(l, k, d, fallback, ms = 75000){
  if (!isRemote(l)) return Promise.resolve(fallback());
  const id = Math.random().toString(36).slice(2, 9), P = G.players[l];
  if (k !== 'discard') setupTip(`<i style="--c:${P.color}"></i>Esperando la respuesta de <b>${P.name}</b>…`);
  return new Promise(res => {
    const done = v => { if (!NG.asks[id]) return; delete NG.asks[id]; clearTimeout(t); if (k !== 'discard') setupTip(''); res(v); };
    const t = setTimeout(() => done(fallback()), ms);
    NG.asks[id] = { seat: l, pid: P.pid, res: done, fb: () => done(fallback()) };
    netSend({ t: 'ask', id, to: gSeat(l), k, d, f: NG.seat });
  });
}
async function netAnswer(d, from){
  const fl = lSeat(d.f | 0); if (from !== hostPeer() && from !== seatPeer(fl)) return;
  NG.hold = true; let ans = null; const me = G.players[0];
  try {
    if (d.k === 'discard'){ const n = Math.max(0, Math.min(total(me), (d.d && d.d.n) | 0)), before = { ...me.res };
      if (n){ if (mode === 'board') await thiefScene(n); else await simpleDiscard(n); }
      ans = {}; RES.forEach(r => { const x = before[r] - me.res[r]; if (x > 0) ans[r] = x; }); }
    else if (d.k === 'offer'){ const give = cleanItems(d.d && d.d.give), want = cleanItems(d.d && d.d.want);
      let ok = await askHuman(fl, give, want); if (ok && Object.entries(want).some(([k, n]) => haveOf(0, k) < n)){ ok = false; sysNote('No tenías lo que te pedían.', { ms: 2500 }); } ans = !!ok; }
  } finally { NG.hold = false; }
  netSend({ t: 'ans', id: d.id, d: ans });
  if (NG.held){ const s = NG.held; NG.held = null; netApply(s); }
}
// a remote player's discard, checked before it is applied (anything odd: the thief picks at random)
function netTakeDiscard(P, n, lost){
  lost = cleanItems(lost); const sum = Object.values(lost).reduce((a, b) => a + b, 0);
  if (sum !== n || RES.some(r => (lost[r] || 0) > P.res[r]) || Object.keys(lost).some(k => !RES.includes(k))){ lost = {}; for (let k=0;k<n;k++){ const r = randomCard(P); P.res[r]--; lost[r] = (lost[r] || 0) + 1; } return lost; }
  RES.forEach(r => P.res[r] -= lost[r] || 0); return lost;
}
// small changes a player makes outside its turn (accepting a mission): the one acting applies them
function netOp(k, d){ if (!NG.on) return; if (netAuth()) refresh(); else netSend({ t: 'op', k, d, f: NG.seat }); }   // the caller already changed it here
function netApplyOp(o, from){
  const l = lSeat(o.f | 0); if (from && from !== seatPeer(l)) return;
  if (o.k === 'start'){ const P = G.players[l], got = cleanItems(o.d && o.d.res), A = startAllowance(l); if (P && P.startPick && P.startPick === A.n && Object.keys(got).every(k => A.types.includes(k)) && Object.values(got).reduce((a, b) => a + b, 0) === A.n){ giveStart(l, got); refresh(); } return; }
  if (o.k === 'gift'){ const P = G.players[l], k = String(o.d && o.d.k || ''), now = Date.now(); NG.giftAt ||= {};   // a flower from your own townsfolk, at most one every 30 s
    if (P && SPECIAL[k] && SPECIAL[k].kind === 'flor' && now - (NG.giftAt[l] || 0) > 30000){ NG.giftAt[l] = now; P.special = P.special || {}; P.special[k] = (P.special[k] || 0) + 1; refresh(); } return; }
  if (o.k === 'qacc'){ const q = (G.quests || []).find(x => x.id === (o.d && o.d.id) && x.p === l); if (q && q.state === 'new'){ q.state = 'accepted'; refresh(); } }
}
// ---------- the host: seats, joins, leaves ----------
function netHostStart(n, fill = true){
  Object.assign(NG, { on: true, seat: 0, n, fill, ver: 0, started: false, startReq: false, last: null, turnSeen: -1, setupSeen: '', asks: {}, lost: {} });
  GAME_OPTS.online = true; closeMainMenu(); applyGameOpts(); newGame(n);
  G.players.forEach((P, i) => { if (i) Object.assign(P, { name: 'Libre', color: '#5a5650', bot: true, empty: true }); });
  Object.assign(G.players[0], { tok: NG.tok, pid: myPeer(), bot: false });
  NG.board = { types: G.tiles.map(t => t.type), nums: G.tiles.map(t => t.num), ports: G.ports.map(p => [p.type, p.a, p.b]), seed: G.seed };
  PLATES.forEach(p => p.build()); updatePlates(true);
  NG.regLocal = true; startRegistration(); netWaitRender(); netFlush(true);
  chatSystem(`Partida abierta: ${NET.key}. Comparte la clave.`);
}
function netHostPeers(){
  if (!NG.on || NG.seat !== 0 || !G) return;
  if (!G.players[0].pid) G.players[0].pid = myPeer();
  NET.peers.filter(p => !p.isMe).forEach(p => {
    const pr = p.presence || {}, tok = typeof pr.tok === 'string' ? pr.tok.slice(0, 16) : ''; if (!tok || !pr.want) return;
    let l = G.players.findIndex(P => P.tok === tok);
    if (l > 0){ const P = G.players[l]; delete NG.lost[l];
      if (P.pid !== p.peer || P.away){ P.pid = p.peer;
        if (P.away){ P.away = false; if (G.current === l && !G.setup && G.phase !== 'register') P.rejoin = true; else P.bot = false; notify(`${P.name} volvió a la partida`, P.color); chatSystem(`${P.name} volvió.`); }
        netSendSeat(l, tok, true); netFlush(true); netWaitRender(); }
      return; }
    if (NG.started || G.phase !== 'register'){ netSend({ t: 'full', tok, why: 'started' }); return; }
    l = G.players.findIndex(P => P.empty); if (l < 0){ netSend({ t: 'full', tok, why: 'full' }); return; }
    Object.assign(G.players[l], { empty: false, bot: false, tok, pid: p.peer, name: cleanName(pr.name) || 'Jugador', color: freeColor(l), joining: true, roll: 0, avatar: 'campesino' });
    chatSystem(`${G.players[l].name} entró a la partida.`); SFX.click?.();
    netSendSeat(l, tok, false); PLATES.forEach(x => x.build()); updatePlates(true); netFlush(true); netWaitRender();
  });
  G.players.forEach((P, l) => { if (l === 0 || P.bot || P.empty || !P.pid) return; if (NET.peers.some(p => p.peer === P.pid)) { delete NG.lost[l]; return; } NG.lost[l] ||= Date.now(); });
}
const freeColor = (l, want) => { const used = G.players.filter((P, i) => i !== l && !P.empty).map(P => P.color); return want && !used.includes(want) ? want : COLOR_CHOICES.find(c => !used.includes(c)) || '#888888'; };
function netSendSeat(l, tok, rejoin){ netSend({ t: 'seat', tok, seat: l, n: NG.n, board: NG.board, opts: { mode: GAME_OPTS.mode, fp: GAME_OPTS.firstPerson, fill: NG.fill !== false }, match: NET.match, rejoin: !!rejoin, started: NG.started }); }
function netSeatLost(l){
  delete NG.lost[l]; const P = G.players[l]; if (!P || P.bot || P.empty) return;
  if (!NG.started && G.phase === 'register'){ chatSystem(`${P.name} salió.`); Object.assign(P, { name: 'Libre', color: '#5a5650', bot: true, empty: true, tok: null, pid: null, roll: 0, joining: false }); PLATES.forEach(x => x.build()); updatePlates(true); netFlush(true); netWaitRender(); return; }
  P.bot = true; P.away = true; notify(`${P.name} se desconectó: un bot juega por ${P.name} hasta que vuelva`, P.color); chatSystem(`${P.name} se desconectó.`);
  Object.values(NG.asks).filter(a => a.seat === l).forEach(a => a.fb());
  netFlush(true); if (G.current === l) netBotResume(l);
}
// a bot picks up a seat right where its player left it
function netBotResume(l){
  if (G.over) return;
  if (G.setup){
    if (G.phase === 'setupE'){ const v = G.verts.find(v => v.building && v.building.p === l && !v.edges.some(id => G.edges[id].road === l));
      if (v){ const e = v.edges.map(id => G.edges[id]).filter(e => e.road === null)[0]; if (e) buildRoad(l, e.id, true); if (SETUP.k >= G.players.length) G.players[l].v2 = v.id; } SETUP.k++; }
    G.phase = 'setup'; NG.setupSeen = ''; nextSetup(); return; }
  if (G.phase === 'roll'){ NG.turnSeen = G.turnId; botTurn(l); return; }
  if (G.phase === 'robber'){ botRobber(l); }
  G.phase = 'main'; refresh(); botTurn(l, true);
}
function netWatch(){
  if (!NG.on || !G) return;
  if (NG.seat === 0) Object.entries(NG.lost).forEach(([l, t]) => { if (Date.now() - t > 5000) netSeatLost(+l); });
  else if (NET.room){ if (hostPeer()) NG.hostLostAt = 0; else if (!NG.hostLostAt) NG.hostLostAt = Date.now(); else if (Date.now() - NG.hostLostAt > 9000){ NG.hostLostAt = 0; netEnded('Se perdió la conexión con el anfitrión.'); } }
  for (const id in NG.ck) if (Date.now() - NG.ck[id].at > 20000) delete NG.ck[id];
}
function netHostReg(d, from){
  const l = d.seat | 0, P = G.players[l]; if (!P || l === 0 || P.empty || P.pid !== from || NG.started) return;
  P.name = cleanName(d.name) || 'Jugador'; P.avatar = avOk(String(d.avatar || 'campesino')); P.color = freeColor(l, okColor(d.color) ? d.color : null);
  P.roll = Math.max(2, Math.min(12, d.roll | 0)); P.joining = false;
  chatSystem(`${P.name} sacó ${P.roll} en los dados.`); SFX.click?.();
  PLATES.forEach(x => x.build()); updatePlates(true); netFlush(true); netWaitRender(); netCheckStart();
}
// the name, color and avatar go out as soon as the sign is saved, so the others see them before the dice
function netRegName(){
  const me = G.players[0]; me.joining = false; NET.me.name = me.name; NET.me.color = me.color; netPresence();
  if (NG.seat === 0){ netFlush(true); netWaitRender(); }
  else netSend({ t: 'regname', seat: NG.seat, name: me.name, color: me.color, avatar: me.avatar });
}
function netHostRegName(d, from){
  const l = d.seat | 0, P = G.players[l]; if (!P || l === 0 || P.empty || P.pid !== from || NG.started) return;
  P.name = cleanName(d.name) || 'Jugador'; P.avatar = avOk(String(d.avatar || 'campesino')); P.color = freeColor(l, okColor(d.color) ? d.color : null); P.joining = false;
  PLATES.forEach(x => x.build()); updatePlates(true); netFlush(true); netWaitRender();
}
function netRegDone(roll){
  NG.regLocal = false; const me = G.players[0]; me.roll = roll; me.joining = false;
  try { localStorage.setItem('hexterra-name', me.name); } catch {}
  NET.me.name = me.name; NET.me.color = me.color; netPresence();
  if (NG.seat === 0){ PLATES.forEach(x => x.build()); updatePlates(true); netFlush(true); netCheckStart(); }
  else netSend({ t: 'reg', seat: NG.seat, name: me.name, color: me.color, avatar: me.avatar, roll });
  netWaitRender();
}
function netCheckStart(){
  if (NG.started || NG.seat !== 0 || !(G.players[0].roll > 0)) return;
  const full = G.players.every(P => !P.empty && P.roll > 0), early = NG.fill !== false && NG.startReq && G.players.every(P => P.empty || P.roll > 0);
  if (full || early) netBegin();
}
// everybody rolled (or the host pressed Comenzar): bots fill the empty seats, the order is set and the setup starts
function netBegin(){
  NG.started = true; NG.startReq = false;
  const names = shuffle(BOT_POOL.filter(n => !G.players.some(P => P.name === n)));
  G.players.forEach((P, i) => { if (!P.empty) return; Object.assign(P, { empty: false, bot: true, name: names.shift() || 'Bot ' + i, color: freeColor(i), avatar: pick(AVATARS).id, roll: 2 + Math.floor(Math.random()*6) + Math.floor(Math.random()*6) }); });
  const seats = G.players.map((P, i) => ({ i, r: P.roll, t: 0 })), ties = [];
  const byVal = {}; seats.forEach(s => (byVal[s.r] ||= []).push(s));
  Object.entries(byVal).forEach(([v, grp]) => { if (grp.length < 2) return; let ok = false; while (!ok){ grp.forEach(s => s.t = 1 + Math.floor(Math.random()*6)); ok = new Set(grp.map(s => s.t)).size === grp.length; } ties.push(`Empate con ${v} entre ${grp.map(s => G.players[s.i].name).join(' y ')}: desempataron con otra tirada (${grp.map(s => s.t).join(' contra ')})`); });
  G.order = seats.sort((a, b) => b.r - a.r || b.t - a.t).map(s => s.i);
  ties.forEach(t => notify(t, '#c8a040'));
  notify(`Orden de turnos: ${G.order.map((i, k) => `${k + 1}° ${G.players[i].name}`).join(', ')}`, G.players[G.order[0]].color);
  chatSystem('¡Comienza la partida!');
  PLATES.forEach(x => x.build()); updatePlates(true);
  startSetup(); netWaitRender();
}
// ---------- joining ----------
function netGotSeat(d, from){
  if (d.tok !== NG.tok || (NG.on && !d.rejoin)) return;
  if (hostPeer() && from !== hostPeer()) return;
  const n = d.n | 0, b = d.board; if (n < 2 || n > 6 || !b || !Array.isArray(b.types) || b.types.some(t => !TERRAIN[t])) return;
  clearTimeout(NG.joinT);
  if (NG.on && d.rejoin){ NG.ver = 0; return; }   // already at the table: the next state brings everything back
  Object.assign(NG, { on: true, seat: d.seat | 0, n, fill: !(d.opts && d.opts.fill === false), ver: 0, board: b, started: !!d.started, last: null, turnSeen: -1, setupSeen: '', asks: {}, hostLostAt: 0 });
  GAME_OPTS.mode = d.opts && d.opts.mode === 'clasico' ? 'clasico' : 'catroan'; GAME_OPTS.firstPerson = !(d.opts && d.opts.fp === false); GAME_OPTS.online = true;
  NET.match = cleanName(d.match) || NET.match;
  closeMainMenu(); applyGameOpts(); newGame(n, { types: b.types, nums: b.nums, ports: b.ports, seed: Number.isFinite(b.seed) ? b.seed >>> 0 : null });
  G.players.forEach((P, i) => { if (i) Object.assign(P, { name: '…', color: '#5a5650', bot: true, empty: true }); });
  if (!d.rejoin){ NG.regLocal = true; startRegistration(); }
  else { NG.turnSeen = -1; chatSystem('Volviste a la partida.'); }
  netWaitRender();
}
function netEnded(msg){
  if (!NG.on) return; NG.on = false;
  openModal(`<h3>${msg}</h3><p class="muted">La partida en línea terminó para ti.</p><div class="row end"><button class="primary" data-k="menu">Volver al menú</button></div>`, false);
  modalBody.onclick = async e => { if (!e.target.closest('button')) return; closeModal(); await netLeave(); netReset(); newGame(); openMainMenu(); };
}
function netReset(){ Object.assign(NG, { on: false, seat: 0, n: 0, fill: true, ver: 0, started: false, startReq: false, last: null, regLocal: false, held: null, hold: false, asks: {}, lost: {} }); GAME_OPTS.online = false; netWaitRender(); chatEnsure().classList.remove('pinned'); }
addEventListener('pagehide', () => { if (NG.on && NG.seat === 0) netSend({ t: 'bye' }); if (NET.room) try { NET.room.leave(); } catch {} });
// while I fill in my sign, colors the others already took get greyed out (and mine moves if someone got there first)
function regTaken(){
  const me = G.players[0], used = G.players.filter((P, i) => i && !P.empty).map(P => P.color);
  if (used.includes(me.color)){ me.color = freeColor(0); regSign(me, { blank: true }); }
  document.querySelectorAll('#reg .rcol').forEach(b => { const t = used.includes(b.dataset.c); b.disabled = t; b.classList.toggle('taken', t); b.classList.toggle('on', b.dataset.c === me.color); });
}
// ---------- the waiting panel over the board ----------
function netWaitRender(){
  let el = $('#netwait');
  const show = NG.on && G && G.phase === 'register' && !NG.regLocal;
  if (!show){ if (el) el.classList.remove('show'); if (NG.waitV){ NG.waitV.alive = false; NG.waitV = null; } chatEnsure().classList.remove('pinned'); document.body.classList.remove('netwaiting'); return; }
  if (!el){ el = document.createElement('div'); el.id = 'netwait'; document.body.appendChild(el);
    el.innerHTML = `<div class="nwbox"><b class="nwm"></b><div class="nwh"><span>Clave</span><span class="nwk"></span><button class="nwc">Copiar clave</button></div><ul class="nwl"></ul><p class="nwmsg"></p></div><div class="nwgo"><canvas></canvas><b>Comenzar</b><small>Los lugares libres los ocupan bots</small></div>`;
    el.querySelector('.nwc').onclick = () => { MENU.key = NET.key; copyKey(); };
    el.querySelector('.nwgo').onclick = () => { if (!el.querySelector('.nwgo').classList.contains('on')) return; SFX.click?.(); NG.startReq = true; netWaitRender(); netCheckStart(); }; }
  el.classList.add('show'); document.body.classList.add('netwaiting'); const ch = chatEnsure(); if (!ch.classList.contains('pinned')){ ch.classList.add('pinned'); chatFade(); }
  el.querySelector('.nwm').textContent = NET.match || 'Partida'; el.querySelector('.nwk').textContent = NET.key;
  const ul = el.querySelector('.nwl'); ul.innerHTML = '';
  G.players.forEach((P, i) => { const li = document.createElement('li'), dot = document.createElement('i'), nm = document.createElement('span'), st = document.createElement('em');
    dot.style.background = P.empty ? 'transparent' : P.color; li.classList.toggle('empty', !!P.empty);
    const g = gSeat(i); nm.textContent = P.empty ? (NG.seat === 0 && NG.startReq ? 'Bot' : 'Lugar libre') : P.name + (i === 0 ? ' (tú)' : '');
    st.textContent = P.empty ? 'esperando…' : P.joining ? 'registrándose…' : !(P.roll > 0) ? 'tirando los dados…' : `🎲 ${P.roll}`; if (g === 0){ const h = document.createElement('small'); h.textContent = 'anfitrión'; nm.appendChild(h); }
    li.append(dot, nm, st); ul.appendChild(li); });
  const waiting = G.players.filter(P => !P.empty && !(P.roll > 0)).map(P => P.name), free = G.players.filter(P => P.empty).length;
  el.querySelector('.nwmsg').textContent = NG.startReq ? (waiting.length ? `Comenzando en cuanto ${waiting.join(' y ')} ${waiting.length > 1 ? 'tiren' : 'tire'} los dados…` : 'Comenzando…')
    : free ? `Esperando ${free} jugador${free > 1 ? 'es' : ''} más · comparte la clave` : waiting.length ? `Esperando a que ${waiting.join(' y ')} ${waiting.length > 1 ? 'tiren' : 'tire'} los dados…` : 'Todos listos';
  if (NG.seat !== 0 && NG.fill !== false) el.querySelector('.nwmsg').textContent += ' · el anfitrión puede comenzar antes';
  if (NG.fill === false && free) el.querySelector('.nwmsg').textContent += ' · sin bots: empieza cuando estén todos';
  const go = el.querySelector('.nwgo'); go.style.display = NG.seat === 0 && NG.fill !== false ? '' : 'none'; go.classList.toggle('on', NG.seat === 0 && G.players[0].roll > 0 && !NG.startReq);
  if (NG.seat === 0 && !NG.waitV && miniInit()){
    const g = new THREE.Group(), plate = new THREE.Mesh(sg(new THREE.CylinderGeometry(1, 1.03, .26, 6)), icm(0xa8823a, { m: .55, r: .45 })); plate.rotation.y = Math.PI/6; g.add(plate);
    const felt = new THREE.Mesh(sg(new THREE.CylinderGeometry(.86, .86, .03, 6)), icm(0x4f5e34)); felt.rotation.y = Math.PI/6; felt.position.y = .14; g.add(felt);
    const die = spinner(makeDie(), .62); die.position.y = .62; g.add(die); const S = { hov: 0 };
    NG.waitV = miniView(go.querySelector('canvas'), { w: 150, h: 120, res: .9, fov: 30, fps: 30, tick: (dt, t) => { die.userData.inner.rotation.y += dt*1.5; die.userData.inner.rotation.x = Math.sin(t*1.3)*.3; const on = go.classList.contains('on'); g.position.y += (((on ? .08 : -.05) + S.hov*.12) - g.position.y)*Math.min(1, dt*8); } });
    NG.waitV.cam.position.set(0, 3.1, 3.3); NG.waitV.cam.lookAt(0, .3, 0); NG.waitV.sc.add(g);
    go.addEventListener('pointerenter', () => S.hov = 1); go.addEventListener('pointerleave', () => S.hov = 0);
  }
}
