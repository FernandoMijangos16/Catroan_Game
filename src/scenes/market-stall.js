// ================= MARKET STALL SCENE (bank trade) AND THE THIEF (on a 7) =================
let marketCtx = null;
// the trader: always the same man (fixed seed), so his portrait in the action messages matches the one at the stall
const MERCHANT = { s: 61, o: { must: true, beard: false, expr: 'sonrisa', skin: 0xc68a5a, hair: 0x2b1d14 } };
const merchantAvatarURL = () => avatarCanvas({ id: 'mercader', role: 'comerciante', g: 'm', s: MERCHANT.s, o: MERCHANT.o }).toDataURL();
function handModel(sleeve, noCuff){
  const g = new THREE.Group(), skin = mat(0xd9a07a);
  const palm = new THREE.Mesh(PGEO.rbox, skin); palm.scale.set(.17, .055, .19); g.add(palm);
  for (let k=0;k<4;k++){ const f = new THREE.Mesh(PGEO.rbox, skin); f.scale.set(.036, .036, .1); f.position.set(-.06 + k*.04, -.005, -.13 - (k === 1 || k === 2 ? .012 : 0)); g.add(f); }
  const th = new THREE.Mesh(PGEO.rbox, skin); th.scale.set(.035, .035, .09); th.position.set(.1, -.005, -.04); th.rotation.y = -.7; g.add(th);
  if (!noCuff){ const cuff = new THREE.Mesh(GEO.cyl, mat(sleeve)); cuff.scale.set(.11, .5, .11); cuff.rotation.x = Math.PI/2; cuff.position.set(0, 0, .1); g.add(cuff); }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return outlineItem(g);
}
function stripeTex(a, b){ return pxTex(16, 16, c => { for (let x=0;x<16;x+=4){ c.fillStyle = (x/4) % 2 ? a : b; c.fillRect(x, 0, 4, 16); } c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(0, 14, 16, 2); }); }
function bellModel(){
  const g = new THREE.Group(), brass = keepMat(new THREE.MeshStandardMaterial({ color: 0xd2a645, metalness: .7, roughness: .3, flatShading: true, envMap: IT.env }));
  g.add(mesh(GEO.cyl14, mat(0x5a3a22), 0, 0, 0, .14, .04, .14));
  const bell = new THREE.Group(); bell.position.y = .04; g.add(bell);
  const lathe = sg(new THREE.LatheGeometry([[.12, 0], [.11, .02], [.08, .08], [.07, .15], [.05, .19], [.0, .2]].map(([x, y]) => new THREE.Vector2(x, y)), 10));
  bell.add(new THREE.Mesh(lathe, brass)); bell.add(mesh(GEO.sphere, brass, 0, .21, 0, .025, .025, .025));
  g.userData.bell = bell; return outlineItem(g);
}
function buildMarket(kind, opts){
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x0d0a07); sc.fog = new THREE.Fog(0x0d0a07, 7, 15);
  const prevGH = GH, prevColl = CUR_COLL; GH = () => 0; CUR_COLL = [];
  sc.add(new THREE.HemisphereLight(0x8a7a6a, 0x1a120c, .75));
  const key = new THREE.DirectionalLight(0xffe2b8, 1.1); key.position.set(-2, 5, 4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); sc.add(key);
  const A = houseAssets(), rng = mulberry32(33);
  const plank = hmat('mkplank', () => new THREE.MeshStandardMaterial({ map: A.tex.plank.plain, color: 0xb08a60, roughness: .9 }));
  const plankD = hmat('mkplankD', () => new THREE.MeshStandardMaterial({ map: A.tex.plank.plain, color: 0x7a5636, roughness: .9 }));
  sc.add(lowpolyGround(new THREE.PlaneGeometry(16, 12, 20, 14).rotateX(-Math.PI/2), (x, z) => (fbm(x*.8, z*.8, 5) - .5)*.08, (x, y, z, r) => jc(r < .5 ? 0x4a3a2a : 0x3e3024, r, .12), .3, 11));
  const TOP = 1.02;
  const topTex = A.tex.plank.plain.clone(); topTex.wrapS = topTex.wrapT = THREE.RepeatWrapping; topTex.repeat.set(1, 5); topTex.needsUpdate = true;
  const top = new THREE.Mesh(GEO.box, keepMat(new THREE.MeshStandardMaterial({ map: topTex, color: 0xb08a60, roughness: .9 }))); top.rotation.y = 0; top.scale.set(3.8, .1, 1.7); top.position.set(0, TOP - .1, 0); top.receiveShadow = true; top.castShadow = true; sc.add(top);
  const W = wallMats('plank', 0xffffff), front = new THREE.Mesh(GEO.box, W.plain); front.scale.set(3.7, .92, .08); front.position.set(0, 0, .8); sc.add(front);
  [[-1.85, .8], [1.85, .8], [-1.85, -.8], [1.85, -.8]].forEach(([x, z]) => { const p = new THREE.Mesh(GEO.box, plankD); p.scale.set(.12, 3.05, .12); p.position.set(x, 0, z); p.castShadow = true; sc.add(p); });
  const cloth = keepMat(new THREE.MeshStandardMaterial({ map: stripeTex('#8a2a22', '#e2d2ae'), roughness: 1, side: THREE.DoubleSide }));
  const aw = new THREE.Mesh(GEO.box, cloth); aw.scale.set(4.2, .05, 2.1); aw.position.set(0, 2.95, .05); aw.rotation.x = -.22; sc.add(aw);
  for (let k=0;k<16;k++){ const t = mesh(GEO.cone4, cloth, -2.05 + k*.275, 2.83, 1.1, .1, -.12, .02, false); t.rotation.y = Math.PI/4; sc.add(t); }
  const sign = signMesh('Mercado', 90, 22, 15); sign.scale.set(1.3, .32, .06); sign.position.set(0, 2.95, 1.12); sc.add(sign);
  [-1.75, 1.75].forEach(x => { sc.add(mesh(GEO.box, 0x2a1e14, x, 1.95, .95, .025, .4, .025)); sc.add(mesh(GEO.box, LAMP_MAT, x, 1.78, .95, .16, .2, .16)); sc.add(mesh(GEO.cone4, 0x2a1e14, x, 1.98, .95, .14, .1, .14)); const pl = new THREE.PointLight(0xffb060, 9, 6, 1.6); pl.position.set(x, 1.85, 1.15); sc.add(pl); });
  // back shelves with goods
  const sh = new THREE.Group(); sh.position.set(0, 0, -1.9); sc.add(sh);
  [.9, 1.6].forEach(y => { const b = new THREE.Mesh(GEO.box, plankD); b.scale.set(3.4, .06, .45); b.position.y = y; sh.add(b); });
  sh.add(mesh(GEO.box, plankD, -1.7, 0, 0, .08, 2.1, .45)); sh.add(mesh(GEO.box, plankD, 1.7, 0, 0, .08, 2.1, .45)); sh.add(mesh(GEO.box, plankD, 0, 0, -.22, 3.4, 2.1, .04));
  for (let k=0;k<7;k++){ const x = -1.4 + k*.47, y = k % 2 ? .96 : 1.66; if (rng() < .5) sh.add(mesh(GEO.cyl, pick([0x8a5a32, 0x6e4a2c], rng), x, y, 0, .13, .3, .13)); else sh.add(mesh(GEO.blobs[k % 3], pick([0xc9b48a, 0xb8a07a], rng), x, y + .12, 0, .16, .14, .14)); }
  RES.forEach((r, k) => { const it = makeResourceItem(r); it.scale.setScalar(.38); it.position.set(-1.3 + k*.65, 1.66, .05); it.rotation.y = rng()*3; sh.add(it); });
  barrel(sc, -2.6, -.6, rng); barrel(sc, 2.7, -.2, rng); crate(sc, 2.5, .9, .55, rng); crate(sc, -2.5, 1, .5, rng);
  // the npc
  const npc = makePerson(mulberry32(MERCHANT.s*97), 'comerciante', 'm', 0x3a2a4a, MERCHANT.o); npc.g.position.set(0, 0, -.95); sc.add(npc.g);
  const hoodC = 0x2e2438;
  npc.act = { kind: 'wave', t: 0 };   // he greets you as you come in
  // hands (player's from the front, npc's from behind)
  const myHand = handModel(G.players[0].color); myHand.visible = false; sc.add(myHand);
  const npcHand = handModel(hoodC); npcHand.rotation.y = Math.PI; npcHand.visible = false; sc.add(npcHand);
  const ctx = { sc, kind, npc, myHand, npcHand, TOP, items: [], anims: [], t: 0, sel: { give: {}, want: {} }, busy: false, opts: opts || {}, hover: null };
  {
    const bell = bellModel(); bell.position.set(0, TOP, .38); bell.scale.setScalar(1.6); sc.add(bell); bell.traverse(o => { if (o.isMesh) o.userData.mk = { type: 'bell' }; }); ctx.bell = bell; ctx.items.push({ obj: bell, type: 'bell' });
    const sl = signMesh('Das', 60, 16, 11, { light: true }); sl.scale.set(.5, .14, .04); sl.position.set(-1.05, TOP - .06, .82); sc.add(sl);
    const sr = signMesh('Recibes', 60, 16, 11, { light: true }); sr.scale.set(.5, .14, .04); sr.position.set(1.05, TOP - .06, .82); sc.add(sr);
    RES.forEach((r, k) => { addTableItem(ctx, r, -1.62 + k*.3, .1 + (k % 2)*.24, 'give', tradeRate(0, r) + ':1'); addTableItem(ctx, r, .42 + k*.3, .1 + (k % 2)*.24, 'want', ''); });
  }
  GH = prevGH; CUR_COLL = prevColl;
  return ctx;
}
function addTableItem(ctx, r, x, z, type, tag){
  const it = makeResourceItem(r); it.scale.setScalar(type === 'pay' ? .55 : .42); it.position.set(x, ctx.TOP, z); it.rotation.y = (type === 'want' ? -.4 : .4) + (Math.random() - .5)*.3; ctx.sc.add(it);
  it.traverse(o => { if (o.isMesh) o.userData.mk = { type, r }; });
  let t = null;
  if (tag){ const side = hmat('tagside', () => new THREE.MeshStandardMaterial({ map: houseAssets().tex.plank.plain, color: 0xb08a5c, roughness: .9 })), topM = new THREE.MeshStandardMaterial({ map: engraveTex(tag, 24, 14, 10, { light: true }), roughness: .9 });
    t = new THREE.Mesh(GEO.box, [side, side, topM, side, side, side]); t.scale.set(.2, .02, .12); t.position.set(x, ctx.TOP, z + (type === 'pay' ? .32 : .2)); ctx.sc.add(t); }
  ctx.items.push({ obj: it, type, r, x, z, tag: t, base: it.position.clone(), rot: it.rotation.y });
}
