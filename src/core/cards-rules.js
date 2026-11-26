function buyCard(p){
  const P = G.players[p]; if (!G.deck.length || !afford(p, CARD_COST)) return false;
  if (plagueFail(p, CARD_COST)) return false;
  pay(p, CARD_COST); const t = G.deck.pop(); (P.cards ||= []).push({ t, turn: G.turnId });
  if (p === 0){ SFX.card?.(); notify(`Compraste una carta: <b>${CARD_DEFS[t].name}</b>`, P.color); renderFan(P.cards.length - 1); }
  else notify(`${P.name} compró una carta de desarrollo`, P.color);
  checkWin(p); refresh(); return true;
}
function playCard(p, i, choice){
  const P = G.players[p], c = P.cards[i]; if (!c) return;
  P.cards.splice(i, 1); G.playedTurn = G.turnId;
  const who = p === 0 ? 'Jugaste' : `${P.name} jugó`, name = `<b>${CARD_DEFS[c.t].name}</b>`;
  SFX.card?.();
  switch (c.t){
    case 'caballero':
      P.knights = (P.knights || 0) + 1; notify(`${who} un ${name}`, P.color);
      if (p === 0){ G.robberReturn = G.phase; G.phase = 'robber'; } else botRobber(p);
      updateArmy(p); break;
    case 'caminos': {
      notify(`${who} ${name}`, P.color);
      if (p === 0){ G.freeRoads = 2; if (validRoads(0).length) enterBuild('camino'); }
      else for (let k=0;k<2;k++){ const e = bestRoad(p); if (e !== null && P.roads < 15) buildRoad(p, e, true); }
      break; }
    case 'abundancia': { const [a, b] = choice; P.res[a]++; P.res[b]++; notify(`${who} ${name} y tomó ${resImg(a)} ${resImg(b)}`, P.color); break; }
    case 'monopolio': { let n = 0; G.players.forEach((Q, q) => { if (q !== p){ n += Q.res[choice]; Q.res[choice] = 0; } }); P.res[choice] += n; notify(`${who} ${name}: se llevó ${n} ${resImg(choice)} de todos`, P.color); break; }
    case 'mercader': G.merchant = G.turnId; notify(`${who} ${name}: cambios 2:1 este turno`, P.color); break;
    case 'espia': { const q = G.players.map((Q, k) => [k, Q.res[choice]]).filter(([k, n]) => k !== p && n > 0).sort((a, b) => b[1] - a[1])[0]; if (q){ G.players[q[0]].res[choice]--; P.res[choice]++; notify(`${who} ${name} y le robó 1 ${resImg(choice)} a ${G.players[q[0]].name}`, P.color); } else notify(`${who} ${name}, pero nadie tenía ${resImg(choice)}`, P.color); break; }
    case 'cosecha': {
      const got = {}; G.verts.forEach(v => { if (!v.building || v.building.p !== p) return; const t = v.tiles.map(ti => G.tiles[ti]).filter(t => TERRAIN[t.type].res).sort((a, b) => pips(b.num) - pips(a.num))[0]; if (!t) return; const r = TERRAIN[t.type].res, n = v.building.type === 'ciudad' ? 2 : 1; P.res[r] += n; got[r] = (got[r] || 0) + n; });
      notify(`${who} ${name} y recibió ${resStr(got) || 'nada'}`, P.color); break; }
  }
  checkWin(p); refresh();
}
function updateArmy(p){
  const P = G.players[p], cur = G.army ?? -1;
  if ((P.knights || 0) >= 3 && (cur === -1 || (P.knights > (G.players[cur].knights || 0) && cur !== p))){ G.army = p; notify(`🛡️ ${p === 0 ? 'Tienes' : P.name + ' tiene'} la <b>Guardia más poderosa</b> (+2 PV)`, P.color); SFX.win?.(); checkWin(p); }
}
function longestRoadOf(p){
  const es = G.edges.filter(e => e.road === p); if (!es.length) return 0;
  const blocked = vid => { const b = G.verts[vid].building; return b && b.p !== p; };
  let best = 0; const used = new Set();
  const dfs = (vid, len) => { best = Math.max(best, len); if (len > 0 && blocked(vid)) return; for (const eid of G.verts[vid].edges){ const e = G.edges[eid]; if (e.road !== p || used.has(eid)) continue; used.add(eid); dfs(e.a === vid ? e.b : e.a, len + 1); used.delete(eid); } };
  const starts = new Set(); es.forEach(e => { starts.add(e.a); starts.add(e.b); }); starts.forEach(v => dfs(v, 0));
  return best;
}
function updateLongest(){
  if (!G) return;
  const lens = G.players.map((_, p) => longestRoadOf(p)), cur = G.longest ?? -1;
  let holder = cur;
  if (cur !== -1 && lens[cur] < 5) holder = -1;
  const max = Math.max(...lens);
  if (holder === -1){ if (max >= 5 && lens.filter(l => l === max).length === 1) holder = lens.indexOf(max); }
  else if (max > lens[holder]) holder = lens.indexOf(max);
  if (holder !== cur){ G.longest = holder; if (holder !== -1){ const P = G.players[holder]; notify(`🛤️ ${holder === 0 ? 'Tienes' : P.name + ' tiene'} el <b>Camino más largo</b> (${lens[holder]}, +2 PV)`, P.color); checkWin(holder); } }
}
// ---------- bots use cards ----------
function botPlayCard(p, beforeRoll){
  const P = G.players[p]; if (!P.cards || G.playedTurn === G.turnId) return false;
  const ok = c => c.t !== 'punto' && c.turn !== G.turnId && (!beforeRoll || c.t === 'caballero');
  const idx = t => P.cards.findIndex(c => c.t === t && ok(c));
  if (beforeRoll){ const i = idx('caballero'); if (i >= 0 && G.tiles[G.robber].verts.some(v => G.verts[v].building?.p === p)){ playCard(p, i); return true; } return false; }
  const need = (() => { const t = P.ciudades < 4 && validCities(p).length ? COST.ciudad : COST.pueblo; return RES.filter(r => (t[r] || 0) > P.res[r]); })();
  let i;
  if ((i = idx('caminos')) >= 0 && validRoads(p).length && P.roads < 14){ playCard(p, i); return true; }
  if ((i = idx('abundancia')) >= 0){ playCard(p, i, [need[0] || 'trigo', need[1] || need[0] || 'mineral']); return true; }
  if ((i = idx('monopolio')) >= 0){ const r = RES.map(r => [r, G.players.reduce((s, Q, q) => s + (q !== p ? Q.res[r] : 0), 0)]).sort((a, b) => b[1] - a[1])[0]; if (r[1] >= 3){ playCard(p, i, r[0]); return true; } }
  if ((i = idx('cosecha')) >= 0){ playCard(p, i); return true; }
  if ((i = idx('espia')) >= 0){ playCard(p, i, need[0] || 'mineral'); return true; }
  if ((i = idx('mercader')) >= 0 && RES.some(r => P.res[r] >= 2)){ playCard(p, i); return true; }
  if ((i = idx('caballero')) >= 0 && Math.random() < .55){ playCard(p, i); return true; }
  return false;
}

