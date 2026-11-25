// ================= ALLEY THIEF (on a 7) and HORSEBACK COURIER (trades between players) =================
const ez2 = k => k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
const itemOf = k => RES.includes(k) ? makeResourceItem(k) : makeSpecialItem(k);
function stride(p, ph, amp, run){
  const s = Math.sin(ph), c = Math.cos(ph);
  p.legL.rotation.x = -s*amp; p.legR.rotation.x = s*amp;
  p.kneeL.rotation.x = .06 + Math.max(0, c)*amp*1.6; p.kneeR.rotation.x = .06 + Math.max(0, -c)*amp*1.6;
  p.armL.rotation.x = s*amp*.8; p.elbowL.rotation.x = -.25 - (run ? .8 : 0);
  p.body.position.y = Math.abs(c)*(run ? .07 : .035); p.body.rotation.x = run ? .22 : .05;
}
function relaxP(p, k){ k = Math.min(1, k); ['legL', 'legR', 'kneeL', 'kneeR', 'armL', 'elbowL'].forEach(n => p[n].rotation.x += (0 - p[n].rotation.x)*k); p.body.position.y *= 1 - k; p.body.rotation.x += (0 - p.body.rotation.x)*k; }
function sackModel(){
  const g = new THREE.Group();
  const tex = pxTex(16, 16, c => { for (let y=0;y<16;y++) for (let x=0;x<16;x++){ const n = hash2(x, y, 91), w = (x + y) % 2 ? .9 : 1; c.fillStyle = `rgb(${(178 + n*30)*w|0},${(146 + n*24)*w|0},${(96 + n*18)*w|0})`; c.fillRect(x, y, 1, 1); } c.fillStyle = 'rgba(60,40,20,.35)'; c.fillRect(0, 7, 16, 1); });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 2);
  const m = keepMat(new THREE.MeshStandardMaterial({ map: tex, roughness: 1, flatShading: true, side: THREE.DoubleSide }));
  const pts = [[0, 0], [.2, .01], [.28, .08], [.3, .2], [.27, .32], [.18, .4], [.12, .45], [.16, .5], [.21, .55]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(sg(new THREE.LatheGeometry(pts, 9)), m); body.castShadow = true; g.add(body);
  const rope = new THREE.Mesh(sg(new THREE.TorusGeometry(.125, .02, 4, 9)), mat(0x6a4a2a)); rope.rotation.x = Math.PI/2; rope.position.y = .45; g.add(rope);
  const hole = new THREE.Mesh(sg(new THREE.CircleGeometry(.19, 9)), mat(0x1a120a)); hole.rotation.x = -Math.PI/2; hole.position.y = .53; g.add(hole);
  const tie = mesh(GEO.box, 0x6a4a2a, .14, .38, 0, .03, .12, .03); tie.rotation.z = .5; g.add(tie);
  outlineItem(g);
  return g;
}

