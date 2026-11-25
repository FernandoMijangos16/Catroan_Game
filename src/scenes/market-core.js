function mkSay(txt, ms = 4500){ sysNote(txt, { ms: ms || 0 }); if (marketCtx && marketCtx.npc) SFX.talk?.(marketCtx.npc); }
const mkHush = () => pbHide(PB.note);
function mkUI(kind){
  const ui = $('#mk-ui');
  ui.innerHTML = kind === 'thief' ? `<div class="mk-need"></div>` : kind === 'pier' ? `<button id="mk-exit">◀ Volver al tablero</button><div class="mk-need"></div>` : kind === 'courier' || kind === 'office' ? '' : `<button id="mk-exit">◀ Salir del mercado</button><span class="mk-hint">Para cambiar con jugadores, toca su letrero</span>`;
  if (kind === 'trade' || kind === 'pier') $('#mk-exit').onclick = () => { const C = marketCtx; if (!C || C.throwing || C.ph === 'catch') return; if (C.pier && C.ph === 'pay' && C.paid){ G.players[0].res[C.giveR] += C.paid; C.paid = 0; refresh(); } exitMarket(); };
}
async function enterMarket(kind = 'trade', opts){
  if (busy || marketCtx) return;
  busy = true; hidePopup(); exitBuild();
  if (!savedMarketCam) savedMarketCam = { pos: camera.position.clone(), target: controls.target.clone(), fov: camera.fov };
  await fade(1, 320);
  OUTLINE_OFF = true;
  marketCtx = kind === 'thief' ? buildAlley(opts) : kind === 'courier' ? buildCourier(opts) : kind === 'office' ? buildOffice(opts) : kind === 'pier' ? buildPier(opts) : buildMarket(kind, opts);
  mode = 'market'; document.body.dataset.mode = 'market'; controls.enabled = false;
  const c0 = marketCtx.cam0 || [[0, 2.25, 5.6], [0, 1.5, -.3]];
  camera.fov = marketCtx.fov || 50; camera.updateProjectionMatrix(); camera.position.set(...c0[0]); controls.target.set(...c0[1]); camera.lookAt(controls.target);
  mkUI(kind); if (marketCtx.office) officeStart(marketCtx); refresh();
  await fade(0, 380); busy = false;
  if (marketCtx && marketCtx.pier) tweenCam(marketCtx.camP.clone(), new THREE.Vector3(0, 2.0, -12), 2300);
  if (marketCtx && marketCtx.cam0) return;   // alley / courier / office / pier scenes drive themselves
  mkSay(kind === 'thief' ? `<b>¡Alto ahí, viajero!</b> Dame la mitad de lo que cargas: <b>${opts.need}</b> recursos. Sin trucos…` : '<b>Bienvenido, viajero…</b> Pon en la mesa lo que das y lo que quieres. Luego toca la campana.');
  await tweenCam(new THREE.Vector3(0, 2.35, 2.6), new THREE.Vector3(0, 1.22, -.5), 1300);
  if (marketCtx) marketCtx.ready = true;
}
let savedMarketCam = null;
async function exitMarket(){
  if (!marketCtx || busy) return;
  busy = true; await fade(1, 320);
  disposeScene(marketCtx.sc); const res = marketCtx.done; marketCtx = null; OUTLINE_OFF = false; closeDrawer();
  $('#mk-ui').innerHTML = ''; $('#mk-say').classList.remove('in');
  const s = savedMarketCam; savedMarketCam = null;
  camera.fov = s ? s.fov : 45; camera.updateProjectionMatrix(); if (s){ camera.position.copy(s.pos); controls.target.copy(s.target); }
  mode = 'board'; document.body.dataset.mode = 'board'; controls.enabled = true; controls.update(); refresh();
  await fade(0, 380); busy = false;
  if (res) res();
}
function thiefScene(need){ if (!scenesOn()) return simpleDiscard(need); return new Promise(async res => { await enterMarket('thief', { need }); if (marketCtx) marketCtx.done = res; else res(); }); }
function mkPick(e){
  const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left)/r.width)*2 - 1, -((e.clientY - r.top)/r.height)*2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(marketCtx.items.map(i => i.obj), true)[0];
  return hit ? marketCtx.items.find(i => { let o = hit.object; while (o){ if (o === i.obj) return true; o = o.parent; } return false; }) : null;
}
function marketHover(e){ if (!marketCtx || !marketCtx.ready) return; const it = mkPick(e); marketCtx.hover = it; canvas.style.cursor = it ? 'pointer' : 'default'; }
function marketClick(e){
  const C = marketCtx; if (!C || !C.ready || C.busy) return;
  const it = mkPick(e); if (!it){ if (C.office) closeDrawer(); return; }
  if (C.alley) return;   // the thief takes what you tap in the bar
  if (C.courier){ courierClick(it); return; }
  if (C.office){ officeClick(it); return; }
  if (C.pier){ pierClick(it); return; }
  if (it.type === 'bell'){ ringBell(); return; }
  const P = G.players[0];
  if ((it.type === 'give' || it.type === 'want') && tradeBlocked(0, it.r)){ mkSay(`Hay ${AMULETS[G.players[0].fx.plague.k].name.toLowerCase()} en tus tierras: hoy no puedo cambiar ${RES_NAME[it.r].toLowerCase()}.`); return; }
  if (it.type === 'give'){ if (P.res[it.r] < tradeRate(0, it.r)){ mkSay(`Necesitas <b>${tradeRate(0, it.r)}</b> ${resImg(it.r)} para eso.`); SFX.click?.(); return; } C.sel.give = C.sel.give === it ? null : it; if (C.sel.want && C.sel.want.r === it.r) C.sel.want = null; }
  else { C.sel.want = C.sel.want === it ? null : it; if (C.sel.give && C.sel.give.r === it.r) C.sel.give = null; }
  SFX.click?.(); markSel();
}
function markSel(){
  const C = marketCtx; C.items.forEach(i => { if (i.glow){ i.glow.forEach(g => g.parent && g.parent.remove(g)); i.glow = null; } });
  [['give', 0xf0c050], ['want', 0x7ad07a]].forEach(([k, col]) => { const i = C.sel[k]; if (!i) return; const M = contourMats(col); i.glow = []; i.obj.traverse(o => { if (o.isMesh && !o.userData.outline){ const h = new THREE.Mesh(o.geometry, M.glow); h.userData.outline = true; h.raycast = () => {}; o.add(h); i.glow.push(h); } }); });
  if (C.sel.give && C.sel.want) mkSay(`Das <b>${tradeRate(0, C.sel.give.r)}</b> ${resImg(C.sel.give.r)} y recibes <b>1</b> ${resImg(C.sel.want.r)}. <b>Toca la campana.</b>`);
}
function ringBell(){
  const C = marketCtx, P = G.players[0]; SFX.bell?.(); C.bellT = 0;
  if (!C.sel.give || !C.sel.want){ mkSay('Primero elige qué das <b>(izquierda)</b> y qué quieres <b>(derecha)</b>.'); return; }
  const give = C.sel.give.r, want = C.sel.want.r, k = tradeRate(0, give);
  if (P.res[give] < k){ mkSay('No te alcanza para ese trato.'); return; }
  C.busy = true;
  if (P.buffs && P.buffs.halfTrade){ P.buffs.halfTrade = false; notify('Usaste tu descuento: mitad de precio en el mercado', P.color, 'sys'); }
  P.res[give] -= k; P.res[want] += 1; const tok = invExpect(want, 1); refresh();
  const y = C.TOP, copies = [];
  for (let j=0;j<k;j++){ const c = makeResourceItem(give); c.scale.setScalar(.36); c.position.set(-.5 + j*.17 - k*.085, y, .75); c.rotation.y = .3; C.sc.add(c); copies.push(c); }
  const got = makeResourceItem(want); got.scale.setScalar(.42); got.position.set(.4, y, -.75); C.sc.add(got);
  const H = C.myHand, N = C.npcHand; H.visible = true; N.visible = true;
  C.anim = { t: 0, copies, got, tok, give, want, k };
  C.sel = { give: null, want: null }; markSel();
  mkSay(pick(['Mmm… trato hecho.', 'Un buen intercambio, viajero.', 'Je, je… no se arrepentirá.']));
}
function updateMarket(dt, t){
  const C = marketCtx; if (!C) return; C.t += dt;
  if (C.alley) return updateAlley(C, dt, t);
  if (C.courier) return updateCourier(C, dt, t);
  if (C.office) return updateOffice(C, dt, t);
  if (C.pier) return updatePier(C, dt, t);
  // npc idle
  C.npc.head.rotation.y = Math.sin(t*.6)*.15; C.npc.head.rotation.x = -.08 + Math.sin(t*.9)*.03; C.npc.g.position.y = Math.sin(t*1.6)*.01;
  // hovered item lifts a bit, selected ones float
  C.items.forEach(i => { if (i.type === 'bell') return; const sel = C.sel.give === i || C.sel.want === i, hov = C.hover === i; const ty = C.TOP + (sel ? .12 + Math.sin(t*3)*.02 : hov ? .05 : 0); i.obj.position.y += (ty - i.obj.position.y)*Math.min(1, dt*10); i.obj.rotation.y = sel ? i.obj.rotation.y + dt*1.5 : i.rot; i.obj.rotation.z = sel ? .3 : 0; });
  if (C.bell && C.bellT !== undefined){ C.bellT += dt; C.bell.userData.bell.rotation.z = Math.sin(C.bellT*28)*.35*Math.max(0, 1 - C.bellT/.8); }
  // trade: my hand slides the copies over, the npc slides the wanted item back
  const A = C.anim;
  if (A){
    A.t += dt; const T = A.t, y = C.TOP, ez = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
    const k1 = ez(clamp((T - .2)/1.1, 0, 1)), k2 = ez(clamp((T - 1.0)/1.1, 0, 1)), k3 = ez(clamp((T - 2.2)/.6, 0, 1)), kr = ez(clamp((T - 1.4)/.5, 0, 1));
    A.copies.forEach((c, j) => { c.position.z = .75 - k1*1.25 - k3*.9; c.position.x = -.5 + j*.17 - A.k*.085; c.position.y = y; c.visible = k3 < .98; });
    C.myHand.position.set(-.5, y + .06, .98 - k1*1.25 + kr*1.6); C.myHand.visible = T < 2.2;
    A.got.position.set(.4, y, -.75 + k2*1.35); C.npcHand.position.set(.4, y + .06, -.98 + k2*1.35 - k3*1.6); C.npcHand.rotation.set(0, Math.PI, 0);
    if (T > 2.2 && T < 2.8){ C.npcHand.position.set(-.5, y + .06, -.72 - k3*.9); }
    if (T > 2.9 && !A.flown){ A.flown = true; const [sx, sy] = toScreen(A.got.position.clone().setY(y + .1)); A.got.visible = false; C.npcHand.visible = false; flyToInventory(A.tok, sx, sy, 0); A.copies.forEach(c => C.sc.remove(c)); }
    if (T > 3.2){ C.sc.remove(A.got); C.anim = null; C.busy = false; C.items.filter(i => i.type === 'give').forEach(i => { i.tag.material[2].map = engraveTex(tradeRate(0, i.r) + ':1', 24, 14, 10, { light: true }); i.tag.material[2].needsUpdate = true; }); mkSay('¿Algo más, viajero? Si no, puedes <b>salir</b>.'); }
  }
}

