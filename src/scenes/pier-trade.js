function bubbleTex(){ const cv = document.createElement('canvas'); cv.width = 176; cv.height = 100; const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.userData = { cv }; return t; }
// the bubble only shows numbers and an arrow; the goods are real 3D models floating inside it
function drawBubble(C){
  const t = C.bubbleT, cv = t.userData.cv, c = cv.getContext('2d'), W = cv.width, H = cv.height; c.imageSmoothingEnabled = false; c.clearRect(0, 0, W, H);
  c.fillStyle = '#1d1209'; c.fillRect(8, 6, W - 16, H - 34); c.fillRect(4, 10, W - 8, H - 42);
  c.fillStyle = '#f4ead2'; c.fillRect(11, 9, W - 22, H - 40); c.fillRect(7, 13, W - 14, H - 48);
  c.fillStyle = 'rgba(160,120,70,.18)'; for (let i=0;i<40;i++) c.fillRect(10 + hash2(i, 1, 3)*(W - 24), 10 + hash2(i, 2, 3)*(H - 44), 2, 1);
  c.fillStyle = '#1d1209'; c.beginPath(); c.moveTo(W/2 - 16, H - 29); c.lineTo(W/2, H - 4); c.lineTo(W/2 + 16, H - 29); c.fill(); c.fillStyle = '#f4ead2'; c.beginPath(); c.moveTo(W/2 - 12, H - 31); c.lineTo(W/2, H - 10); c.lineTo(W/2 + 12, H - 31); c.fill();
  const T = (txt, x, y, sz, col = '#1d1209') => { c.font = `800 ${sz}px 'Pixelify Sans', monospace`; c.fillStyle = col; c.textAlign = 'center'; c.fillText(txt, x, y); };
  T(String(C.rate), 22, 62, 30); T('→', W/2 + 2, 60, 24, '#6a4a2a'); T('1', W/2 + 24, 62, 30);
  t.needsUpdate = true;
}
function bubbleModels(C){
  const want = C.wantR, give = C.giveR || (C.port !== '3:1' ? C.port : null);
  const setSlot = (slot, r, cycle) => { const cur = slot.userData.r; if (cur === r && !cycle) return; slot.clear(); slot.userData.r = r; if (r){ const sp = spinner(makeResourceItem(r), .26); slot.add(sp); } };
  C.bSlots.forEach((s, i) => { const r = i === 0 ? give : want; s.userData.cycle = !r; if (r) setSlot(s, r); });
}
function buildPier(opts){
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x8fb4d0); sc.fog = new THREE.Fog(0x8fb4d0, 20, 70);
  const prevGH = GH, prevColl = CUR_COLL; GH = () => 0; CUR_COLL = [];
  const pt = G.ports[opts.port], type = G.tiles[pt.tile].type, rng = mulberry32(opts.port*17 + 5), A = houseAssets();
  sc.add(new THREE.HemisphereLight(0xdfeeff, 0x3a5a6a, 1.0));
  const sun = new THREE.DirectionalLight(0xfff0d0, 1.7); sun.position.set(6, 12, 4); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -10, right: 10, top: 14, bottom: -14 }); sc.add(sun);
  // sea with gentle waves
  const water = new THREE.Mesh(new THREE.PlaneGeometry(120, 120, 46, 46).rotateX(-Math.PI/2), keepMat(new THREE.MeshStandardMaterial({ color: 0x2f6f8a, roughness: .45, metalness: .1, flatShading: true, transparent: true, opacity: .93 })));
  water.position.z = -20; sc.add(water); const wp = water.geometry.attributes.position, w0 = Float32Array.from(wp.array);
  // the shore of the port's biome
  const BIO = { bosque: [0x3f6a2e, 0x4f7a34], montana: [0x7a7f88, 0x8b8f98], pradera: [0x6a9a42, 0x7aaa4a], campo: [0xb8a04a, 0xc8b05a], cerro: [0xa04a30, 0xb5573b], desierto: [0xd8c08a, 0xe2cc98] }[type] || [0x6a9a42, 0x7aaa4a];
  sc.add(lowpolyGround(new THREE.PlaneGeometry(60, 26, 30, 14).rotateX(-Math.PI/2).translate(0, 0, 16), (x, z) => Math.max(-.6, (z - 4.2)*.35 + (fbm(x*.2, z*.2, 3) - .5)*1.4 + (type === 'montana' || type === 'cerro' ? Math.max(0, Math.abs(x) - 4)*.25 : 0)), (x, y, z, r) => jc(y < .3 ? 0xd8c890 : r < .5 ? BIO[0] : BIO[1], r, .12), .3, 41));
  for (let k=0;k<14;k++){ const x = (rng() < .5 ? -1 : 1)*(4 + rng()*18), z = 8 + rng()*12;
    if (type === 'bosque') pine(sc, x, z, 1 + rng()*.6, rng);
    else if (type === 'montana') sc.add(mesh(pick(GEO.rocks, rng), pick([0x7a7f88, 0x6c727c], rng), x, 0, z, 1 + rng()*2, 1 + rng()*2.5, 1 + rng()*2));
    else if (type === 'cerro') sc.add(mesh(pick(GEO.rocks, rng), pick([0xa04a30, 0x8a3a26], rng), x, 0, z, 1 + rng()*1.5, .8 + rng()*1.5, 1 + rng()*1.5));
    else if (type === 'campo') sc.add(mesh(GEO.box, 0xd8b84a, x, 0, z, 2 + rng()*2, .5, 1.5 + rng()));
    else if (type === 'desierto') sc.add(mesh(GEO.cyl, 0x5a8a3a, x, 0, z, .18, 1 + rng(), .18));
    else leafTree(sc, x, z, 1 + rng()*.4, rng); }
  miniHouse(sc, -6.5, 7, 3, 2.4, 2.3, Math.PI*.15, 0x7a3a2a, 0xe8dcc0, rng);
  // the pier
  const stone = type === 'montana' || type === 'cerro', DY = .55;
  const plank = A.tex.plank.plain.clone(); plank.wrapS = plank.wrapT = THREE.RepeatWrapping; plank.repeat.set(1, 12); plank.needsUpdate = true;
  const deckM = stone ? stoneMat() : woodMat(type === 'desierto' ? 0xd8c08a : type === 'bosque' ? 0x7a5232 : 0xa07a4a, 11, 1, 14);
  const pier = new THREE.Mesh(GEO.box, deckM); pier.scale.set(2.2, .14, 15); pier.position.set(0, DY - .14, -.7); pier.receiveShadow = true; sc.add(pier);
  const postM = woodMat(0x5a3a20, 13, 1, 1, { algae: true });
  for (let z = 5.5; z > -8.4; z -= 1.8) [-1, 1].forEach(s => { sc.add(mesh(GEO.cyl, postM, s*1.05, -1, z, .1, DY + 1.45, .1)); sc.add(mesh(GEO.cyl14, 0x3a2414, s*1.05, DY + .44, z, .12, .04, .12)); });
  [-1, 1].forEach(s => sc.add(mesh(GEO.box, 0x6a4a2a, s*1.05, DY + .32, -1.2, .03, .03, 13.6)));
  GH = () => DY;
  [[-.7, 2.5], [-.72, 1.9], [.75, -1.5], [-.75, -5.6], [.78, 4.2]].forEach(([x, z]) => barrel(sc, x, z, rng)); crate(sc, .7, 3.2, .5, rng); crate(sc, .72, 2.7, .4, rng); crate(sc, -.75, -3, .45, rng);
  [[.65, -3.6], [-.7, .4]].forEach(([x, z]) => { const r = new THREE.Mesh(sg(new THREE.TorusGeometry(.17, .05, 4, 10)), mat(0xb09a6a)); r.rotation.x = Math.PI/2; r.position.set(x, DY + .04, z); sc.add(r); });
  sc.add(mesh(GEO.box, keepMat(new THREE.MeshStandardMaterial({ map: stripeTex('#5a5040', '#8a7a58'), roughness: 1 })), -.6, DY, 3.4, .5, .08, .6));
  // fisherman sitting at the edge with his rod over the water
  const fis = makePerson(rng, 'pescador', 'm'); fis.g.position.set(1.0, DY - .48, -2.4); fis.g.rotation.y = Math.PI/2; sc.add(fis.g);
  fis.legL.rotation.x = fis.legR.rotation.x = -1.45; fis.kneeL.rotation.x = fis.kneeR.rotation.x = 1.4; fis.armR.rotation.x = -1.0; fis.elbowR.rotation.x = -.3; fis.armL.rotation.x = -.8; fis.elbowL.rotation.x = -.6;
  // a dog sitting on the pier, a cat on a barrel
  const dog = makeAnimal('perro', rng); dog.g.position.set(-.45, DY + .06, -1.2); dog.g.rotation.set(-.38, -.6, 0); dog.legs.forEach((l, i) => { if (i < 2){ l.rotation.x = -1.2; if (l.knee) l.knee.rotation.x = 1.6; } }); sc.add(dog.g);
  const cat = makeAnimal('gato', rng); cat.g.position.set(.78, DY + .04, -7.4); cat.g.rotation.set(-.4, -2.6, 0); cat.legs.forEach((l, i) => { if (i < 2){ l.rotation.x = -1.2; if (l.knee) l.knee.rotation.x = 1.6; } }); sc.add(cat.g);
  GH = () => 0;
  [[1.05, 1], [-1.05, -3.5]].forEach(([x, z]) => { sc.add(mesh(GEO.box, 0x2a1e14, x, DY, z, .06, 1.6, .06)); sc.add(mesh(GEO.box, LAMP_MAT, x, DY + 1.5, z, .18, .22, .18)); });
  // the ship, bow toward the pier
  const ship = shipModel(rng); ship.position.set(.2, -.35, -11.4); sc.add(ship);
  const pir = pirateModel(rng); pir.g.position.set(0, 1.06, 2.55); pir.g.rotation.y = 0; ship.add(pir.g);
  // speech bubble
  const bubbleT = bubbleTex(); const bubble = new THREE.Mesh(sg(new THREE.PlaneGeometry(1, 1)), keepMat(new THREE.MeshBasicMaterial({ map: bubbleT, transparent: true }))); bubble.scale.set(1.25, .71, 1); bubble.position.set(.2, 2.92, -8.75); bubble.visible = false; sc.add(bubble);
  const bSlots = [[-.2], [.42]].map(([x]) => { const g = new THREE.Group(); g.position.set(.2 + x, 2.97, -8.68); g.visible = false; sc.add(g); return g; });
  // your tray at the end of the pier
  const camP = new THREE.Vector3(0, 2.2, -5.0), tw = hmat('mkplank', () => new THREE.MeshStandardMaterial({ map: A.tex.plank.plain, color: 0xb08a60, roughness: .9 }));
  const tray = new THREE.Mesh(GEO.box, tw); tray.scale.set(1.5, .035, .26); tray.position.set(0, 1.76, -5.92); tray.visible = false; sc.add(tray);
  const port = pt.type, rate = eventRate(port === '3:1' ? 3 : 2);   // the fair also lowers the 3:1 ports
  const ctx = { bSlots, fis, dog, cat, sc, kind: 'pier', pier: true, items: [], t: 0, sel: { give: null, want: null }, busy: true, opts, hover: null, TOP: 1.8, ph: 'walk', pt: 0, port, rate, ship, pirate: pir, npc: pir, bubble, bubbleT, tray, water, wp, w0, camP, thrown: [], line: '', DY,
    cam0: [[0, 2.1, 6.5], [0, 1.9, -6]] };
  GH = prevGH; CUR_COLL = prevColl;
  return ctx;
}
function pierTray(C){
  C.tray.visible = true; C.items = C.items.filter(i => i.type !== 'pay');
  (C.trayObjs || []).forEach(o => C.sc.remove(o)); C.trayObjs = [];
  RES.forEach((r, k) => { const x = -.58 + k*.29, it = makeResourceItem(r); it.scale.setScalar(.2); it.position.set(x, C.TOP, -5.95); it.rotation.y = .5; C.sc.add(it); it.traverse(o => { if (o.isMesh) o.userData.mk = { type: 'pay', r }; });
    const ok = C.port === '3:1' ? G.players[0].res[r] > 0 : G.players[0].res[r] >= C.rate && C.port === r;   // 3:1 takes mixed cards
    const tag = new THREE.Mesh(sg(new THREE.PlaneGeometry(1, 1)), new THREE.MeshBasicMaterial({ map: engraveTex(String(G.players[0].res[r]), 24, 14, 10, { light: true, num: true }), transparent: true, opacity: ok ? 1 : .45 })); tag.scale.set(.1, .06, 1); tag.position.set(x + .09, C.TOP + .04, -5.8); tag.lookAt(C.camP); C.sc.add(tag);
    C.trayObjs.push(it, tag); C.items.push({ obj: it, type: 'pay', r, tag, ok }); });
}
function pierGoods(C){
  (C.goods || []).forEach(o => o.obj.parent && o.obj.parent.remove(o.obj)); C.items = C.items.filter(i => i.type !== 'goods');
  C.goods = RES.map((r, k) => { const sp = spinner(makeResourceItem(r), .2); sp.position.set(-.8 + k*.4, 1.45, -8.2); C.sc.add(sp); sp.traverse(o => { if (o.isMesh) o.userData.mk = { type: 'goods', r }; }); const it = { obj: sp, type: 'goods', r }; C.items.push(it); return it; });
}
function pierSay(C, line, give, want){ if (give !== undefined) C.giveR = give; if (want !== undefined) C.wantR = want; drawBubble(C); bubbleModels(C); C.bubble.visible = true; C.bSlots.forEach(s => s.visible = true); SFX.talk?.(C.npc); C.nod = .5; }
function pierClick(it){
  const C = marketCtx, P = G.players[0];
  if (C.ph === 'want' && it.type === 'goods'){
    if (C.port !== '3:1' && it.r === C.port){ pierSay(C, `No te cambio ${RES_NAME[it.r].toLowerCase()} por ${RES_NAME[it.r].toLowerCase()}.`); return; }
    C.wantR = it.r; C.goods.forEach(g => { g.obj.userData.base = g.obj.userData.base || g.obj.scale.x; g.obj.scale.setScalar(g.obj.userData.base*(g === it ? 1.4 : .75)); }); SFX.click?.();
    C.ph = 'pay'; C.paid = 0; C.paidRes = {}; C.giveR = C.port === '3:1' ? null : C.port;
    pierSay(C, C.port === '3:1' ? `Echa ${C.rate} cartas de lo que quieras, pueden ser distintas.` : `Echa ${C.rate} de ${RES_NAME[C.port].toLowerCase()} al barco.`);
    $('#mk-ui .mk-need').innerHTML = `Faltan <b>${C.rate}</b>`; return; }
  if ((C.ph === 'pay' && it.type === 'pay' && tradeBlocked(0, it.r)) || (C.ph === 'want' && it.type === 'goods' && tradeBlocked(0, it.r))){ pierSay(C, ''); SFX.click?.(); return; }
  if (C.ph === 'pay' && it.type === 'pay'){
    const r = it.r;
    const mixed = C.port === '3:1';
    if (!mixed && r !== C.port){ pierSay(C, `Dije ${RES_NAME[C.port].toLowerCase()}, alcalde.`); SFX.click?.(); return; }
    if (r === C.wantR){ pierSay(C, 'Eso es lo que te voy a dar…'); return; }
    const spare = mixed ? RES.filter(x => x !== C.wantR).reduce((a, x) => a + P.res[x], 0) : P.res[r];
    if (!C.paid && spare < C.rate){ pierSay(C, `No te alcanza: necesito ${C.rate}.`); SFX.click?.(); return; }
    if (P.res[r] <= 0) return;
    C.giveR = r; C.paidRes = C.paidRes || {}; C.paidRes[r] = (C.paidRes[r] || 0) + 1; drawBubble(C); bubbleModels(C); P.res[r]--; C.paid++; refresh(); SFX.click?.();
    it.tag.material.map = engraveTex(String(P.res[r]), 24, 14, 10, { light: true, num: true }); it.tag.material.needsUpdate = true;
    const c = makeResourceItem(r); c.scale.setScalar(.2); c.position.copy(it.obj.position); C.sc.add(c);
    const to = C.pirate.elbowL.localToWorld(new THREE.Vector3(0, -.36, .06));
    C.thrown.push({ c, t: 0, from: c.position.clone(), to });
    const rest = C.rate - C.paid; $('#mk-ui .mk-need').innerHTML = rest > 0 ? `Faltan <b>${rest}</b>` : '';
    if (rest <= 0){ C.ph = 'catch'; C.pt = 0; C.ready = false; }
  }
}
function updatePier(C, dt, t){
  C.pt += dt;
  // waves and a bobbing ship
  for (let i=0;i<C.wp.count;i++){ const x = C.w0[i*3], z = C.w0[i*3 + 2]; C.wp.setY(i, Math.sin(x*.35 + t*1.3)*.08 + Math.cos(z*.3 + t*1.1)*.08); }
  C.wp.needsUpdate = true; if (C.pt % .5 < dt) C.water.geometry.computeVertexNormals();
  C.ship.position.y = -.35 + Math.sin(t*1.1)*.06; C.ship.rotation.z = Math.sin(t*.9)*.025; C.ship.rotation.x = Math.sin(t*.7)*.012;
  if (C.ship.userData.flag) C.ship.userData.flag.rotation.y = Math.PI/2 + Math.sin(t*3)*.15;
  const pr = C.pirate; pr.head.rotation.y = Math.sin(t*.5)*.12; if (pr.parrot) pr.parrot.rotation.y = Math.sin(t*1.7)*.4;
  if (C.nod > 0){ C.nod -= dt; pr.head.rotation.x = Math.sin(C.nod*14)*.08; }
  // bubble slots: spin the chosen goods, cycle through every resource while it can be "any"
  C.bSlots.forEach((s, i) => { if (s.userData.cycle){ const r = RES[Math.floor(t/.8 + i*2) % RES.length]; if (s.userData.r !== r){ s.clear(); s.userData.r = r; s.add(spinner(makeResourceItem(r), .26)); } } s.children.forEach(c => { if (c.userData.inner) c.userData.inner.rotation.y += dt*1.4; }); s.position.y = 2.97 + Math.sin(t*2 + i)*.015; });
  // little life on the pier
  if (C.fis){ C.fis.armR.rotation.x = -1.0 + Math.sin(t*.8)*.06; C.fis.head.rotation.y = Math.sin(t*.3)*.3; }
  if (C.dog && C.dog.tail) C.dog.tail.rotation.z = Math.sin(t*9)*.5;
  if (C.cat && C.cat.tail) C.cat.tail.rotation.z = Math.sin(t*1.5)*.4;
  if (!C.throwing){ pr.armR.rotation.x += (-.3 - pr.armR.rotation.x)*Math.min(1, dt*4); pr.elbowR.rotation.x += (-1.5 - pr.elbowR.rotation.x)*Math.min(1, dt*4); pr.armR.rotation.z = .5; }   // hand on hip
  (C.goods || []).forEach((g, i) => { g.obj.userData.inner.rotation.y += dt*1.2; g.obj.position.y = 1.45 + Math.sin(t*2 + i)*.03; });
  C.items.filter(i => i.type === 'pay').forEach(i => { const hov = C.hover === i; i.obj.position.y += ((C.TOP + (hov ? .06 : 0)) - i.obj.position.y)*Math.min(1, dt*10); i.obj.rotation.y += dt*(hov ? 2.5 : .6); });
  // thrown resources fly to the pirate's open hand
  C.thrown.forEach(p => { if (p.t >= 1) return; p.t = Math.min(1, p.t + dt/.6); const k = p.t; p.c.position.lerpVectors(p.from, p.to, k); p.c.position.y += Math.sin(Math.PI*k)*.9; p.c.rotation.x += dt*9; if (p.t >= 1){ C.sc.remove(p.c); SFX.pick?.(); } });
  const holdOut = () => { pr.armL.rotation.x += (-1.2 - pr.armL.rotation.x)*Math.min(1, dt*5); pr.elbowL.rotation.x += (-.3 - pr.elbowL.rotation.x)*Math.min(1, dt*5); };
  switch (C.ph){
    case 'walk': if (C.pt > 2.4){ C.ph = 'greet'; C.pt = 0; } break;
    case 'greet': if (!C.greeted){ C.greeted = true; pierSay(C, C.port === '3:1' ? `Dame ${C.rate} cartas, aunque sean distintas, y te doy 1. ¿Qué quieres?` : `Solo ${RES_NAME[C.port].toLowerCase()}: ${C.rate} por 1. ¿Qué quieres?`); pierGoods(C); pierTray(C); C.ph = 'want'; C.pt = 0; C.ready = true; C.busy = false; } break;
    case 'want': case 'pay': holdOut(); break;
    case 'catch': holdOut(); if (C.pt > .7 && C.thrown.every(p => p.t >= 1)){ C.ph = 'throwback'; C.pt = 0; C.throwing = true; pierSay(C, pick(['Trato justo. ¡Ahí va!', 'Un placer, alcalde. ¡Atrapa!', 'Palabra de marino. ¡Ahí te va!'])); } break;
    case 'throwback': {
      const k = Math.min(1, C.pt/.35); pr.armR.rotation.z = .2; pr.armR.rotation.x = -2.6 + k*1.9; pr.elbowR.rotation.x = -.4;
      if (C.pt > .3 && !C.ball){ const b = makeResourceItem(C.wantR); b.scale.setScalar(.3); C.sc.updateMatrixWorld(true); const from = pr.elbowR.localToWorld(new THREE.Vector3(0, -.36, .06)); b.position.copy(from); C.sc.add(b); C.ball = { b, from, to: new THREE.Vector3(.1, 1.95, -5.6), t: 0 }; }
      if (C.ball){ const B = C.ball; B.t = Math.min(1, B.t + dt/.8); B.b.position.lerpVectors(B.from, B.to, B.t); B.b.position.y += Math.sin(Math.PI*B.t)*1.1; B.b.rotation.y += dt*8; B.b.rotation.x += dt*5;
        if (B.t >= 1 && !C.got){ C.got = true; const P = G.players[0]; P.res[C.wantR]++; if (P.buffs && P.buffs.halfTrade){} const tok = invExpect(C.wantR, 1); const [sx, sy] = toScreen(B.b.position); B.b.visible = false; flyToInventory(tok, sx, sy, 0); refresh(); SFX.trade?.();
          notify(`Cambiaste ${resList(C.paidRes || { [C.giveR]: C.rate })} por 1 ${resImg(C.wantR)} con el pirata del puerto`, G.players[0].color); } }
      if (C.pt > 1.6){ C.throwing = false; C.sc.remove(C.ball.b); C.ball = null; C.got = false; C.thrown = [];
        const P = G.players[0], can = C.port === '3:1' ? RES.reduce((a, r) => a + P.res[r], 0) >= C.rate : P.res[C.port] >= C.rate;
        if (can){ C.ph = 'want'; C.pt = 0; C.wantR = null; C.giveR = C.port === '3:1' ? null : C.port; pierSay(C, '¿Algo más, alcalde?'); pierGoods(C); pierTray(C); C.ready = true; C.busy = false; $('#mk-ui .mk-need').innerHTML = ''; }
        else { C.ph = 'bye'; C.pt = 0; pierSay(C, 'Vuelve cuando tengas más carga. ¡Buen viento!'); } }
      break; }
    case 'bye': if (C.pt > 1.8 && !C.fin){ C.fin = true; (async () => { await exitMarket(); })(); } break;
  }
}
function pierScene(pi){
  const pt = G.ports[pi], P = G.players[0];
  const mine = [pt.a, pt.b].some(v => G.verts[v].building && G.verts[v].building.p === 0);
  if (!mine){ notify(`Para comerciar en este puerto (${pt.type === '3:1' ? '3:1' : '2:1 ' + RES_NAME[pt.type]}) necesitas un pueblo junto a él.`, P.color, 'sys'); return; }
  if (G.current !== 0 || G.phase !== 'main'){ notify('Puedes comerciar en el puerto durante tu turno, después de tirar los dados.', P.color, 'sys'); return; }
  const rate = eventRate(pt.type === '3:1' ? 3 : 2);
  if (pt.type === '3:1' ? RES.reduce((a, r) => a + P.res[r], 0) < rate : P.res[pt.type] < rate){ notify(pt.type === '3:1' ? `El pirata acepta ${rate} cartas, aunque sean distintas: aún no tienes suficientes.` : `El pirata solo acepta ${rate} de ${RES_NAME[pt.type].toLowerCase()}.`, P.color, 'sys'); return; }
  if (!scenesOn()){ openTrade('banco'); return; }
  enterMarket('pier', { port: pi });
}

