// ================= BOARD INPUT =================
const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
function setRay(e){ const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left)/r.width)*2 - 1, -((e.clientY - r.top)/r.height)*2 + 1); ray.setFromCamera(ndc, camera); }
function upTo(o, key){ while (o){ if (o.userData && o.userData[key] !== undefined) return o.userData[key]; o = o.parent; } return undefined; }
// pick the closest thing on screen (so tiny targets still work with the camera far away)
function nearPick(list, posOf, e, px = 26){
  const r = canvas.getBoundingClientRect(); let best = null, bd = px*Math.max(1, UI_S);
  for (const it of list){ const p = posOf(it); if (!p) continue; const v = p.clone().project(camera); if (v.z > 1 || v.z < -1) continue;
    const sx = r.left + (v.x + 1)/2*r.width, sy = r.top + (1 - v.y)/2*r.height, d = Math.hypot(sx - e.clientX, sy - e.clientY); if (d < bd){ bd = d; best = it; } }
  return best;
}
const wpos = o => o.getWorldPosition(new THREE.Vector3());
function boardClick(e){
  if (!G || G.over) return;
  if (G.phase === 'setupV' || G.phase === 'setupE'){ setupClick(e); return; }
  if (G.setup) return;
  if (TUT.on && !((G.buildMode && TUT.allow.has('tablero')) || (G.phase === 'robber' && TUT.allow.has('ladron')) || TUT.allow.has('puerto'))){ tutNudge(); return; }   // tutorial: the board only takes what Ulises asked for
  setRay(e);
  if (G.current === 0 && G.phase === 'robber'){
    const hit = ray.intersectObjects(tileGroups, true)[0];
    if (!hit) return;
    const ti = upTo(hit.object, 'tile');
    if (ti === undefined) return;
    if (ti === G.robber){ notify('El ladrón ya está ahí: elige otro terreno.', G.players[0].color, 'sys'); return; }
    moveRobber(ti, 0); G.phase = G.robberReturn === 'roll' ? 'roll' : 'main'; G.robberReturn = null; refresh(); return;
  }
  if (G.buildMode && markers){
    const hitObj = ray.intersectObjects(markers.children, false)[0]?.object || nearPick(markers.children, wpos, e, 30);
    if (hitObj){
      const { markE, markV } = hitObj.userData, kind = G.buildMode;
      const tokRoad = G.tokenRoad; G.tokenRoad = false; exitBuild();
      if (kind === 'camino'){ const free = G.freeRoads > 0; if (buildRoad(0, markE, free) === false){ refresh(); return; } if (free && tokRoad){ G.players[0].roadTokens = Math.max(0, (G.players[0].roadTokens || 0) - 1); updateInventory(); } notify(free ? 'Construiste un camino gratis' : 'Construiste un camino', G.players[0].color); if (free){ G.freeRoads--; if (G.freeRoads > 0 && validRoads(0).length && G.players[0].roads < 15){ enterBuild('camino'); refresh(); return; } G.freeRoads = 0; } }
      else if (kind === 'pueblo'){ if (buildSettlement(0, markV) === false){ refresh(); return; } notify(`Fundaste el pueblo <b>${G.verts[markV].name}</b>`, G.players[0].color); checkWin(0); }
      else { if (buildCity(0, markV) === false){ refresh(); return; } notify(`<b>${G.verts[markV].name}</b> ahora es ciudad`, G.players[0].color); checkWin(0); }
      refresh(); return;
    }
  }
  if (G.amuletPick && amuletBoardClick(e)) return;
  // mission marks, magnifiers, ports and buildings compete: what the ray hits wins, otherwise the closest on screen
  // (zoomed out, a port next to a coastal village used to take every click meant for the village)
  const r = canvas.getBoundingClientRect(), PX = 24*Math.max(1, UI_S), cands = [];
  const scr = p => { const v = p.clone().project(camera); if (v.z > 1 || v.z < -1) return Infinity; return Math.hypot(r.left + (v.x + 1)/2*r.width - e.clientX, r.top + (1 - v.y)/2*r.height - e.clientY); };
  const consider = (list, posOf, kind, prio, key) => { const hits = ray.intersectObjects(list, true);
    list.forEach(o => { const hit = hits.find(h => { let x = h.object; while (x){ if (x === o) return true; x = x.parent; } return false; }); const d = hit ? -1/(1 + hit.distance) : scr(posOf(o)); if (d < PX) cands.push({ o, kind, d, prio, key }); }); };
  if (!TUT.on){   // in the tutorial only the port can be asked for here
  consider(QMARKS, wpos, 'quest', 0, o => upTo(o, 'qvid'));
  consider(LUPAS, wpos, 'lupa', 1, o => upTo(o, 'lupa'));
  consider(G.verts.filter(v => v.mesh).map(v => v.mesh), wpos, 'village', 2, o => upTo(o, 'vid'));
  }
  if (!G.buildMode && G.phase !== 'robber') consider(PORT_GROUPS, g => g.position.clone().setY(.1), 'port', 3, o => upTo(o, 'port'));
  const best = cands.sort((a, b) => (a.d < 0 || b.d < 0 ? a.d - b.d : Math.abs(a.d - b.d) < 6 ? a.prio - b.prio : a.d - b.d))[0];
  if (best){ const k = best.key(best.o);
    if (k !== undefined){
      if (best.kind === 'quest' || best.kind === 'lupa'){ hidePopup(); SFX.click?.(); enterVillage(k); return; }
      if (best.kind === 'village'){ showPopup(k, e.clientX, e.clientY); return; }
      if (best.kind === 'port'){ pierScene(k); return; } } }
  hidePopup();
}

