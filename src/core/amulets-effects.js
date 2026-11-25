const amCount = (p, k) => ((G.players[p].amulets || {})[k] || 0);
const fxOf = p => (G.players[p].fx ||= {});
function topNumber(p){ const by = {}; G.verts.forEach(v => { if (!v.building || v.building.p !== p) return; v.tiles.forEach(ti => { const t = G.tiles[ti]; if (t.num) by[t.num] = (by[t.num] || 0) + (v.building.type === 'ciudad' ? 2 : 1)*pips(t.num); }); }); return +Object.keys(by).sort((a, b) => by[b] - by[a])[0] || 0; }
function tradeBlocked(p, r){ const f = G && G.players[p] && G.players[p].fx; return !!(f && f.plague && f.plague.res === r); }
function amuletRollStart(s){
  const RY = { half: {}, acc: {}, hit: {} };
  G.players.forEach((P, p) => { const f = P.fx; if (f && f.ojo && f.ojo.num === s && Math.random() < .5){ RY.half[p] = true; notify(`👁 El <b>ojo turbio</b> hizo que ${p === 0 ? 'cosecharas' : P.name + ' cosechara'} solo la mitad del ${s}`, P.color); } });
  return RY;
}
function amuletYield(p, r, s, n, RY){
  if (!RY) return n;
  if (RY.half[p]){ const a = RY.acc[p] || 0; RY.acc[p] = a + n; n = Math.floor((a + n)/2) - Math.floor(a/2); }
  const f = G.players[p].fx; if (f && f.plague && f.plague.res === r && !RY.hit[p + r]){ RY.hit[p + r] = true; n = Math.max(0, n - 1); }
  return n;
}
// building while a plague hits the resource: 75% to waste one more; without spares the work fails and one is lost
function plagueFail(p, cost){
  const f = G.players[p].fx; if (!f || !f.plague) return false; const r = f.plague.res; if (!cost[r] || Math.random() >= .75) return false;
  const P = G.players[p];
  if (P.res[r] >= cost[r] + 1){ P.res[r] -= 1; notify(`${AMULETS[f.plague.k].name}: ${p === 0 ? 'se te echó a perder' : P.name + ' perdió'} 1 ${resImg(r)} extra al construir`, P.color); return false; }
  P.res[r] = Math.max(0, P.res[r] - 1); notify(`${AMULETS[f.plague.k].name}: ${p === 0 ? 'tu construcción falló' : 'la construcción de ' + P.name + ' falló'} y se perdió 1 ${resImg(r)}`, P.color); refresh(); return true;
}
function tickFx(p){   // called when player p finishes a turn
  const f = G.players[p].fx; if (!f) return;
  if (f.ojo && --f.ojo.turns <= 0) delete f.ojo;
  if (f.plague && --f.plague.turns <= 0){ notify(`${p === 0 ? 'Tus tierras se recuperaron' : 'Las tierras de ' + G.players[p].name + ' se recuperaron'} de ${AMULETS[f.plague.k].name.toLowerCase()}`, G.players[p].color, 'sys'); delete f.plague; }
}
// tip roads: any road (rivals' and, for the human, also your own), no building at either end, one end with no other road of that owner (so nothing gets cut off)
function demolishable(p, own = false){
  return G.edges.filter(e => { if (e.road === null || (e.road === p && !own)) return false; const q = e.road, A = G.verts[e.a], B = G.verts[e.b];
    if (A.building || B.building) return false;
    const others = v => v.edges.filter(id => id !== e.id && G.edges[id].road === q).length;
    return others(A) === 0 || others(B) === 0; });
}
function removeRoad(eid){ const e = G.edges[eid], q = e.road; if (e.mesh){ boardScene.remove(e.mesh); e.mesh = null; } e.road = null; G.players[q].roads--; updateClusters(q); updateLongest(); }
// ---------- casting ----------
function castAmulet(p, k, target){
  const P = G.players[p], A = AMULETS[k]; P.amulets[k]--; updateInventory();
  if (A.tgt === 'player'){
    const T = G.players[target];
    if (amCount(target, 'escudo') > 0){ T.amulets.escudo--; updateInventory(); notify(`🛡️ El escudo de roble de ${target === 0 ? 'ti' : T.name} bloqueó ${A.name.toLowerCase()} de ${p === 0 ? 'ti' : P.name}`, T.color); amuletFx(target, k, true); return; }
    if (k === 'ojo'){ const num = topNumber(target); fxOf(target).ojo = { num, turns: 2, from: p }; notify(`👁 ${p === 0 ? 'Lanzaste' : P.name + ' lanzó'} <b>ojo turbio</b> sobre ${target === 0 ? 'ti' : T.name}: su ${num} podría dar la mitad`, P.color); }
    else if (A.res){ fxOf(target).plague = { res: A.res, k, turns: 1, from: p }; notify(`☠ ${p === 0 ? 'Lanzaste' : P.name + ' lanzó'} <b>${A.name.toLowerCase()}</b> sobre ${target === 0 ? 'ti' : T.name}: ${PLAGUE_TXT[A.res]}`, P.color); }
    else if (k === 'pluma'){ const has = RES.filter(r => T.res[r] > 0); if (!has.length){ notify(`🪶 La pluma del viento no encontró nada que robarle a ${T.name}`, P.color); } else { const r = pick(has); T.res[r]--; P.res[r]++; notify(`🪶 ${p === 0 ? 'Le robaste' : P.name + ' le robó'} 1 ${resImg(r)} a ${target === 0 ? 'ti' : T.name} con la pluma del viento`, P.color); if (p === 0){ const tok = invExpect(r, 1); flyToInventory(tok, innerWidth/2, innerHeight/2, 0); } } }
    amuletFx(target, k);
  } else if (k === 'demolicion'){
    const e = G.edges[target], q = e.road; removeRoad(target); P.res.madera++; P.res.ladrillo++;
    notify(q === p ? `🔨 ${p === 0 ? 'Demoliste uno de tus caminos y recuperaste' : P.name + ' demolió uno de sus caminos y recuperó'} ${resImg('madera')} ${resImg('ladrillo')}` : `🔨 ${p === 0 ? 'Demoliste' : P.name + ' demolió'} un camino de ${q === 0 ? 'ti' : G.players[q].name} y ${p === 0 ? 'recuperaste' : 'se quedó con'} ${resImg('madera')} ${resImg('ladrillo')}`, P.color);
    if (mode === 'board'){ const a = G.verts[e.a], b = G.verts[e.b]; celebrate(boardScene, (a.x + b.x)/2, .2, (a.z + b.z)/2, .6, 0x8a6a40, 1); }
  }
  SFX.reveal?.(); refresh();
}
function amuletFx(target, k, blocked){ const pl = PLATES[target]; if (!pl) return; pl.el.classList.remove('hexed'); void pl.el.offsetWidth; pl.el.classList.add(blocked ? 'shielded' : 'hexed'); setTimeout(() => pl.el.classList.remove('hexed', 'shielded'), 1600); }
// the human: tap an amulet in the objects window, then a rival's sign (or a road on the board)
function useAmulet(k){
  const P = G.players[0], A = AMULETS[k];
  if (!amCount(0, k)) return;
  if (A.tgt === 'passive'){ notify(`${A.name}: ${A.desc}`, P.color, 'sys'); return; }
  if (G.current !== 0 || !(G.phase === 'main' || G.phase === 'roll') || G.setup){ notify('Puedes usar amuletos durante tu turno.', P.color, 'sys'); return; }
  if (G.amuletPick && G.amuletPick.k === k){ amuletCancel(); return; }
  amuletCancel(); G.amuletPick = { k }; SFX.click?.();
  if (A.tgt === 'road'){
    const list = demolishable(0, true); if (!list.length){ G.amuletPick = null; notify('No hay caminos sueltos que se puedan demoler.', P.color, 'sys'); return; }
    exitBuild(); markers = new THREE.Group(); list.forEach(e => { const a = G.verts[e.a], b = G.verts[e.b], m = new THREE.Mesh(new THREE.BoxGeometry(.55, .07, .16), keepMat(new THREE.MeshBasicMaterial({ color: e.road === 0 ? 0xffc23a : 0xff5a3a, transparent: true, opacity: .75 }))); m.position.set((a.x + b.x)/2, .27, (a.z + b.z)/2); m.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x); m.userData.demoE = e.id; markers.add(m); }); boardScene.add(markers);
    setupTip(`🔨 <b>Demolición</b>: toca un camino marcado (rojo: rival · amarillo: tuyo) · <u class="amcx">cancelar</u>`);
  } else setupTip(`${A.name}: toca el <b>letrero</b> del rival · <u class="amcx">cancelar</u>`);
  const cx = $('#pb-tip .amcx'); if (cx) cx.onclick = amuletCancel;
  document.body.classList.add('amtarget');
}
function amuletCancel(){ if (!G.amuletPick) return; if (AMULETS[G.amuletPick.k].tgt === 'road' && markers){ boardScene.remove(markers); markers = null; } G.amuletPick = null; setupTip(''); document.body.classList.remove('amtarget'); }
function amuletPlate(i){ const k = G.amuletPick.k; if (AMULETS[k].tgt !== 'player') return; amuletCancel(); castAmulet(0, k, i); }
function amuletBoardClick(e){
  const k = G.amuletPick && G.amuletPick.k; if (!k || AMULETS[k].tgt !== 'road' || !markers) return false;
  setRay(e); const o = ray.intersectObjects(markers.children, false)[0]?.object || nearPick(markers.children, wpos, e, 30); if (!o) return true;
  const eid = o.userData.demoE; amuletCancel(); castAmulet(0, 'demolicion', eid); return true;
}
// ---------- the four-leaf clover: offered right after your dice land ----------
function cloverAsk(p, d1, d2){
  const P = G.players[p]; if (!amCount(p, 'trebol')) return Promise.resolve(false);
  const s = d1 + d2;
  if (P.bot){ const mine = G.tiles.some(t => t.num === s && t.i !== G.robber && t.verts.some(v => G.verts[v].building && G.verts[v].building.p === p)); const use = (!mine && s !== 7) || (s === 7 && total(P) > 7); if (use){ P.amulets.trebol--; notify(`🍀 ${P.name} usó su trébol para volver a tirar`, P.color); } return Promise.resolve(use); }
  return new Promise(res => {
    openModal(`<div class="amask"><canvas class="amcv"></canvas><div><h3>🍀 Trébol de la fortuna</h3><p>Sacaste <b>${s}</b>. ¿Quieres usar tu trébol y volver a tirar?</p></div></div><div class="row end"><button data-k="0">Quedarme con ${s}</button><button class="primary" data-k="1">Volver a tirar</button></div>`, false);
    if (miniInit()){ const o = spinner(amuletModel('trebol'), 1.2); const v = miniView(modalBody.querySelector('.amcv'), { w: 80, h: 80, res: .8, fov: 30, fps: 30, tick: dt => { o.userData.inner.rotation.y += dt*1.4; } }); v.sc.add(o); v.cam.position.set(0, .2, 2.6); v.cam.lookAt(0, 0, 0); }
    modalBody.onclick = e => { const b = e.target.closest('button[data-k]'); if (!b) return; closeModal(); const use = b.dataset.k === '1'; if (use){ P.amulets.trebol--; updateInventory(); } res(use); };
  });
}
// ---------- bots use theirs against the leader ----------
function botAmulets(p){
  if (isClassic()) return false;
  const P = G.players[p]; if (!P.amulets) return;
  const rivals = G.players.map((_, i) => i).filter(i => i !== p), leader = rivals.sort((a, b) => vp(b) - vp(a) + (Math.random() - .5))[0];
  for (const k of AMK){ if (!amCount(p, k) || AMULETS[k].tgt === 'passive' || Math.random() > .55) continue;
    if (AMULETS[k].tgt === 'road'){ const list = demolishable(p).sort((a, b) => vp(b.road) - vp(a.road)); if (list.length){ castAmulet(p, k, list[0].id); return true; } continue; }
    const tgt = k === 'pluma' ? rivals.sort((a, b) => total(G.players[b]) - total(G.players[a]))[0] : leader;
    castAmulet(p, k, tgt); return true; }
  return false;
}

