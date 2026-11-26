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
  // several at once: each tap on your side adds one lot of that resource, each tap on the trader's side asks for one more;
  // going past what you can afford (or past the lots you give) wraps back to none
  const S = C.sel, r = it.r;
  if (it.type === 'give'){ const k = tradeRate(0, r), n = (S.give[r] || 0) + 1;
    if (!S.give[r] && P.res[r] < k){ mkSay(`Necesitas <b>${k}</b> ${resImg(r)} para eso.`); SFX.click?.(); return; }
    if (n*k > P.res[r]) delete S.give[r]; else { S.give[r] = n; delete S.want[r]; } }
  else { const lots = mkLots(S.give), others = mkCount(S.want) - (S.want[r] || 0), n = (S.want[r] || 0) + 1;
    if (others + n > Math.max(1, lots)) delete S.want[r]; else { S.want[r] = n; delete S.give[r]; } }
  SFX.click?.(); markSel();
}
const mkCount = o => Object.values(o).reduce((a, n) => a + n, 0), mkLots = mkCount;
const mkGiveCards = give => Object.fromEntries(Object.entries(give).map(([r, n]) => [r, n*tradeRate(0, r)]));
const mkIsSel = (C, i) => (i.type === 'give' && C.sel.give[i.r] > 0) || (i.type === 'want' && C.sel.want[i.r] > 0);
function markSel(){
  const C = marketCtx; C.items.forEach(i => { if (i.glow){ i.glow.forEach(g => g.parent && g.parent.remove(g)); i.glow = null; } });
  C.items.filter(i => mkIsSel(C, i)).forEach(i => { const M = contourMats(i.type === 'give' ? 0xf0c050 : 0x7ad07a); i.glow = []; i.obj.traverse(o => { if (o.isMesh && !o.userData.outline){ const h = new THREE.Mesh(o.geometry, M.glow); h.userData.outline = true; h.raycast = () => {}; o.add(h); i.glow.push(h); } }); });
  const lots = mkLots(C.sel.give), wants = mkCount(C.sel.want);
  if (lots && wants) mkSay(lots === wants ? `Das ${resList(mkGiveCards(C.sel.give))} y recibes ${resList(C.sel.want)}. <b>Toca la campana.</b>`
    : `Das para <b>${lots}</b> y pides <b>${wants}</b>: ${lots > wants ? 'pide más de mi lado (derecha)' : 'agrega más de tu lado (izquierda)'}.`);
  else if (lots) mkSay(`Das ${resList(mkGiveCards(C.sel.give))}. Ahora elige <b>${lots}</b> de mi lado. <small>Toca varias veces para más.</small>`);
}
function ringBell(){
  const C = marketCtx, P = G.players[0]; SFX.bell?.(); C.bellT = 0;
  const lots = mkLots(C.sel.give), wants = mkCount(C.sel.want);
  if (!lots || !wants){ mkSay('Primero elige qué das <b>(izquierda)</b> y qué quieres <b>(derecha)</b>.'); return; }
  if (lots !== wants){ markSel(); return; }
  const cards = mkGiveCards(C.sel.give);
  if (Object.entries(cards).some(([r, n]) => P.res[r] < n)){ mkSay('No te alcanza para ese trato.'); return; }
  C.busy = true;
  if (P.buffs && P.buffs.halfTrade){ P.buffs.halfTrade = false; notify('Usaste tu descuento: mitad de precio en el mercado', P.color, 'sys'); }
  Object.entries(cards).forEach(([r, n]) => P.res[r] -= n); Object.entries(C.sel.want).forEach(([r, n]) => P.res[r] += n);
  const toks = Object.entries(C.sel.want).flatMap(([r, n]) => Array.from({ length: n }, () => ({ r, tok: invExpect(r, 1) }))); refresh();
  // the cards slide over as one heap (a few per kind are enough to read it), the goods come back side by side
  const y = C.TOP, copies = [], shown = Object.entries(cards).flatMap(([r, n]) => Array(Math.min(n, 4)).fill(r)), k = shown.length, gap = k > 8 ? .11 : .17;
  shown.forEach((r, j) => { const c = makeResourceItem(r); c.scale.setScalar(.36); c.position.set(-.5 + j*gap - k*gap/2, y, .75); c.rotation.y = .3; C.sc.add(c); copies.push(c); });
  const gots = toks.map((o, j) => { const g = makeResourceItem(o.r); g.scale.setScalar(.42); g.userData.dx = (j - (toks.length - 1)/2)*.24; g.position.set(.4 + g.userData.dx, y, -.75); C.sc.add(g); return g; });
  const H = C.myHand; H.visible = true; C.npcHand.visible = false;   // the trader hands it over with his own arm
  C.anim = { t: 0, copies, gots, toks, k, gap };
  C.sel = { give: {}, want: {} }; markSel();
  mkSay(pick(['Mmm… trato hecho.', 'Un buen intercambio, viajero.', 'Je, je… no se arrepentirá.']));
}
function updateMarket(dt, t){
  const C = marketCtx; if (!C) return; C.t += dt;
  if (C.alley) return updateAlley(C, dt, t);
  if (C.courier) return updateCourier(C, dt, t);
  if (C.office) return updateOffice(C, dt, t);
  if (C.pier) return updatePier(C, dt, t);
  // the trader: waves when you come in, rubs his chin while you choose, smiles when the deal adds up, reaches out to give
  { const n = C.npc, A0 = C.anim, lots = mkLots(C.sel.give), wants = mkCount(C.sel.want), act = n.act || (n.act = { kind: 'idle', t: 0 }); act.t += dt;
    let kind = A0 ? 'give' : act.kind === 'wave' && act.t < 2.2 ? 'wave' : act.kind === 'wink' && act.t < 1.6 ? 'wink' : (lots || wants) ? (lots === wants ? 'happy' : 'think') : 'idle';
    if (kind !== act.kind){ act.kind = kind; act.t = 0; }
    setFaceExpr(n, { wave: 'risa', give: 'risa', wink: 'guiño', happy: 'sonrisa', think: 'duda', idle: Math.sin(t*.13) > .7 ? 'serio' : 'sonrisa' }[kind]);
    let ax = 0, az = 0, ex = -.15, lx = 0, lex = -.15;
    if (kind === 'wave'){ ax = -2.5; az = -.2; ex = -.35 - Math.abs(Math.sin(t*9))*.55; }
    else if (kind === 'think'){ ax = -1.75; az = .35; ex = -2.25; lx = -.5; lex = -1.3; }   // hand on the chin, the other arm folded
    else if (kind === 'happy'){ lx = -.35; lex = -.9; ax = -.35; ex = -.9; }
    else if (kind === 'give'){ const k = clamp((A0.t - .9)/.5, 0, 1) - clamp((A0.t - 2.4)/.4, 0, 1); ax = -1.35*k; ex = -.25*k - .15; }
    const e = Math.min(1, dt*7); n.armR.rotation.x += (ax - n.armR.rotation.x)*e; n.armR.rotation.z += (az - n.armR.rotation.z)*e; n.elbowR.rotation.x += (ex - n.elbowR.rotation.x)*e;
    n.armL.rotation.x += (lx - n.armL.rotation.x)*e; n.elbowL.rotation.x += (lex - n.elbowL.rotation.x)*e;
    n.head.rotation.y = Math.sin(t*.6)*.15*(kind === 'idle' ? 1 : .3); n.head.rotation.x = (kind === 'think' ? .12 : -.08) + Math.sin(t*.9)*.03; n.g.position.y = Math.sin(t*1.6)*.01; }
  // hovered item lifts a bit, selected ones float
  C.items.forEach(i => { if (i.type === 'bell') return; const sel = mkIsSel(C, i), hov = C.hover === i; const ty = C.TOP + (sel ? .12 + Math.sin(t*3)*.02 : hov ? .05 : 0); i.obj.position.y += (ty - i.obj.position.y)*Math.min(1, dt*10); i.obj.rotation.y = sel ? i.obj.rotation.y + dt*1.5 : i.rot; i.obj.rotation.z = sel ? .3 : 0; });
  if (C.bell && C.bellT !== undefined){ C.bellT += dt; C.bell.userData.bell.rotation.z = Math.sin(C.bellT*28)*.35*Math.max(0, 1 - C.bellT/.8); }
  // trade: my hand slides the copies over, the npc slides the wanted item back
  const A = C.anim;
  if (A){
    A.t += dt; const T = A.t, y = C.TOP, ez = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
    const k1 = ez(clamp((T - .2)/1.1, 0, 1)), k2 = ez(clamp((T - 1.0)/1.1, 0, 1)), k3 = ez(clamp((T - 2.2)/.6, 0, 1)), kr = ez(clamp((T - 1.4)/.5, 0, 1));
    A.copies.forEach((c, j) => { c.position.z = .75 - k1*1.25 - k3*.9; c.position.x = -.5 + j*A.gap - A.k*A.gap/2; c.position.y = y; c.visible = k3 < .98; });
    C.myHand.position.set(-.5, y + .06, .98 - k1*1.25 + kr*1.6); C.myHand.visible = T < 2.2;
    A.gots.forEach(g => g.position.set(.4 + g.userData.dx, y, -.75 + k2*1.35));
    if (T > 2.9 && !A.flown){ A.flown = true; A.gots.forEach((g, j) => { const [sx, sy] = toScreen(g.position.clone().setY(y + .1)); g.visible = false; flyToInventory(A.toks[j].tok, sx, sy, j*.08); }); C.npcHand.visible = false; A.copies.forEach(c => C.sc.remove(c)); }
    if (T > 3.2){ A.gots.forEach(g => C.sc.remove(g)); C.anim = null; C.npc.act = { kind: 'wink', t: 0 }; C.busy = false; C.items.filter(i => i.type === 'give').forEach(i => { i.tag.material[2].map = engraveTex(tradeRate(0, i.r) + ':1', 24, 14, 10, { light: true }); i.tag.material[2].needsUpdate = true; }); mkSay('¿Algo más, viajero? Si no, puedes <b>salir</b>.'); }
  }
}

