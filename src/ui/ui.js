// ================= UI =================
function notify(html, color='#aaa', o){
  if (NG.on && !NG.relaying && o !== 'sys' && netAuth()) netSend({ t: 'log', h: packHtml(html), c: color, f: NG.seat });
  html = deEmo(html);
  if (o === 'sys'){ const l = $('#log-list'); if (l){ const d = document.createElement('div'); d.innerHTML = `<i style="background:${color}"></i><span>${html}</span>`; l.prepend(d); while (l.children.length > 40) l.lastChild.remove(); } if (/tu turno/i.test(html)) SFX.ding(); sysNote(html); return; }
  addLog(html, color);
  if (/tu turno|te robó|recibes|Ganaste|ganó|Llegaste/i.test(html)) SFX.ding();
  if (G && G.setup) return;
  scrollMsg(html, color);
}
function addLog(html, color){
  NG.inLog = true; try { if (!(G && G.setup)) histPush(html, color); } finally { NG.inLog = false; }
  const l = $('#log-list'); const d = document.createElement('div');
  d.innerHTML = `<i style="background:${color}"></i><span>${html}</span>`; l.prepend(d);
  while (l.children.length > 40) l.lastChild.remove();
}
function refresh(){
  if (!G) return;
  updEventChip();
  if (NG.on) netDirty();
  updatePlates();
  const me = G.players[0], my = G.current === 0 && !G.over;
  $('#res').innerHTML = RES.map(r => `<span class="chip" title="${RES_NAME[r]}">${resImg(r)} ${invShown(r)}</span>`).join('');
  updateInventory();
  let label = '';
  if (G.over) label = 'Partida terminada';
  else if (G.phase === 'register') label = '';
  else if (!my) label = G.setup ? `${G.players[G.current].name} está colocando…` : `Turno de ${G.players[G.current].name}…`;
  else label = { setupV: 'Coloca tu pueblo', setupE: 'Coloca tu camino', setup: '', register: '', roll:'Tu turno: tira los dados', main:'Construye, comercia o termina tu turno', robber:'Mueve al ladrón', rolling:'Los dados están rodando…', discard:'El ladrón está cobrando…' }[G.phase] || '';
  $('#turn-label').textContent = label;
  const main = my && G.phase === 'main';
  $('#b-roll').disabled = !(my && G.phase === 'roll');
  $('#b-road').disabled = !(main && afford(0, costFor(0, 'camino')) && me.roads < 15 && validRoads(0).length);
  $('#b-set').disabled = !(main && afford(0, costFor(0, 'pueblo')) && me.pueblos < 5 && validSettlements(0).length);
  $('#b-city').disabled = !(main && afford(0, costFor(0, 'ciudad')) && me.ciudades < 4 && validCities(0).length);
  $('#b-trade').disabled = !(main && RES.some(r => me.res[r] >= tradeRate(0, r)));
  $('#b-end').disabled = !main;
  $('#b-road').classList.toggle('on', G.buildMode === 'camino');
  $('#b-set').classList.toggle('on', G.buildMode === 'pueblo');
  $('#b-city').classList.toggle('on', G.buildMode === 'ciudad');
  let hint = 'Toca la lupa sobre tus pueblos para entrar en primera persona, o cualquier pueblo para ver su información.';
  if (G.phase === 'robber' && my) hint = 'Toca un terreno para mandar ahí al ladrón (bloquea su producción y robas una carta).';
  else if (G.buildMode === 'camino') hint = 'Toca uno de los caminos marcados. Toca el botón otra vez para cancelar.';
  else if (G.buildMode === 'pueblo') hint = 'Toca uno de los puntos marcados para fundar tu pueblo.';
  else if (G.buildMode === 'ciudad') hint = 'Toca uno de tus pueblos marcados para convertirlo en ciudad.';
  $('#hint').textContent = hint;
  updateHexbar(); renderFan(); if (HL.kind) highlightPieces(HL.kind);
  $('#v-turn').style.display = (my && mode !== 'board') ? 'block' : 'none';
  $('#v-turn .vt').textContent = G.phase === 'main' ? 'Es tu turno: puedes terminarlo aquí o volver al tablero' : 'Es tu turno: vuelve al tablero para jugar';
}

