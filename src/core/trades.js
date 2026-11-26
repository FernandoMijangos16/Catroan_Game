// ================= TRADES BETWEEN PLAYERS =================
function botNeeds(q){
  const P = G.players[q];
  const tgt = P.ciudades < 4 && validCities(q).length ? COST.ciudad : validSettlements(q).length && P.pueblos < 5 ? COST.pueblo : COST.camino;
  return { tgt, need: RES.filter(r => (tgt[r] || 0) > P.res[r]) };
}
function botAcceptTrade(q, gets, gives){
  const P = G.players[q]; if ([...RES, ...SPK].some(r => (gives[r] || 0) > haveOf(q, r))) return false;
  if (RES.some(r => (gets[r] || gives[r]) && (tradeBlocked(q, r) || tradeBlocked(0, r)))) return false;
  if (vp(0) >= 8) return false;
  const { tgt, need } = botNeeds(q);
  let inV = 0, outV = 0;
  // what they receive is worth more when it is missing (for their next build, or at all); what they give is cheap when they have plenty
  RES.forEach(r => { const n = gets[r] || 0, m = gives[r] || 0, have = P.res[r];
    if (n) inV += n*(need.includes(r) ? 1.7 : have === 0 ? 1.25 : have === 1 ? .95 : .7);
    if (m) outV += m*((tgt[r] || 0) > have - m ? 1.3 : have >= 3 ? .55 : .85); });
  SPK.forEach(k => { inV += (gets[k] || 0)*specValue(q, k, false); outV += (gives[k] || 0)*specValue(q, k, true); });
  return inV >= outV*.95 && Math.random() < .92;
}
function doTrade(a, b, aGives, bGives){
  [...RES, ...SPK].forEach(r => { const x = aGives[r] || 0, y = bGives[r] || 0; if (!x && !y) return;
    if (RES.includes(r)){ G.players[a].res[r] += y - x; G.players[b].res[r] += x - y; }
    else { [a, b].forEach(p => G.players[p].special = G.players[p].special || {}); G.players[a].special[r] = (G.players[a].special[r] || 0) + y - x; G.players[b].special[r] = (G.players[b].special[r] || 0) + x - y; } });
  if (a === G.current || b === G.current) G.tradeOpen = G.turnId;
  tradeCount(a, b, 1);
  updateInventory();
}
// at most TRADE_MAX trades between the same two players in one turn (G.trades: { t: turnId, l: [[a, b, n]] })
const TRADE_MAX = 2;
function tradeCount(a, b, add = 0){
  if (!G.trades || G.trades.t !== G.turnId) G.trades = { t: G.turnId, l: [] };
  const lo = Math.min(a, b), hi = Math.max(a, b); let e = G.trades.l.find(x => x[0] === lo && x[1] === hi);
  if (add){ if (!e) G.trades.l.push(e = [lo, hi, 0]); e[2] += add; }
  return e ? e[2] : 0;
}
const tradesLeft = (a, b) => Math.max(0, TRADE_MAX - tradeCount(a, b));
const tradeLimitMsg = n => `Ya hiciste ${TRADE_MAX} trueques con ${n} en este turno.`;
const haveOf = (p, k) => RES.includes(k) ? G.players[p].res[k] : ((G.players[p].special || {})[k] || 0);
function specValue(p, k, giving){ const need = (G.quests || []).some(q => q.p === p && q.state !== 'done' && qItems(q)[k] && ((G.players[p].special || {})[k] || 0) < qItems(q)[k] + (giving ? 1 : 0)); return need ? 2.6 : SPECIAL[k].val*.5; }
const resList = o => Object.entries(o).filter(([, n]) => n > 0).map(([r, n]) => `${n} ${RES.includes(r) ? resImg(r) : specImg(r)}`).join(' ') || 'nada';
// ---------- trade letters from the mayor's office ----------
const FEM = new Set(['Ana', 'Carla', 'Elena']);
// a name chip in the player's color, readable on the paper notes and on the dark bar alike
const nameTag = (n, c) => { const k = new THREE.Color(c || '#888'), lum = .3*k.r + .59*k.g + .11*k.b; return `<b class="ntag" style="background:${c};color:${lum > .55 ? '#1a1208' : '#fff'}">${n}</b>`; };
const mayorName = () => G.players[0].name === 'Tú' ? 'El Alcalde' : G.players[0].name;
async function tradeLetter(target){
  const Q = G.players[target];
  if (NG.on && G.current !== 0){ sysNote('En línea solo puedes proponer tratos durante tu turno.', { ms: 2600 }); return; }
  if (!tradesLeft(0, target)){ sysNote(tradeLimitMsg(Q.name), { ms: 2600 }); return; }
  if (!scenesOn()){ openTrade('jug', { target }); return; }
  if (marketCtx || $('#offer').classList.contains('show')){ sysNote('Termina primero lo que estás haciendo.', { ms: 2200 }); return; }
  if (mode !== 'board'){ if (mode === 'village') backToBoard(); for (let k=0;k<80 && mode !== 'board';k++) await wait(200); }
  for (let k=0;k<60 && (busy || marketCtx);k++) await wait(200);
  const r = await officeScene({ mode: 'write', to: Q.name, toColor: Q.color, toF: FEM.has(Q.name), from: mayorName(),
    decide: (offer, ask) => { if (!tradesLeft(0, target) || (G.current !== 0 && (G.tradeOpen !== G.turnId || target !== G.current))) return false; return isRemote(target) ? netAsk(target, 'offer', { give: offer, want: ask }, () => false, 60000) : botAcceptTrade(target, offer, ask); } });
  if (r === null) return;
  if (r.ok){ await courierScene(target, r.offer, r.ask); refresh(); }
  else if (!r.cancel) notify(`${Q.name} rechazó tu carta de trueque`, Q.color);
}
// a rival's offer: just the letter and the stamps in front of you, wherever you are (no messenger: you did not propose it)
async function askHuman(p, gives, wants){ for (let k=0;k<60 && (marketCtx || $('#offer').classList.contains('show'));k++) await wait(250); return offerToHuman(p, gives, wants); }
// a bot proposes to the human: glowing parchment, everything else darkened
async function botOfferTrade(p, st){
  if (st.offered || Math.random() > .35) return false;
  st.offered = true;
  // online the bot writes to any of the humans at the table (away players excluded), offline to you
  const hs = (NG.on ? humanSeats().filter(h => h !== p && !G.players[h].away) : [0]).filter(h => tradesLeft(h, p) > 0); if (!hs.length) return false;
  const h = pick(hs), H = G.players[h], you = h === 0, P = G.players[p], { tgt, need } = botNeeds(p);
  const ask = (give, want) => you ? askHuman(p, give, want) : netAsk(h, 'offer', { give, want }, () => false, 45000);
  const no = () => notify(you ? `Rechazaste el trueque de ${P.name}` : `${H.name} rechazó el trueque de ${P.name}`, H.color);
  const qn = (G.quests || []).map(q => q.p === p && q.state !== 'done' && !questReady(q) ? Object.keys(qItems(q)).find(k => ((G.players[p].special || {})[k] || 0) < qItems(q)[k] && ((H.special || {})[k] || 0) > 0) : null).filter(Boolean).map(k => ({ item: k }))[0];
  if (qn){ const spare2 = RES.filter(s => P.res[s] - (tgt[s] || 0) >= 1).sort((a, b) => P.res[b] - P.res[a]).slice(0, 2); if (spare2.length){ const give2 = {}; spare2.forEach(s => give2[s] = 1); await scrollIdle(); const ok2 = await ask(give2, { [qn.item]: 1 }); if (ok2 && haveOf(h, qn.item) > 0){ doTrade(h, p, { [qn.item]: 1 }, give2); SFX.trade?.(); notify(you ? `${P.name} te cambió ${resList(give2)} por ${specImg(qn.item)} para su misión` : `${P.name} le cambió ${resList(give2)} a ${H.name} por ${specImg(qn.item)} para su misión`, P.color); } else no(); refresh(); return true; } }
  const r = need.find(r => H.res[r] > 0); if (!r) return false;
  const spare = RES.filter(s => s !== r && P.res[s] - (tgt[s] || 0) >= 2).sort((a, b) => P.res[b] - P.res[a])[0]; if (!spare) return false;
  const give = { [spare]: P.res[spare] - (tgt[spare] || 0) >= 4 ? 2 : 1 }, want = { [r]: 1 };
  if (mode === 'board') focusBoard(G.verts.find(v => v.building?.p === p)?.x ?? 0, G.verts.find(v => v.building?.p === p)?.z ?? 0, P.color);
  await scrollIdle();
  const ok = await ask(give, want);
  if (ok && RES.every(x => (want[x] || 0) <= H.res[x])){ doTrade(h, p, want, give); SFX.trade?.(); notify(you ? `${P.name} hizo un trueque contigo: te dio ${resList(give)} por ${resList(want)}` : `${P.name} hizo un trueque con ${H.name}: le dio ${resList(give)} por ${resList(want)}`, P.color); }
  else no();
  refresh(); return true;
}

