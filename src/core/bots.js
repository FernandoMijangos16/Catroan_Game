// ================= BOTS =================
// difficulty (chosen in Jugar, the host's choice online — bots always run on the host): 'facil' · 'normal' (the classic
// bots) · 'dificil'. It changes how well they pick corners, how much they trade and whether they race you for spots.
const BOT_LEVELS = { facil: { noise: 3.5, sloppy: .35, offer: .12, bank: .5, contested: .4, cards: .3, block: false },
  normal: { noise: 1.6, sloppy: 0, offer: .35, bank: 1, contested: .6, cards: .6, block: false },
  dificil: { noise: .4, sloppy: 0, offer: .55, bank: 1, contested: 1.35, cards: .85, block: true, need: true } };
const botLvl = () => BOT_LEVELS[GAME_OPTS.botLevel] || BOT_LEVELS.normal;
// how much a bot likes a corner: its production, plus (hard bots) the kinds of resource it does not produce yet
function botSpotScore(p, v, noise){
  let s = vscore(v); const L = botLvl();
  if (L.need){ const have = new Set(); G.verts.forEach(w => { if (w.building && w.building.p === p) w.tiles.forEach(ti => { const r = TERRAIN[G.tiles[ti].type].res; if (r) have.add(r); }); });
    v.tiles.forEach(ti => { const r = TERRAIN[G.tiles[ti].type].res; if (r && !have.has(r)) s += 1.2*pips(G.tiles[ti].num)/5; }); }
  return s + Math.random()*noise;
}
// best corner of a list; easy bots sometimes settle for the 2nd or 3rd. setup = the opening placement (normal bots add a
// little chance there, but during the game they always took the best corner — kept as it was)
function botBestSpot(p, list, setup){ const L = botLvl(), noise = setup ? L.noise : L === BOT_LEVELS.normal ? 0 : L.noise*.5, sorted = list.map(v => ({ v, s: botSpotScore(p, v, noise) })).sort((a, b) => b.s - a.s);
  if (!sorted.length) return null; const k = L.sloppy && Math.random() < L.sloppy ? Math.min(sorted.length - 1, 1 + Math.floor(Math.random()*2)) : 0; return sorted[k].v; }
