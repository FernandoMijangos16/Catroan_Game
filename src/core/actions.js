// ================= ACTIONS =================
function nextName(){ return G.names.length ? G.names.pop() : 'Pueblo ' + Math.floor(Math.random()*900+100); }
function buildRoad(p, eid, free){ if (!free){ if (plagueFail(p, costFor(p, 'camino'))) return false; pay(p, costFor(p, 'camino')); useDiscount(p, 'camino'); } G.edges[eid].road = p; G.players[p].roads++; drawRoad(eid); updateClusters(p); if (!G.setup){ updateLongest(); roadFind(p, eid); } }
function buildSettlement(p, vid, free){
  if (!free){ if (plagueFail(p, costFor(p, 'pueblo'))) return false; pay(p, costFor(p, 'pueblo')); useDiscount(p, 'pueblo'); }
  const v = G.verts[vid]; v.building = { p, type:'pueblo' }; v.name = v.name || nextName();
  G.players[p].pueblos++; drawBuilding(vid); updateClusters(p); if (!G.setup) updateLongest();
}
function buildCity(p, vid){
  if (plagueFail(p, costFor(p, 'ciudad'))) return false;
  pay(p, costFor(p, 'ciudad')); useDiscount(p, 'ciudad'); const v = G.verts[vid]; v.building.type = 'ciudad';
  G.players[p].pueblos--; G.players[p].ciudades++; drawBuilding(vid); updateClusters(p);
}
function gossip(s){ G.gossip.push(s); if (G.gossip.length > 8) G.gossip.shift(); }