// ---------- the alley ----------
function buildAlley(opts){
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0e1118); sc.fog = new THREE.Fog(0x0e1118, 7, 19);
  const prevGH = GH, prevColl = CUR_COLL; GH = () => 0; CUR_COLL = [];
  const rng = mulberry32(91 + (G.turnId || 0)*7);
  sc.add(new THREE.HemisphereLight(0x6a7a9a, 0x18120c, .75));
  const moon = new THREE.DirectionalLight(0x9fb0e0, .75); moon.position.set(3, 9, -3); moon.castShadow = true; moon.shadow.mapSize.set(1024, 1024); Object.assign(moon.shadow.camera, { left: -6, right: 6, top: 9, bottom: -9 }); sc.add(moon);
  // cobblestones
  sc.add(lowpolyGround(new THREE.PlaneGeometry(6, 28, 18, 64).rotateX(-Math.PI/2).translate(0, 0, -8), (x, z) => (hash2(Math.floor(x*2.6), Math.floor(z*2.6), 5) - .5)*.04, (x, y, z, r) => jc(((Math.floor(x*2.6) + Math.floor(z*2.6)) & 1) ? 0x5a585c : 0x46444a, r, .16), .2, 17));
  sc.add(mesh(GEO.box, 0x2a2420, 0, -.02, -8, .35, .03, 28));   // gutter
  // crooked houses on both sides
  const roofs = [0x5a3a2a, 0x4a4040, 0x6a4a30, 0x3e3a3a];
  for (let k=0;k<6;k++){ const z = 3 - k*3.2;
    miniHouse(sc, -3.15, z, 3.2, 2.3, 2.7 + rng()*.9, Math.PI/2, pick(roofs, rng), 0xd8c8a8, rng, { chimney: false });
    miniHouse(sc, 3.15, z - 1.5, 3.2, 2.3, 2.7 + rng()*.9, -Math.PI/2, pick(roofs, rng), 0xc8b898, rng, { chimney: false });
    if (rng() < .7) sc.add(mesh(GEO.box, LAMP_MAT, -1.99, 1.3, z + (rng() - .5), .03, .42, .34, false));
    if (rng() < .5) sc.add(mesh(GEO.box, LAMP_MAT, 1.99, 1.5, z - 1.5 + (rng() - .5), .03, .42, .34, false));
  }
  // wall lanterns
  [[-1.92, -1.2], [1.92, -7.5]].forEach(([x, z]) => { const s = Math.sign(x); sc.add(mesh(GEO.box, 0x2a1e14, x - s*.12, 2.45, z, .3, .03, .03)); sc.add(mesh(GEO.box, LAMP_MAT, x - s*.25, 2.2, z, .14, .2, .14)); sc.add(mesh(GEO.cone4, 0x2a1e14, x - s*.25, 2.4, z, .13, .1, .13)); const pl = new THREE.PointLight(0xffa050, 8, 7, 1.6); pl.position.set(x - s*.4, 2.1, z); sc.add(pl); });
  // washing line
  sc.add(mesh(GEO.box, 0x3a3028, 0, 3.15, -4.2, 4, .015, .015, false));
  [[-1.1, 0x8a3a2a], [-.2, 0xd8d0b8], [.8, 0x3a5a7a]].forEach(([x, c]) => sc.add(mesh(GEO.box, c, x, 2.7, -4.2, .5, .45, .03)));
  barrel(sc, 1.55, -2.4, rng); barrel(sc, -1.55, 1.6, rng); crate(sc, -1.5, -4.2, .6, rng); crate(sc, -1.35, -4.8, .42, rng); crate(sc, 1.5, .9, .5, rng);
  // the thief: tunic, hood, mask and knife
  const npc = makePerson(rng, 'comerciante', 'm', 0x3a2a4a);
  npc.head.children.forEach(o => { if (o.position.y > .3 || (o.scale && o.scale.x > .25)) o.visible = false; });
  const tunic = 0x5a4a38, hoodC = 0x3a3028;
  npc.head.add(mesh(GEO.sphere, hoodC, 0, .31, -.04, .23, .26, .25)); npc.head.add(mesh(GEO.sphere, 0x0a0806, 0, .27, .06, .15, .17, .14));
  [-1, 1].forEach(s => npc.head.add(mesh(GEO.sphere, keepMat(new THREE.MeshBasicMaterial({ color: 0xff5a3a })), s*.05, .28, .18, .016, .012, .01, false)));
  npc.head.add(mesh(GEO.box, 0x111111, 0, .2, .13, .2, .07, .04));
  npc.body.add(mesh(GEO.cone7, tunic, 0, .42, 0, .3, 1.05, .24));
  npc.body.add(mesh(GEO.box, 0x2a1a10, 0, .93, 0, .34, .06, .27));
  npc.body.add(mesh(GEO.box, 0xb08a3a, .1, .92, .13, .06, .08, .02));
  npc.body.add(mesh(GEO.cone7, hoodC, 0, 1.05, -.02, .29, .45, .22));
  const knife = new THREE.Group();
  knife.add(mesh(GEO.cone4, itemAssets().m.metal, 0, .02, 0, .045, .4, .014)); knife.add(mesh(GEO.box, 0xd2a645, 0, -.01, 0, .12, .03, .03)); knife.add(mesh(GEO.box, 0x3a2418, 0, -.15, 0, .035, .14, .035));
  outlineItem(knife); knife.position.set(0, -.34, .04); knife.rotation.x = 1.35; npc.elbowR.add(knife);
  npc.g.position.set(0, 0, -10); sc.add(npc.g);
  { const fill = new THREE.PointLight(0xffc890, 5, 6, 1.4); fill.position.set(.5, 2.1, 3.3); sc.add(fill); }
  // no tray: you hand things over from your own inventory, which comes down as a bar at the bottom of the screen
  const camP = new THREE.Vector3(0, 1.62, 3.9);
  const ctx = { sc, kind: 'thief', alley: true, npc, items: [], t: 0, sel: { give: null, want: null }, busy: true, opts: opts || {}, hover: null, TOP: .95, need: opts.need, given: {}, ph: 'walk', pt: 0, throws: [],
    cam0: [camP.toArray(), [0, 1.12, 1.0]] };
  RES.forEach(r => ctx.given[r] = 0);
  GH = prevGH; CUR_COLL = prevColl;
  return ctx;
}
// the inventory slides down to the bottom as a bar; tapping a resource there throws one into the thief's sack
function thiefBar(on){
  if (!INV || !INV.el) return;
  if (on){ if (INV.payTo) return; INV.keepH = INV.h; INV.h = true; INV.apply(true); INV.el.classList.add('thiefbar'); INV.payTo = r => alleyPay(r); }
  else if (INV.payTo){ INV.payTo = null; INV.drag = false; INV.el.classList.remove('thiefbar'); INV.h = INV.keepH; INV.apply(); dockWins(); }
}
function alleyPay(r){
  const C = marketCtx, P = G.players[0];
  if (!C || !C.alley) return;
  const left = C.need - Object.values(C.given).reduce((a, b) => a + b, 0);
  if (left <= 0 || C.ph !== 'wait') return;
  if (P.res[r] <= 0){ mkSay(`No tienes ${resImg(r)}. ¡No me hagas perder el tiempo!`); SFX.click?.(); return; }
  P.res[r]--; C.given[r]++; refresh(); SFX.click?.();
  // from the slot you tapped, into the sack
  const sr = INV.slots[r].getBoundingClientRect(), nx = (sr.left + sr.width/2)/innerWidth*2 - 1, ny = -((sr.top + sr.height/2)/innerHeight*2 - 1);
  const from = new THREE.Vector3(nx, ny, .5).unproject(camera).sub(camera.position).normalize().multiplyScalar(1.1).add(camera.position);
  const c = makeResourceItem(r); c.scale.setScalar(.2); c.position.copy(from); C.sc.add(c);
  C.throws.push({ c, t: 0, from, to: C.sack.position.clone().add(new THREE.Vector3((Math.random() - .5)*.06, .52, 0)) });
  const rest = left - 1;
  $('#mk-ui .mk-need').innerHTML = rest > 0 ? `Faltan <b>${rest}</b>` : '';
  if (rest > 0) mkSay(pick(['Más…', 'Sigue, sigue…', '¿Eso es todo? Más.', 'Je… sigue echando.']) + ` Faltan <b>${rest}</b>.`);
  else { C.busy = true; thiefBar(false); mkSay('<b>Je, je…</b> un placer hacer negocios contigo.'); const lost = { ...C.given }; Object.keys(lost).forEach(k => { if (!lost[k]) delete lost[k]; }); C.lost = lost; setTimeout(() => { if (marketCtx === C){ C.ph = 'pick'; C.pt = 0; } }, 1000); }
}
function updateAlley(C, dt, t){
  const n = C.npc; C.pt += dt;
  n.head.rotation.y = Math.sin(t*.7)*.12;
  const menace = () => { n.armR.rotation.x += (-.55 + Math.sin(t*2.1)*.07 - n.armR.rotation.x)*Math.min(1, dt*6); n.elbowR.rotation.x += (-1.05 - n.elbowR.rotation.x)*Math.min(1, dt*6); };
  if (C.ph === 'walk'){
    const k = Math.min(1, C.pt/3.6); n.g.position.z = -10 + 10.85*(1 - Math.pow(1 - k, 1.8)); n.ph += dt*7.5*(1 - k*.55); stride(n, n.ph, .5*(1 - k*.5), false); menace();
    if (k >= 1){ C.ph = 'talk'; C.pt = 0; mkSay(`<b>Shhh… ni un grito.</b> Dame la mitad de lo que cargas: <b>${C.need}</b> recursos.`); }
  } else if (C.ph === 'talk'){
    relaxP(n, dt*6); menace();
    if (C.pt > 1.6){ C.ph = 'throw'; C.pt = 0; const s = sackModel(); s.scale.setScalar(.8); n.g.updateMatrixWorld(true); const hp = new THREE.Vector3(); n.elbowL.localToWorld(hp.set(0, -.34, .05)); s.position.copy(hp); C.sc.add(s); C.sack = s; C.sackFrom = hp.clone(); C.sackTo = new THREE.Vector3(.12, 0, 1.25); SFX.whoosh?.(); }
  } else if (C.ph === 'throw'){
    const a = Math.min(1, C.pt/.3); n.armL.rotation.x = -1.3*Math.sin(a*Math.PI/2) + (C.pt > .5 ? (C.pt - .5)*2.6 : 0); n.armL.rotation.x = Math.max(-1.3, Math.min(0, n.armL.rotation.x)); menace();
    const k = Math.min(1, Math.max(0, (C.pt - .15)/.7)), S = C.sack; S.position.lerpVectors(C.sackFrom, C.sackTo, k); S.position.y += Math.sin(Math.PI*k)*.55; S.rotation.z = (1 - k)*4; S.rotation.x = (1 - k)*1.5; S.scale.setScalar(.8 + .2*k);
    if (C.pt > .85 + .15){ S.position.copy(C.sackTo); S.rotation.set(0, .4, 0); S.scale.setScalar(1); SFX.click?.(); C.ph = 'wait'; C.pt = 0; C.busy = false; C.ready = true; thiefBar(true); $('#mk-ui .mk-need').innerHTML = `Faltan <b>${C.need}</b>`; mkSay(`Échalos al saco: <b>toca tus recursos en la barra de abajo.</b> Faltan <b>${C.need}</b>.`); }
  } else if (C.ph === 'wait'){ relaxP(n, dt*4); menace(); }
  else if (C.ph === 'pick'){
    const k = Math.min(1, C.pt/1.1), s = Math.sin(Math.PI*k);
    n.body.rotation.x = .85*s; n.legL.rotation.x = n.legR.rotation.x = -.55*s; n.kneeL.rotation.x = n.kneeR.rotation.x = 1.05*s; n.body.position.y = -.25*s; n.armL.rotation.x = -.9*s; menace();
    if (k > .5 && !C.picked){ C.picked = true; const S = C.sack; n.elbowL.attach(S); SFX.click?.(); }
    if (C.picked){ const S = C.sack; S.position.lerp(new THREE.Vector3(0, -.62, .05), Math.min(1, dt*10)); }
    if (k >= 1){ C.ph = 'turn'; C.pt = 0; }
  } else if (C.ph === 'turn'){
    n.g.rotation.y = Math.PI*ez2(Math.min(1, C.pt/.5)); menace();
    if (C.pt >= .5){ C.ph = 'run'; C.pt = 0; }
  } else if (C.ph === 'run'){
    n.ph += dt*13; stride(n, n.ph, .85, true); n.g.position.z -= dt*Math.min(6, 2 + C.pt*8); n.armR.rotation.x = Math.sin(n.ph)*.6; n.elbowR.rotation.x = -.9;
    if (C.pt > 1.9 && !C.fin){ C.fin = true; thiefBar(false); (async () => { const d = C.done; C.done = null; notify(`El ladrón se llevó ${resStr(C.lost)}`, '#2b2b30'); await exitMarket(); d && d(); })(); }
  }
  // the resources you throw into the sack
  C.throws.forEach(p => { if (p.t >= 1) return; p.t = Math.min(1, p.t + dt/.55); const k = p.t; p.c.position.lerpVectors(p.from, p.to, k); p.c.position.y += Math.sin(Math.PI*k)*.55; p.c.rotation.x += dt*9; p.c.scale.setScalar(.2*(k > .8 ? (1 - k)/.2 : 1));
    if (p.t >= 1){ C.sc.remove(p.c); const S = C.sack; S.userData.n = (S.userData.n || 0) + 1; S.userData.pop = .25; } });
  if (C.sack && C.sack.userData.pop > 0 && !C.picked){ const S = C.sack; S.userData.pop -= dt; const b = 1 + Math.min(.35, (S.userData.n || 0)*.04); S.scale.set(b + Math.sin(S.userData.pop*40)*.04, b*(1 - Math.sin(S.userData.pop*40)*.03), b); }
}

// ---------- the horseback courier ----------
// ---------- a detailed low-poly riding horse with pixel coat texture ----------