const markerMat = new THREE.MeshBasicMaterial({ color:0xffffff, transparent:true, opacity:.7 });
function exitBuild(){ if (G){ G.buildMode = null; if (G.tokenRoad){ G.tokenRoad = false; G.freeRoads = 0; } } if (markers){ boardScene.remove(markers); markers.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); markers = null; } }
function enterBuild(kind){
  if (G.buildMode === kind){ exitBuild(); refresh(); return; }
  exitBuild(); hidePopup(); G.buildMode = kind;
  markers = new THREE.Group();
  if (kind === 'camino') tutRoadOnly(validRoads(0)).forEach(e => {
    const a = G.verts[e.a], b = G.verts[e.b];
    const m = new THREE.Mesh(new THREE.BoxGeometry(.55,.07,.16), markerMat);
    m.position.set((a.x+b.x)/2, .25, (a.z+b.z)/2); m.rotation.y = Math.atan2(-(b.z-a.z), b.x-a.x); m.userData.markE = e.id; markers.add(m);
  });
  else (kind === 'pueblo' ? validSettlements(0) : validCities(0)).forEach(v => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(kind === 'pueblo' ? .12 : .2, 16, 12), markerMat);
    m.position.set(v.x, kind === 'pueblo' ? .32 : .35, v.z); m.userData.markV = v.id; markers.add(m);
  });
  boardScene.add(markers); refresh();
}
function prodChips(v){
  return v.tiles.map(ti => { const t = G.tiles[ti]; return `<span class="chip">${TERRAIN_ICON[t.type]} ${tileName(t)}</span>`; }).join('') + (v.port ? `<span class="chip">⚓ Puerto ${v.port === '3:1' ? '3:1' : '2:1 ' + resImg(v.port)}</span>` : '') + (v.building ? `<span class="chip">🛤️ ${connCount(v.id) ? 'Conectado con ' + connCount(v.id) : 'Sin conexión'}</span>` : '');
}
function ownerLabel(v){
  const b = v.building, P = G.players[b.p], city = b.type === 'ciudad';
  return b.p === 0 ? (city ? 'Tu ciudad' : 'Tu pueblo') : `${city ? 'Ciudad' : 'Pueblo'} de ${P.name}`;
}
function showPopup(vid, cx, cy){
  const v = G.verts[vid], P = G.players[v.building.p], el = $('#popup');
  el.innerHTML = deEmo(`<div class="pp-title">${v.name}</div><div class="pp-sub"><i style="background:${P.color}"></i>${ownerLabel(v)}</div><div class="pp-prod">${prodChips(v)}</div><button class="primary" id="pp-enter">👁️ Entrar en primera persona</button>`);
  el.style.display = 'block';
  const w = el.offsetWidth, h = el.offsetHeight;
  el.style.left = clamp(cx + 14, 8, innerWidth - w - 8) + 'px';
  el.style.top = clamp(cy - h/2, 60, innerHeight - h - 8) + 'px';
  $('#pp-enter').onclick = () => enterVillage(vid);
}
function hidePopup(){ $('#popup').style.display = 'none'; }

const modal = $('#modal'), modalBody = $('#modal-body');
function openModal(html, dismissable=true){ modalBody.innerHTML = deEmo(html); modal.classList.remove('hidden'); modal.dataset.dismiss = dismissable ? '1' : ''; }
function closeModal(){ modal.classList.add('hidden'); modalBody.onclick = null; }
modal.addEventListener('click', e => { if (e.target === modal && modal.dataset.dismiss) closeModal(); });

function victoryFireworks(p){
  if (!boardScene) return; const P = G.players[p], vs = G.verts.filter(v => v.building && v.building.p === p);
  for (let wave=0; wave<6; wave++) setTimeout(() => { if (!boardScene) return; vs.forEach((v, i) => { if (Math.random() < .8) celebrate(boardScene, v.x, .3, v.z, 1, P.color, v.building.city ? 3 : 2); }); if (wave % 2 === 0) SFX.boom?.(); }, wave*1100 + Math.random()*200);
}
function showWin(p){
  SFX.win(); victoryFireworks(p);
  const P = G.players[p];
  openModal(`<h2>${p === 0 ? '🏆 ¡Ganaste!' : `🏆 Ganó ${P.name}`}</h2><p>${p === 0 ? 'Llegaste' : 'Llegó'} a <b>${vp(p)} puntos</b>.</p>
  <ul>${G.players.map((Q,i) => `<li><span style="color:${Q.color}">●</span> ${Q.name}: ${vp(i)} PV (${Q.pueblos} pueblos, ${Q.ciudades} ciudades)</li>`).join('')}</ul>
  <div class="row end"><button class="primary" id="b-new">Nueva partida</button></div>`, false);
  if (NG.on){ $('#b-new').textContent = 'Volver al menú'; $('#b-new').onclick = async () => { closeModal(); if (NG.seat === 0) netSend({ t: 'bye' }); await netLeave(); netReset(); newGame(); openMainMenu(); }; }
  else $('#b-new').onclick = () => { closeModal(); newGame(); startRegistration(); };
  if (TUT.on) $('#b-new').style.display = 'none';   // the tutorial ends with Nándor's own buttons
  notify(`🏆 <b>${p === 0 ? '¡Ganaste la partida!' : P.name + ' ganó la partida'}</b>`, P.color);
}