// where a road should go: the closest good free corner (no building on it or next to it) the bot can still reach,
// walking only over empty edges and never through a rival's village; the road built is the first step of that path
function roadPlan(p){
  const own = v => v.building && v.building.p === p, rival = v => v.building && v.building.p !== p;
  const dist = new Map(), first = new Map(), q = [];
  G.verts.forEach(v => { if (rival(v)) return; if (own(v) || v.edges.some(id => G.edges[id].road === p)){ dist.set(v.id, 0); q.push(v.id); } });
  while (q.length){ const vid = q.shift(), d = dist.get(vid); if (d >= 3) continue; const v = G.verts[vid];
    if (d > 0 && rival(v)) continue;   // a rival's village blocks the way
    v.edges.forEach(id => { const e = G.edges[id]; if (e.road !== null) return; const w = e.a === vid ? e.b : e.a; if (dist.has(w)) return; dist.set(w, d + 1); first.set(w, d === 0 ? id : first.get(vid)); q.push(w); }); }
  let best = null;
  dist.forEach((d, vid) => { const v = G.verts[vid]; if (d < 1 || v.building || !distanceOK(v)) return;
    const contested = v.edges.some(id => { const r = G.edges[id].road; return r !== null && r !== p; });
    const s = vscore(v)*(d === 1 ? 1 : d === 2 ? .72 : .5)*(contested ? botLvl().contested : 1) + Math.random()*.3;
    if (!best || s > best.s) best = { s, edge: first.get(vid), target: vid, d, contested }; });
  return best;
}
function bestRoad(p){ const plan = roadPlan(p); if (plan) return plan.edge; const any = validRoads(p); return any.length ? pick(any).id : null; }   // free roads (a card) still go somewhere
function botTrade(p){
  const P = G.players[p];
  let target = 'camino';
  if (P.pueblos > 0 && P.ciudades < 4 && P.res.trigo + P.res.mineral >= 3) target = 'ciudad';
  else if (validSettlements(p).length && P.pueblos < 5) target = 'pueblo';
  const cost = COST[target];
  const need = Object.keys(cost).filter(r => P.res[r] < cost[r]);
  if (!need.length || Math.random() > botLvl().bank) return false;   // easy bots often skip the comercio
  const give = RES.find(r => P.res[r] - (cost[r] || 0) >= tradeRate(p, r));
  if (!give) return false;
  const get = need[0], k = tradeRate(p, give);
  P.res[give] -= k; P.res[get] += 1; if (P.buffs) P.buffs.halfTrade = false;
  notify(`${P.name} cambió ${k} ${resImg(give)} por 1 ${resImg(get)} ${k < 4 ? 'en su puerto' : 'en el comercio'}`, P.color);
  return true;
}
function botAct(p, st){
  const P = G.players[p];
  if (afford(p, costFor(p, 'ciudad')) && P.ciudades < 4){
    const c = botBestSpot(p, validCities(p));
    if (c){ focusBoard(c.x, c.z, P.color); buildCity(p, c.id); notify(`${P.name} convirtió <b>${c.name}</b> en ciudad`, P.color); gossip(`${P.name} convirtió ${c.name} en ciudad`); checkWin(p); return true; }
  }
  if (afford(p, costFor(p, 'pueblo')) && P.pueblos < 5){
    const s = botBestSpot(p, validSettlements(p));
    if (s){ focusBoard(s.x, s.z, P.color); buildSettlement(p, s.id); notify(`${P.name} fundó el pueblo <b>${s.name}</b>`, P.color); gossip(`${P.name} fundó un pueblo nuevo llamado ${s.name}`); checkWin(p); return true; }
  }
  if (!st.played && botPlayCard(p, false)){ st.played = true; return true; }
  if ((!st.traded || (botLvl() === BOT_LEVELS.dificil && st.traded < 2)) && botTrade(p)){ st.traded = (st.traded || 0) + 1; return true; }   // hard bots may trade twice
  if (!st.bought && G.deck.length && afford(p, CARD_COST) && Math.random() < botLvl().cards && !afford(p, costFor(p, 'pueblo'))){ st.bought = true; buyCard(p); return true; }
  if (afford(p, costFor(p, 'camino')) && P.roads < 15){
    // with a free corner already reachable the bot saves for the village instead of stretching roads to nowhere
    const spot = validSettlements(p).length > 0, plan = roadPlan(p), rich = P.res.madera + P.res.ladrillo >= 6 && P.res.lana + P.res.trigo === 0;
    if (plan && (!spot || rich || (botLvl().block && plan.contested))){   // hard bots race you to contested corners
      const e = plan.edge;
      if (e !== null){ { const E = G.edges[e], A = G.verts[E.a], B2 = G.verts[E.b]; focusBoard((A.x + B2.x)/2, (A.z + B2.z)/2, P.color); } buildRoad(p, e); notify(`${P.name} construyó un camino`, P.color); gossip(`${P.name} anda construyendo caminos`); return true; }
    }
  }
  return false;
}
async function botTurn(p, fromMain){   // fromMain: the dice were already rolled (a bot taking over a player who left)
  const gid = G.id, tid = G.turnId;
  // one bot turn per turn: a second call (a reconnect, a late online state) for the same turn is ignored
  const run = gid + ':' + tid; if (botTurn.running === run) return; botTurn.running = run;
  const alive = () => G.id === gid && G.turnId === tid && !G.over;
  if (TUT.on) return tutBotTurn(p, alive);   // tutorial bots only roll and pass
  await wait(1500); if (!alive()) return;
  botQuests(p);
  if (!fromMain){
  if (botPlayCard(p, true)){ refresh(); await annIdle(); await wait(900); if (!alive()) return; }
  await rollDice();
  await annIdle(); await wait(mode === 'board' ? 2600 : 1100); if (!alive()) return;
  }
  if (botAmulets(p)){ refresh(); await annIdle(); await wait(900); if (!alive()) return; }
  const st = { traded:false };
  if (await botOfferTrade(p, st)){ await annIdle(); await wait(700); if (!alive()) return; }
  for (let k=0;k<8;k++){
    if (!botAct(p, st)) break;
    refresh();
    await annIdle(); await wait(mode === 'board' ? 1500 : 900); if (!alive()) return;
  }
  await annIdle(); await wait(500); if (!alive()) return;
  endTurn();
}
function endTurn(){
  exitBuild(); hidePopup(); if (G.amuletPick) amuletCancel(); tickFx(G.current);
  { const ord = G.order || [...G.players.keys()]; G.current = ord[(ord.indexOf(G.current) + 1) % ord.length]; } G.turnId++; G.phase = 'roll';
  const P = G.players[G.current];
  if (NG.on) G.players.forEach((Q, i) => { if (Q.rejoin && i !== G.current){ Q.rejoin = false; Q.bot = false; } });
  villageQuests();   // each town posts missions on its own timer (core/missions.js)
  eventsTick();      // season events start and end with the rounds (core/events.js)
  if (P.buffs){
    if (P.buffs.randomItem){ P.buffs.randomItem = false; if (Math.random() < .5){ const r = pick(RES); P.res[r]++; notify(`${G.current === 0 ? 'Recibiste' : P.name + ' recibió'} un regalo: 1 ${resImg(r)}`, P.color); } else { const k = pick(SPK); giveSpecial(G.current, k); notify(`${G.current === 0 ? 'Recibiste' : P.name + ' recibió'} un regalo: ${specImg(k)} ${SPECIAL[k].name}`, P.color); } }
    if (P.buffs.extraRes){ P.buffs.extraRes = false; P.extraTurn = G.turnId; }
  }
  refresh();
  if (NG.on){ netFlush(true); netKick(); return; }
  autoSave();   // solo games keep themselves saved at every turn (core/save.js)
  if (P.bot) botTurn(G.current);
  else { notify('🔔 <b>Es tu turno</b>' + (mode !== 'board' ? ' · vuelve al tablero para jugar' : ''), P.color, 'sys'); SFX.turn(); }
}

