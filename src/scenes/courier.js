function buildCourier(opts){
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x9cc0de); sc.fog = new THREE.Fog(0x9cc0de, 16, 46);
  const prevGH = GH, prevColl = CUR_COLL; GH = () => 0; CUR_COLL = [];
  const rng = mulberry32(57 + (G.turnId || 0)*3), Q = G.players[opts.q];
  sc.add(new THREE.HemisphereLight(0xdfeeff, 0x4a5a32, 1.05));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.6); sun.position.set(-6, 10, 5); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 10, bottom: -10 }); sc.add(sun);
  sc.add(lowpolyGround(new THREE.PlaneGeometry(44, 70, 30, 46).rotateX(-Math.PI/2).translate(0, 0, -20), (x, z) => Math.abs(x) < 1.6 ? 0 : (fbm(x*.15, z*.15, 3) - .4)*Math.min(1, (Math.abs(x) - 1.6)*.3)*2.2,
    (x, y, z, r) => Math.abs(x + Math.sin(z*.2)*.3) < 1.25 ? jc(r < .5 ? 0x9a7a52 : 0x8a6a46, r, .12) : jc(r < .5 ? 0x5e8a3a : 0x52803a, r, .14), .3, 23));
  for (let z = 5; z > -40; z -= 2.4) [-1.75, 1.75].forEach(x => { if (rng() < .85){ sc.add(mesh(GEO.box, 0x7a5636, x, 0, z, .09, .62, .09)); sc.add(mesh(GEO.box, 0x8a6a46, x, .42, z - 1.2, .05, .07, 2.4)); } });
  [[-4.5, -2, 1.2], [5, -6, 1.4], [-6, -12, 1.5], [4.2, 2.5, 1.1], [-3.6, -20, 1.3], [6.5, -17, 1.6], [-7, 3, 1.2]].forEach(([x, z, s]) => leafTree(sc, x, z, s, rng));
  [[3, -1, .8], [-2.8, 1.5, .7], [3.4, -9, .9], [-3.2, -8, .8]].forEach(([x, z, s]) => bush(sc, x, z, s, rng));
  miniHouse(sc, -6.2, -5.5, 2.6, 2.2, 2.1, Math.PI/2, 0x9a3a2a, 0xe8dcc0, rng);
  miniHouse(sc, 6.4, -10, 2.4, 2.2, 2, -Math.PI/2, 0x7a4a30, 0xe8dcc0, rng);
  const sign = signMesh(Q.name, 90, 22, 15); sign.scale.set(1.1, .3, .05); sign.position.set(2.2, 1.35, -3.5); sign.rotation.y = -.5; sc.add(sign); sc.add(mesh(GEO.box, 0x6a4a2c, 2.2, 0, -3.56, .08, 1.3, .08));
  const R = riderModel(Q.color, rng); R.g.position.set(0, 0, -24); sc.add(R.g);
  const myHand = handModel(G.players[0].color, true); myHand.visible = false; sc.add(myHand);
  const ctx = { sc, kind: 'courier', courier: true, npc: R.rider, R, myHand, items: [], t: 0, sel: { give: null, want: null }, busy: true, opts, hover: null, TOP: 0, ph: 'arrive', pt: 0, q: opts.q,
    cam0: [[2.4, 1.7, 8.2], [0, 1.6, -4]] };
  GH = prevGH; CUR_COLL = prevColl;
  return ctx;
}
function courierClick(it){
  const C = marketCtx; if (!C || !it) return;
  if (C.ph === 'ask' && it.type === 'mine'){ C.ph = 'give'; C.pt = 0; C.ready = false; C.items = []; SFX.click?.(); }
  else if (C.ph === 'present' && it.type === 'theirs'){ C.ph = 'take'; C.pt = 0; C.ready = false; C.items = []; SFX.click?.(); }
}
function courierItems(obj){ const list = Object.entries(obj).filter(([, n]) => n > 0).flatMap(([k, n]) => Array.from({ length: n }, () => k)); return list.slice(0, 8); }
function updateCourier(C, dt, t){
  const R = C.R, rd = R.rider, O = C.opts, Q = G.players[C.q]; C.pt += dt;
  const arm = (z, x, k) => { rd.armR.rotation.z += (z - rd.armR.rotation.z)*Math.min(1, dt*k); rd.armR.rotation.x += (x - rd.armR.rotation.x)*Math.min(1, dt*k); rd.elbowR.rotation.x += ((z > .3 ? -.25 : -.2) - rd.elbowR.rotation.x)*Math.min(1, dt*k); };
  const still = () => { gallop(R, R.ph = (R.ph || 0) + dt*2, .04); rd.head.rotation.y += (.9 - rd.head.rotation.y)*Math.min(1, dt*4); };
  const handW = () => { R.g.updateMatrixWorld(true); return R.hand.getWorldPosition(new THREE.Vector3()); };
  switch (C.ph){
    case 'arrive': {
      const T = 2.6, k = Math.min(1, C.pt/T); R.g.rotation.y = 0;
      R.g.position.z = -24 + 24*(1 - Math.pow(1 - k, 2.3)); R.ph = (R.ph || 0) + dt*15*(1 - k*.75); gallop(R, R.ph, .62*(1 - k) + .08); rd.head.rotation.y *= .9;
      if (C.pt % .22 < dt && k < .9) SFX.hoof?.(1 - k);
      if (k >= 1){ C.ph = 'turnS'; C.pt = 0; tweenCam(new THREE.Vector3(.3, 1.72, 3.2), new THREE.Vector3(0, 1.42, 0), 1100); }
      break; }
    case 'turnS': {
      const k = ez2(Math.min(1, C.pt/.6)); R.g.rotation.y = -Math.PI/2*k; gallop(R, R.ph += dt*5, .15*(1 - k) + .04);
      if (C.pt >= .6){ C.ph = 'present'; C.pt = 0;
        C.theirs = courierItems(O.want).map((k, j, a) => { const it = itemOf(k); it.scale.setScalar(.26); R.hand.add(it); it.position.set((j - (a.length - 1)/2)*.11, -.03, .08 + (j % 2)*.03); it.traverse(o => { if (o.isMesh) o.userData.mk = { type: 'theirs' }; }); return it; });
        mkSay(`${nameTag(Q.name, Q.color)} te manda ${resList(O.want)}.`, 2500); }
      break; }
    case 'present': still(); arm(.85, -.55, 5);
      if (C.pt > 1.1){ C.ph = 'take'; C.pt = 0; }
      C.theirs.forEach((o, j) => o.rotation.y += dt*(.9 + j*.1)); break;
    case 'take': {   // both sides receive at the same time
      still(); arm(.85, -.55, 4);
      if (!C.flown){ C.flown = true; C.sc.updateMatrixWorld(true); doTrade(0, C.q, O.give, O.want);
        const keys = courierItems(O.want), toks = {}; RES.forEach(r => { if (O.want[r]) toks[r] = invExpect(r, O.want[r], 6000); });
        let tk = 0; C.theirs.forEach((o, j) => { const w = o.getWorldPosition(new THREE.Vector3()), [sx, sy] = toScreen(w), key = keys[j]; if (toks[key]) flyToInventory(toks[key], sx, sy, tk++*.12); o.visible = false; });
        refresh(); SFX.trade?.(); }
      if (C.pt > .9){ C.ph = 'stow'; C.pt = 0; C.mine = []; mkSay(pick(['¡Trato cumplido! Buen día.', 'Un placer servir a ambos.', '¡Que la fortuna te acompañe!']), 2500); }
      if (false){
        const H = C.myHand, hw = handW(); H.visible = true; H.position.set(hw.x + .22, hw.y - .28, hw.z + .95); H.rotation.set(0, .3, 0); H.scale.setScalar(.75); C.handHome = H.position.clone();
        C.mine = courierItems(O.give).map((k, j, a) => { const it = itemOf(k); it.scale.setScalar(.26); it.position.set(H.position.x + (j - (a.length - 1)/2)*.11, H.position.y + .05 + (j % 2)*.03, H.position.z - .06); C.sc.add(it); it.traverse(o => { if (o.isMesh) o.userData.mk = { type: 'mine' }; }); return it; });
        C.items = C.mine.map(o => ({ obj: o, type: 'mine' })); C.ready = true; C.busy = false;
        mkSay(`Ahora lo acordado: ${resList(O.give)}. <b>Toca tu mano</b> para entregarlo.`); }
      break; }
    case 'ask': still(); arm(.85, -.55, 5); C.mine.forEach((o, j) => o.rotation.y += dt*(.8 + j*.1)); C.myHand.position.y = C.handHome.y + Math.sin(t*2)*.01; break;
    case 'give': {
      still(); arm(.85, -.55, 5);
      const hw = handW(), k = ez2(Math.min(1, C.pt/.6)), H = C.myHand, tgt = hw.clone().add(new THREE.Vector3(.02, -.1, .12));
      if (!C.handed){ H.position.lerpVectors(C.handHome, tgt, k); C.mine.forEach((o, j, a) => o.position.set(H.position.x + (j - (a.length - 1)/2)*.11, H.position.y + .05 + (j % 2)*.03, H.position.z - .06)); }
      if (C.pt >= .62 && !C.handed){ C.handed = true; C.mine.forEach(o => R.hand.attach(o)); SFX.pick?.(); }
      if (C.handed){ const k2 = ez2(Math.min(1, (C.pt - .62)/.4)); H.position.lerpVectors(tgt, C.handHome.clone().add(new THREE.Vector3(.3, -.5, .4)), k2); if (k2 >= 1){ H.visible = false; C.ph = 'stow'; C.pt = 0; mkSay(pick(['¡Trato cumplido! Buen día.', 'Un placer servir a ambos.', '¡Que la fortuna te acompañe!'])); } }
      break; }
    case 'stow': still(); arm(0, 0, 4); C.mine.forEach(o => o.scale.multiplyScalar(Math.max(0, 1 - dt*5)));
      if (C.pt > .6){ C.mine.forEach(o => o.parent && o.parent.remove(o)); C.ph = 'turnAway'; C.pt = 0; } break;
    case 'turnAway': { const k = ez2(Math.min(1, C.pt/.55)); R.g.rotation.y = -Math.PI/2 - Math.PI/2*k; gallop(R, R.ph += dt*6, .2); rd.head.rotation.y *= .9; if (C.pt >= .55){ C.ph = 'leave'; C.pt = 0; } break; }
    case 'leave': {
      const k = Math.min(1, C.pt/1.8); R.g.position.z = -26*Math.pow(k, 1.6); R.ph += dt*15*Math.min(1, .3 + k*2); gallop(R, R.ph, .62);
      if (C.pt % .22 < dt) SFX.hoof?.(1 - k);
      if (k >= 1 && !C.fin){ C.fin = true; (async () => { const d = C.done; C.done = null; notify(`Trueque con ${Q.name}: diste ${resList(O.give)} y recibiste ${resList(O.want)}`, G.players[0].color); await exitMarket(); d && d(true); })(); }
      break; }
  }
}
function courierScene(q, give, want){
  return new Promise(async res => {
    if (!scenesOn() || mode !== 'board' || busy || marketCtx){ doTrade(0, q, give, want); refresh(); res(false); return; }
    await enterMarket('courier', { q, give, want });
    if (marketCtx && marketCtx.courier) marketCtx.done = res; else { doTrade(0, q, give, want); refresh(); res(false); }
  });
}