// the dice come out of a bag holding the 36 combinations of two dice: every number shows up in its fair share and there are no long streaks.
// The bag is refilled when 5 are left, so the last rolls can't be counted out exactly.
function drawDice(){
  if (!G.bag || G.bag.length <= 5){ G.bag = []; for (let a=1;a<=6;a++) for (let b=1;b<=6;b++) G.bag.push(a*10 + b); G.bag = shuffle(G.bag); }
  const v = G.bag.pop(); return [Math.floor(v/10), v % 10];
}
function rollDice(){
  const [d1, d2] = drawDice(), gid = G.id;
  G.dice = [d1, d2];
  const p = G.current;
  if (NG.on) netSend({ t: 'dice', d: [d1, d2], tid: G.turnId, f: NG.seat });
  if (mode === 'board' && boardScene){
    G.phase = 'rolling'; refresh();
    return new Promise(res => throwDice(d1, d2, async () => {
      if (G.id !== gid){ res(); return; }
      if (await cloverAsk(p, d1, d2)){ const [e1, e2] = drawDice(); G.dice = [e1, e2]; if (NG.on) netSend({ t: 'dice', d: [e1, e2], tid: G.turnId, f: NG.seat }); await new Promise(r2 => throwDice(e1, e2, r2)); if (G.id === gid) await applyRoll(e1, e2); res(); return; }
      await applyRoll(d1, d2); res(); }));
  }
  G.phase = 'rolling';   // no second roll while this one resolves (off the board there is no dice animation to wait for)
  return cloverAsk(p, d1, d2).then(use => { if (!use) return applyRoll(d1, d2); const [e1, e2] = drawDice(); G.dice = [e1, e2]; return applyRoll(e1, e2); });
}
async function applyRoll(d1, d2){
  const s = d1 + d2;
  const p = G.current, P = G.players[p];
  document.querySelectorAll('.die').forEach((el,i) => { el.textContent = G.dice[i]; el.classList.remove('roll'); void el.offsetWidth; el.classList.add('roll'); });
  if (s === 7){
    notify(p === 0 ? 'Sacaste <b>7</b>. ¡Sale el ladrón!' : `${P.name} sacó <b>7</b>. ¡Sale el ladrón!`, P.color);
    G.phase = 'discard'; refresh();
    await discardHalf();
    if (G.over) return;
    if (P.bot){ botRobber(p); G.phase = 'main'; }
    else G.phase = 'robber';
  } else {
    const gains = G.players.map(() => ({})), shows = [], fest = new Set(), RY = amuletRollStart(s);
    G.tiles.forEach(t => {
      if (t.num !== s || t.i === G.robber) return;
      const r = TERRAIN[t.type].res, to = [];
      t.verts.forEach(vid => { const v = G.verts[vid], b = v.building; if (!b) return; bioTick(b.p, t.type, s); const n = eventYield(r, amuletYield(b.p, r, s, (b.type === 'ciudad' ? 2 : 1) + (b.p === G.current && G.players[b.p].extraTurn === G.turnId ? 1 : 0), RY)); if (n <= 0) return; G.players[b.p].res[r] += n; gains[b.p][r] = (gains[b.p][r] || 0) + n; const tok = b.p === 0 && INV.el ? invExpect(r, n) : null; to.push({ x: v.x, z: v.z, p: b.p, n, tok }); fest.add(vid); });
      if (to.length) shows.push({ tile: t, res: r, to });
    });
    if (mode === 'board' && shows.length) revealProduction(shows);
    else { let d = 0; shows.forEach(e => e.to.forEach(v => { if (v.tok) for (let q=0;q<v.n;q++){ flyToInventory(v.tok, innerWidth/2, innerHeight*.55, d); d += .18; } })); }
    if (mode === 'village' && villageCtx && fest.has(villageCtx.vid) && G.verts[villageCtx.vid].building.p !== 0){ const b = G.verts[villageCtx.vid].building, gh = villageCtx.gh || (() => 0); [[0, 0], [14, 8], [-12, 10], [5, -15]].forEach(([x, z], k) => setTimeout(() => villageCtx && celebrate(villageCtx.sc, x, gh(x, z) + 1, z, 9, G.players[b.p].color, 2), k*450)); }
    let msg = p === 0 ? `Sacaste <b>${s}</b>` : `${P.name} sacó <b>${s}</b>`;
    if (Object.keys(gains[0]).length) msg += ` · recibes ${resStr(gains[0])}`;
    else if (p === 0) msg += ' · esta vez no produjiste nada';
    notify(msg, P.color);
    G.phase = 'main';
  }
  refresh();
}
async function discardHalf(){
  for (let i=0;i<G.players.length;i++){
    const P = G.players[i], t = total(P); if (t <= 7) continue;
    const n = Math.floor(t/2);
    if (i === 0 && mode === 'board'){ await thiefScene(n); continue; }
    if (isRemote(i)){ const lost = netTakeDiscard(P, n, await netAsk(i, 'discard', { n }, () => null, 90000)); notify(`${P.name} le entregó ${resStr(lost)} al ladrón`, P.color); refresh(); continue; }
    const lost = {};
    for (let k=0;k<n;k++){ const r = randomCard(P); P.res[r]--; lost[r] = (lost[r]||0) + 1; }
    notify(i === 0 ? `Tenías más de 7 cartas: descartaste ${resStr(lost)}` : `${P.name} descartó ${n} cartas por el ladrón`, P.color);
  }
}
function moveRobber(ti, p){
  if (mode === 'board') SFX.robber();
  G.robber = ti; placeRobberMesh();
  const t = G.tiles[ti], P = G.players[p];
  if (p !== 0) focusBoard(t.x, t.z, '#2b2b30');
  const victims = [...new Set(t.verts.map(v => G.verts[v].building).filter(b => b && b.p !== p).map(b => b.p))].filter(q => total(G.players[q]) > 0);
  let msg = `${p === 0 ? 'Moviste' : P.name + ' movió'} el ladrón a ${tileName(t)}`;
  if (victims.length){
    const q = pick(victims), r = randomCard(G.players[q]);
    G.players[q].res[r]--; P.res[r]++;
    if (p === 0) msg += ` y le robaste 1 ${resImg(r)} a ${G.players[q].name}`;
    else if (q === 0) msg += ` y <b>te robó 1 ${resImg(r)}</b>`;
    else msg += ` y le robó una carta a ${G.players[q].name}`;
  }
  notify(msg, P.color);
  if (p !== 0) gossip(`${P.name} mandó al ladrón a ${tileName(t)}`);
}
function botRobber(p){
  let best = null, bs = -1e9;
  G.tiles.forEach(t => {
    if (t.i === G.robber) return;
    let s = 0;
    t.verts.forEach(vid => { const b = G.verts[vid].building; if (!b) return; const w = pips(t.num) * (b.type === 'ciudad' ? 2 : 1); s += b.p === p ? -w*2 : w * (1 + vp(b.p)/10); });
    s += Math.random();
    if (s > bs){ bs = s; best = t.i; }
  });
  moveRobber(best, p);
}
function checkWin(p){
  if (vp(p) >= 10 && !G.over){ G.over = true; G.winner = p; G.phase = 'over'; refresh(); if (NG.on) netFlush(true); showWin(p); }
}

