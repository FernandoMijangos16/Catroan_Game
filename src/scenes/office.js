// ================= MAYOR'S OFFICE: trade letters (write / read + stamps) and missions =================
const LET = { W: 200, H: 258, LW: .46, LH: .593 };
function candleModel(){
  const g = new THREE.Group(), brass = keepMat(new THREE.MeshStandardMaterial({ color: 0xc89a40, metalness: .6, roughness: .35, flatShading: true }));
  g.add(mesh(GEO.cyl14, brass, 0, 0, 0, .06, .012, .06)); g.add(mesh(GEO.cyl, brass, 0, .012, 0, .018, .03, .018)); g.add(mesh(GEO.cyl14, brass, 0, .04, 0, .032, .01, .032));
  const ring = new THREE.Mesh(sg(new THREE.TorusGeometry(.03, .006, 4, 8)), brass); ring.position.set(.065, .02, 0); ring.rotation.y = Math.PI/2; g.add(ring);
  const h = .12 + Math.random()*.06, wax = mat(0xf2e8cc);
  g.add(mesh(GEO.cyl, wax, 0, .05, 0, .022, h, .022));
  [[.018, .7, .01], [-.014, .5, .008], [.006, .85, -.018]].forEach(([x, k, z]) => g.add(mesh(GEO.sphere, wax, x, .05 + h*k, z, .008, .02, .008)));
  g.add(mesh(GEO.cyl, 0x1a1210, 0, .05 + h, 0, .002, .012, .002, false));
  const flame = new THREE.Group(); flame.position.y = .05 + h + .012; g.add(flame);
  flame.add(mesh(GEO.cone6, keepMat(new THREE.MeshBasicMaterial({ color: 0xffb040 })), 0, 0, 0, .01, .04, .01, false));
  flame.add(mesh(GEO.cone6, keepMat(new THREE.MeshBasicMaterial({ color: 0xfff2b0 })), 0, 0, 0, .005, .022, .005, false));
  const light = new THREE.PointLight(0xffb060, 2.2, 3, 1.5); light.position.y = .08; flame.add(light);
  g.userData.flame = flame; g.userData.light = light;
  outlineItem(g); flame.children.forEach(o => o.children.forEach(c => c.userData.outline && (c.visible = false)));
  return g;
}
function inkpotModel(){
  const g = new THREE.Group(), glass = keepMat(new THREE.MeshStandardMaterial({ color: 0x1a2232, roughness: .2, metalness: .3, flatShading: true }));
  const body = new THREE.Mesh(sg(new THREE.CylinderGeometry(.03, .038, .045, 8).translate(0, .0225, 0)), glass); g.add(body);
  g.add(mesh(GEO.cyl, glass, 0, .045, 0, .018, .014, .018)); g.add(mesh(GEO.cyl14, 0x05060a, 0, .058, 0, .015, .002, .015, false));
  g.add(mesh(GEO.cyl14, 0x6a4a2a, 0, 0, 0, .05, .006, .05));
  return outlineItem(g);
}
function stampModel(color, label){
  const g = new THREE.Group(), wood = mat(0x7a5232), dark = mat(0x4a301c);
  g.add(mesh(PGEO.rbox, dark, 0, .02, 0, .1, .04, .07));
  g.add(mesh(GEO.box, color, 0, 0, 0, .092, .012, .062));
  g.add(mesh(GEO.cyl, wood, 0, .04, 0, .018, .07, .018));
  g.add(mesh(GEO.sphere, wood, 0, .125, 0, .032, .028, .032));
  const tag = new THREE.Mesh(sg(new THREE.PlaneGeometry(1, 1)), keepMat(new THREE.MeshBasicMaterial({ map: engraveTex(label, 48, 16, 11, { light: true }) }))); tag.scale.set(.085, .028, 1); tag.position.set(0, .021, .036); g.add(tag);
  return outlineItem(g);
}
function inkPadModel(color){ const g = new THREE.Group(); g.add(mesh(GEO.cyl14, 0x6a6a70, 0, 0, 0, .06, .016, .06)); g.add(mesh(GEO.cyl14, color, 0, .016, 0, .052, .002, .052, false)); return outlineItem(g); }
function bookStack(rng){ const g = new THREE.Group(); let y = 0; for (let k=0;k<3;k++){ const h = .035 + rng()*.02, w = .2 + rng()*.06; const b = mesh(GEO.box, pick([0x7a2a22, 0x2a4a6a, 0x3a5a2a, 0x5a3a6a, 0x6a4a22], rng), 0, y, 0, w, h, .15 + rng()*.04); b.rotation.y = (rng() - .5)*.4; g.add(b); g.add(mesh(GEO.box, 0xe8dcc0, 0, y + .004, 0, w*.94, h*.8, .145)); y += h; } return outlineItem(g); }
// letter texture
function letterCanvas(){ const cv = document.createElement('canvas'); cv.width = LET.W; cv.height = LET.H; return cv; }
function drawLetter(C){
  const L = C.L, cv = L.cv, c = cv.getContext('2d'), W = LET.W, H = LET.H;
  c.imageSmoothingEnabled = false;
  for (let y=0;y<H;y+=2) for (let x=0;x<W;x+=2){ const n = hash2(x >> 1, y >> 1, 41), e = Math.min(x, y, W - 1 - x, H - 1 - y), d = e < 4 ? .8 : e < 9 ? .9 : 1, bl = hash2(x >> 4, y >> 4, 42) > .85 ? .93 : 1;
    c.fillStyle = `rgb(${(210 + n*22)*d*bl|0},${(186 + n*20)*d*bl|0},${(128 + n*16)*d*bl|0})`; c.fillRect(x, y, 2, 2); }
  const ink = '#140a04';
  c.fillStyle = ink; c.textBaseline = 'alphabetic';
  const T = (txt, x, y, sz = 11, w = 500, al = 'left', col = ink) => { c.font = `${w} ${sz}px 'Pixelify Sans', monospace`; c.textAlign = al; c.fillStyle = col; c.fillText(txt, x, y); };
  T(`Catroan · turno ${G.turnId || 1}`, W - 12, 15, 9, 600, 'right', '#3a2210');
  T(`Estimad${L.toF ? 'a' : 'o'} ${L.to}:`, 14, 38, 13, 700);
  T('Le ofrezco:', 14, 60, 12, 700);
  T('A cambio de:', 14, 134, 12, 700);
  const row = (obj, y0) => { const ks = Object.keys(obj).filter(k => obj[k] > 0), box = !L.read && ks.length < 4, n = ks.length + (box ? 1 : 0); if (!n){ T('—', W/2, y0 + 30, 11, 700, 'center'); return; }
    ks.forEach((k, i) => { const x = slotX(i, n); T('×' + obj[k], x + 13, y0 + 50, 12, 800); c.fillStyle = 'rgba(20,10,4,.5)'; c.fillRect(x - 13, y0 + 53, 26, 1); });
    if (box){ const x = slotX(ks.length, n); c.fillStyle = '#140a04'; for (let k=0;k<26;k+=4){ c.fillRect(x - 15 + k, y0 + 14, 2, 1); c.fillRect(x - 15 + k, y0 + 46, 2, 1); } for (let k=0;k<32;k+=4){ c.fillRect(x - 15, y0 + 14 + k, 1, 2); c.fillRect(x + 13, y0 + 14 + k, 1, 2); } T('+', x - 1, y0 + 38, 20, 800, 'center'); } };
  row(L.offer, 64); row(L.ask, 138);
  T('Atentamente,', 14, 222, 10);
  if (L.sign > 0){ c.save(); c.beginPath(); c.rect(0, 224, 26 + (W - 40)*L.sign, 30); c.clip(); T(L.from, 30, 244, 14, 700, 'left', '#1e2a4a'); c.fillStyle = '#1e2a4a'; c.fillRect(28, 247, Math.min(1, L.sign)*Math.min(120, 8 + L.from.length*8), 1); c.restore(); }
  if (L.stamp) stampMark(c, W - 62, 212, L.stamp === 'ok');
  L.tex.needsUpdate = true;
}
// the inked mark a stamp leaves: double frame, tilted, worn in spots (the same on every letter)
function stampMark(c, x, y, ok){
  c.save(); c.translate(x, y); c.rotate(-.22); const col = ok ? 'rgba(40,120,50,.85)' : 'rgba(170,30,30,.85)';
  c.strokeStyle = col; c.lineWidth = 3; c.strokeRect(-48, -14, 96, 28); c.lineWidth = 1; c.strokeRect(-44, -10, 88, 20);
  c.font = `800 ${ok ? 13 : 12}px 'Pixelify Sans', monospace`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = col; c.fillText(ok ? 'APROBADO' : 'RECHAZADO', 0, 5);
  c.globalCompositeOperation = 'destination-out'; for (let k=0;k<70;k++){ c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect((hash2(k, 1, 77) - .5)*96, (hash2(k, 2, 77) - .5)*28, 2, 2); } c.restore();
}
const slotX = (i, n) => LET.W/2 + (i - (n - 1)/2)*40;
const letterPos = (x, y) => new THREE.Vector3((x/LET.W - .5)*LET.LW, .006, (y/LET.H - .5)*LET.LH);
function syncLetterModels(C){
  const L = C.L;
  L.models.forEach(m => { L.g.remove(m.obj); C.items = C.items.filter(i => i !== m); }); L.models = [];
  (L.boxes || []).forEach(b => { L.g.remove(b.obj); C.items = C.items.filter(i => i !== b); }); L.boxes = [];
  [['offer', 64, 'lo'], ['ask', 138, 'la']].forEach(([key, y0, type]) => { const ks = Object.keys(L[key]).filter(k => L[key][k] > 0), box = !L.read && ks.length < 4, n = ks.length + (box ? 1 : 0);
    if (box){ const hit = new THREE.Mesh(sg(new THREE.BoxGeometry(1, 1, 1)), keepMat(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))); hit.scale.set(.08, .05, .08); hit.position.copy(letterPos(slotX(ks.length, n), y0 + 30)); L.g.add(hit); const b = { obj: hit, type: key === 'offer' ? 'boxO' : 'boxA', letter: true }; L.boxes.push(b); C.items.push(b); }
    ks.forEach((k, i) => { const it = itemOf(k), sp = spinner(it, .07); sp.position.copy(letterPos(slotX(i, n), y0 + 32)).add(new THREE.Vector3(0, .03, 0)); L.g.add(sp); sp.traverse(o => { if (o.isMesh) o.userData.mk = { type, k }; });
      const m = { obj: sp, type, k, letter: true }; L.models.push(m); if (!L.read) C.items.push(m); }); });
  drawLetter(C);
}
// ---------- the room ----------
function buildOffice(opts){
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0x120c08); sc.fog = new THREE.Fog(0x120c08, 6, 12);
  const prevGH = GH, prevColl = CUR_COLL; GH = () => 0; CUR_COLL = [];
  const rng = mulberry32(13), A = houseAssets(), me = G.players[0];
  sc.add(new THREE.HemisphereLight(0xa08868, 0x241810, .7));
  const win = new THREE.DirectionalLight(0xb8c8ff, .9); win.position.set(-6, 5, -1.5); win.castShadow = true; win.shadow.mapSize.set(1024, 1024); Object.assign(win.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 }); sc.add(win);
  const plank = A.tex.plank.plain.clone(); plank.wrapS = plank.wrapT = THREE.RepeatWrapping; plank.repeat.set(6, 8); plank.needsUpdate = true;
  const floor = new THREE.Mesh(GEO.box, keepMat(new THREE.MeshStandardMaterial({ map: plank, color: 0x9a7048, roughness: .9 }))); floor.scale.set(6.4, .05, 7.5); floor.position.set(0, -.05, -1.5); floor.receiveShadow = true; sc.add(floor);
  const wallT = A.tex.stone ? A.tex.stone.plain : null;
  const WL = wallMats('timber', 0xe8dcc0), ST = stoneMat();
  const wall = (x, z, w, h, ry, m) => { const o = new THREE.Mesh(GEO.box, m); o.scale.set(w, h, .15); o.position.set(x, 0, z); o.rotation.y = ry; o.receiveShadow = true; sc.add(o); return o; };
  wall(-1.9, -5, 2.6, 3.2, 0, WL.plain); wall(1.9, -5, 2.6, 3.2, 0, WL.plain); wall(0, -5, 1.3, .8, 0, WL.plain).position.y = 2.4;
  wall(-3.2, -1.5, 7.5, 3.2, Math.PI/2, WL.plain); wall(3.2, -1.5, 7.5, 3.2, Math.PI/2, WL.plain); wall(0, 2.2, 6.4, 3.2, 0, WL.plain);
  for (let z = -4.5; z < 2; z += 1.3) sc.add(mesh(GEO.box, 0x4a301c, 0, 3.0, z, 6.4, .16, .16));
  sc.add(mesh(GEO.box, ST, -3.1, 0, -1.5, .12, .5, 7.5)); sc.add(mesh(GEO.box, ST, 3.1, 0, -1.5, .12, .5, 7.5));
  // door (opens for visitors)
  const door = new THREE.Group(); door.position.set(-.6, 0, -4.98); sc.add(door);
  const dm = new THREE.Mesh(GEO.box, hmat('mkplankD', () => new THREE.MeshStandardMaterial({ map: A.tex.plank.plain, color: 0x7a5636, roughness: .9 }))); dm.scale.set(1.2, 2.4, .08); dm.position.set(.6, 0, 0); door.add(dm);
  [.5, 1.9].forEach(y => door.add(mesh(GEO.box, 0x2a2420, .6, y, .05, 1.22, .08, .02))); door.add(mesh(GEO.sphere, 0xc89a40, 1.05, 1.15, .07, .04, .04, .04));
  sc.add(mesh(GEO.box, 0x1a120c, 0, 0, -5.1, 1.3, 2.45, .05));
  // window with cold light
  const winG = new THREE.Group(); winG.position.set(-3.1, 1.5, -2.2); winG.rotation.y = Math.PI/2; sc.add(winG);
  winG.add(mesh(GEO.box, keepMat(new THREE.MeshStandardMaterial({ color: 0x8ab0e0, emissive: 0x6a90c8, emissiveIntensity: .9 })), 0, -.6, 0, 1.1, 1.2, .04, false));
  [[0, -.6, 1.2, .06], [0, 0, 1.2, .06]].forEach(([x, y, w, h]) => winG.add(mesh(GEO.box, 0x3a2614, x, y - .03, .03, w, h, .06)));
  [-.55, 0, .55].forEach(x => winG.add(mesh(GEO.box, 0x3a2614, x, -.63, .03, .06, 1.26, .06)));
  // bookshelf on the left wall
  const shelf = new THREE.Group(); shelf.position.set(-2.95, 0, -.4); shelf.rotation.y = Math.PI/2; sc.add(shelf);
  shelf.add(mesh(GEO.box, 0x5a3a22, 0, 0, 0, 1.6, 2.2, .4)); [.5, 1.05, 1.6].forEach(y => { shelf.add(mesh(GEO.box, 0x3a2414, 0, y, .02, 1.5, .04, .38)); let x = -.7; while (x < .68){ const w = .05 + rng()*.05, h = .3 + rng()*.15; shelf.add(mesh(GEO.box, pick([0x7a2a22, 0x2a4a6a, 0x3a5a2a, 0x5a3a6a, 0x8a6a22, 0x4a2a1a], rng), x + w/2, y + .04, .05, w, h, .26)); x += w + .008; } });
  // banner in the player's color behind the door side, fireplace glow on the right
  const ban = new THREE.Group(); ban.position.set(1.9, 1.2, -4.9); sc.add(ban);
  ban.add(mesh(GEO.box, me.color, 0, 0, 0, .9, 1.5, .03)); ban.add(mesh(GEO.box, 0xd8b048, 0, .7, .03, .9, .06, .02)); ban.add(mesh(GEO.box, 0x3a2414, 0, 1.52, .04, 1.1, .05, .05));
  { const em = waxSeal3D(0xd8b048, false); em.scale.setScalar(.18); em.position.set(0, .78, .05); ban.add(em); }
  const fire = new THREE.Group(); fire.position.set(3.0, 0, -2.6); sc.add(fire);
  fire.add(mesh(GEO.box, ST, 0, 0, 0, .5, 1.3, 1.6)); fire.add(mesh(GEO.box, 0x140c08, -.2, .1, 0, .2, .8, 1.1)); fire.add(mesh(GEO.box, ST, -.1, 1.3, 0, .7, .12, 1.8));
  const fl = new THREE.PointLight(0xff7a30, 5, 6, 1.6); fl.position.set(-.6, .5, 0); fire.add(fl);
  [[-.25, .1, -.2], [-.25, .1, .15], [-.25, .12, 0]].forEach(([x, y, z], k) => fire.add(mesh(GEO.cone6, keepMat(new THREE.MeshBasicMaterial({ color: k ? 0xff9a30 : 0xffd060 })), x, y, z, .12, .35 + k*.08, .12, false)));
  // rug and a chest
  sc.add(mesh(GEO.box, keepMat(new THREE.MeshStandardMaterial({ map: stripeTex(hexCss(me.color), '#d8c8a0'), roughness: 1 })), 0, 0, -2.2, 2.2, .012, 1.6, false));
  const chest = new THREE.Group(); chest.position.set(2.5, 0, -.6); chest.rotation.y = -1.2; sc.add(chest); chest.add(mesh(GEO.box, 0x7a5232, 0, 0, 0, .9, .45, .5)); chest.add(mesh(PGEO.rbox, 0x6a4628, 0, .5, 0, .92, .14, .52)); chest.add(mesh(GEO.box, 0xc89a40, 0, .3, .26, .12, .14, .02));
  // ---------- the desk ----------
  const DY = .78, desk = new THREE.Group(); sc.add(desk);
  const dTex = A.tex.plank.plain.clone(); dTex.wrapS = dTex.wrapT = THREE.RepeatWrapping; dTex.repeat.set(3, 1); dTex.needsUpdate = true;
  const top = new THREE.Mesh(GEO.box, keepMat(new THREE.MeshStandardMaterial({ map: dTex, color: 0x9a6a40, roughness: .8 }))); top.scale.set(2.1, .06, 1.05); top.position.set(0, DY - .06, -.38); top.receiveShadow = true; top.castShadow = true; desk.add(top);
  desk.add(mesh(GEO.box, 0x5a3a22, 0, DY - .1, -.38, 2.14, .04, 1.09));
  desk.add(mesh(GEO.box, 0x6a4628, 0, .1, -.88, 2.0, .6, .05));
  [[-1, -.88], [1, -.88], [-1, .1], [1, .1]].forEach(([x, z]) => desk.add(mesh(GEO.box, 0x4a301c, x, 0, z, .08, DY - .06, .08)));
  desk.add(mesh(GEO.box, 0x3a6a3a, 0, DY, -.35, 1.1, .004, .78, false));   // green writing leather
  // things on the desk
  const cL = candleModel(); cL.position.set(-.52, DY, -.74); desk.add(cL); const cR = candleModel(); cR.position.set(.56, DY, -.78); desk.add(cR);
  const ip = inkpotModel(); ip.scale.setScalar(1.3); ip.position.set(.36, DY, -.42); desk.add(ip);
  const q = quill3D(); q.scale.setScalar(.26); q.position.set(.36, DY + .06, -.42); q.rotation.set(-.2, .4, -.4); desk.add(q);
  const bs = bookStack(rng); bs.position.set(-.42, DY, -.6); bs.rotation.y = .3; bs.scale.setScalar(.8); desk.add(bs);
  const seal = waxSeal3D(me.color, false); seal.scale.setScalar(.035); seal.rotation.x = -Math.PI/2; seal.position.set(.34, DY + .012, -.18); desk.add(seal);
  // the letter
  const L = { cv: letterCanvas(), offer: {}, ask: {}, sign: 0, stamp: null, models: [], read: !!opts.read, to: opts.to || '', toF: !!opts.toF, from: opts.from || '' };
  L.tex = new THREE.CanvasTexture(L.cv); L.tex.colorSpace = THREE.SRGBColorSpace; L.tex.magFilter = THREE.NearestFilter; L.tex.minFilter = THREE.LinearFilter;
  L.g = new THREE.Group(); L.g.position.set(0, DY + .004, -.36); L.g.rotation.y = .03; desk.add(L.g);
  const edge = mat(0xb89868);
  L.paper = new THREE.Mesh(GEO.box, [edge, edge, keepMat(new THREE.MeshStandardMaterial({ map: L.tex, roughness: 1 })), edge, edge, edge]); L.paper.scale.set(LET.LW, .004, LET.LH); L.paper.receiveShadow = true; L.g.add(L.paper);
  const ctx = { sc, kind: 'office', office: true, items: [], t: 0, sel: { give: null, want: null }, busy: true, opts, hover: null, TOP: DY, ph: 'intro', pt: 0, L, desk, DY, door, quill: q, quillHome: { p: q.position.clone(), r: q.rotation.clone() }, candles: [cL, cR], fireL: fl, seal,
    cam0: [[0, 1.2, .26], [0, .78, -.38]], fov: 56, npc: null };
  GH = prevGH; CUR_COLL = prevColl;
  return ctx;
}
function officeClick(it){
  const C = marketCtx, L = C.L;
  if (C.ph === 'compose'){
    mkHush();
    if (it.type === 'boxO' || it.type === 'boxA'){ openDrawer(C, it.type === 'boxO' ? 'offer' : 'ask'); SFX.click?.(); return; }
    if (it.off) return;
    if ((it.type === 'mine' || it.type === 'want') && tradeBlocked(0, it.k)){ mkSay(`Con ${AMULETS[G.players[0].fx.plague.k].name.toLowerCase()} en tus tierras no puedes cambiar ${RES_NAME[it.k].toLowerCase()}.`, 3000); return; }
    if (it.type === 'mine'){ if (C.have(it.k) - (L.offer[it.k] || 0) <= 0){ mkSay('Ya no te queda de eso.'); return; } if (Object.keys(L.offer).filter(k => L.offer[k]).length >= 4 && !L.offer[it.k]) return; L.offer[it.k] = (L.offer[it.k] || 0) + 1; delete L.ask[it.k]; }
    else if (it.type === 'want'){ if (Object.keys(L.ask).filter(k => L.ask[k]).length >= 4 && !L.ask[it.k]) return; L.ask[it.k] = Math.min(9, (L.ask[it.k] || 0) + 1); delete L.offer[it.k]; }
    else if (it.type === 'lo'){ L.offer[it.k]--; if (L.offer[it.k] <= 0) delete L.offer[it.k]; }
    else if (it.type === 'la'){ L.ask[it.k]--; if (L.ask[it.k] <= 0) delete L.ask[it.k]; }
    else if (it.type === 'quill'){ if (!Object.keys(L.offer).length || !Object.keys(L.ask).length){ mkSay('Pon en la carta lo que <b>ofreces</b> y lo que <b>pides</b> antes de firmar.', 3000); return; } closeDrawer(); C.ph = 'sign'; C.pt = 0; C.ready = false; SFX.scroll?.(); mkSay('Firmando…'); return; }
    SFX.click?.(); syncLetterModels(C); if (DRAWER.kind) fillDrawer(C);
  } else if (C.ph === 'qoffer' && it.type === 'qitem'){ C.ph = 'qgive'; C.pt = 0; C.ready = false; SFX.click?.(); }
}
// ---------- the inventory drawer that slides up from the bottom while writing a letter ----------
const DRAWER = { kind: null };
function closeDrawer(){ const C = marketCtx; if (C && C.float){ C.L.g.remove(C.float); C.items = C.items.filter(i => !i.float); C.float = null; } DRAWER.kind = null; }
function openDrawer(C, kind){ if (DRAWER.kind === kind){ closeDrawer(); return; } closeDrawer(); DRAWER.kind = kind; fillDrawer(C); }
// the goods float in a neat grid above the letter: just the spinning models and a small inked count
function fillDrawer(C){
  const kind = DRAWER.kind, L = C.L; if (C.float){ L.g.remove(C.float); C.items = C.items.filter(i => !i.float); }
  const keys = kind === 'offer' ? [...RES, ...SPK].filter(k => C.have(k) > 0) : [...RES, ...SPK];
  const left = k => C.have(k) - (L.offer[k] || 0), g = new THREE.Group(); g.position.set(0, .075, .07); L.g.add(g); C.float = g;
  const cols = 6, sx = .074, sz = .1, rows = Math.ceil(keys.length/cols);
  keys.forEach((k, i) => { const c = i % cols, r = Math.floor(i/cols), x = (c - (Math.min(cols, keys.length) - 1)/2)*sx, z = (r - (rows - 1)/2)*sz - .02;
    const off = kind === 'offer' && left(k) <= 0, sp = spinner(itemOf(k), .062); sp.position.set(x, 0, z); g.add(sp);
    if (off) sp.traverse(o => { if (o.isMesh && o.material){ o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .3; } });
    const n = kind === 'offer' ? String(left(k)) : (L.ask[k] ? '×' + L.ask[k] : '');
    if (n){ const t = textSprite(n, 64, '#fff2d0'); t.scale.set(.05, .025, 1); t.position.set(x + .02, -.03, z + .025); g.add(t); }
    sp.traverse(o => { if (o.isMesh) o.userData.mk = { type: 'pick' }; });
    C.items.push({ obj: sp, type: kind === 'offer' ? 'mine' : 'want', k, float: true, off }); });
}
function officeQuillPose(C, k, x, z){ const q = C.quill, h = C.quillHome; q.position.set(h.p.x + (x - h.p.x)*k, h.p.y + Math.sin(Math.PI*Math.min(1, k))*.12 + k*.02, h.p.z + (z - h.p.z)*k); q.rotation.set(h.r.x*(1 - k) + -.6*k, h.r.y*(1 - k), h.r.z*(1 - k) + -.5*k); }
function updateOffice(C, dt, t){
  C.pt += dt; const L = C.L;
  C.candles.forEach((c, i) => { const f = 1 + Math.sin(t*13 + i*2)*.08 + Math.sin(t*7.3 + i)*.06; c.userData.flame.scale.set(1, f, 1); c.userData.light.intensity = 2.2*f; });
  C.fireL.intensity = 4.5 + Math.sin(t*9)*.6 + Math.sin(t*5.3)*.4;
  L.models.forEach((m, i) => { m.obj.userData.inner.rotation.y += dt*.9; m.obj.position.y = .03 + Math.sin(t*2 + i)*.004; m.obj.visible = !C.float; });
  if (C.float) C.float.children.forEach((o, i) => { if (o.userData.inner){ const hov = C.hover && C.hover.obj === o; o.userData.inner.rotation.y += dt*(hov ? 3 : 1.1); o.position.y = Math.sin(t*2 + i*.7)*.006 + (hov ? .015 : 0); } });
  C.items.forEach(i => { if (i.letter || i.float || !i.obj.userData.inner) return; const hov = C.hover === i; i.obj.userData.inner.rotation.y += dt*(hov ? 2.6 : .7); i.obj.position.y += ((hov ? .085 : .06) - i.obj.position.y)*Math.min(1, dt*10); });
  if (C.hover && C.hover.type === 'quill' && C.ph === 'compose') C.quill.rotation.z = C.quillHome.r.z + Math.sin(t*8)*.08;
  switch (C.ph){
    case 'sign': { // the quill flies to the signature line and writes
      const sx = letterPos(30, 244), sw = letterPos(30 + Math.min(120, 8 + L.from.length*8), 244); const k1 = ez2(Math.min(1, C.pt/.45)), k2 = Math.min(1, Math.max(0, (C.pt - .45)/.9)), k3 = ez2(Math.min(1, Math.max(0, (C.pt - 1.4)/.4)));
      const wpos = v => L.g.localToWorld(v.clone()).sub(C.desk.position);
      const a = wpos(sx), b = wpos(sw), px = a.x + (b.x - a.x)*k2, pz = a.z + Math.sin(k2*40)*.006;
      if (k3 <= 0){ officeQuillPose(C, k1, px, pz); C.quill.position.y = C.DY + .05 + (k2 > 0 && k2 < 1 ? Math.abs(Math.sin(k2*40))*.008 : .03*(1 - k1)); }
      else officeQuillPose(C, 1 - k3, px, pz);
      L.sign = k2; drawLetter(C);
      if (C.pt > 1.85){ officeQuillPose(C, 0, 0, 0); C.ph = 'seal'; C.pt = 0; const s = waxSeal3D(G.players[0].color, true); s.scale.setScalar(.04); s.rotation.x = -Math.PI/2; s.position.set(0, .3, LET.LH*.42); L.g.add(s); C.sealDrop = s; }
      break; }
    case 'seal': { const k = Math.min(1, C.pt/.35), s = C.sealDrop; s.position.y = .3*(1 - k*k) + .008; if (k >= 1 && !C.sealed){ C.sealed = true; SFX.stamp?.(); }
      const f = ez2(Math.min(1, Math.max(0, (C.pt - .5)/.5))); L.paper.scale.z = LET.LH*(1 - .6*f); L.models.forEach(m => m.obj.visible = f < .3); s.position.z = LET.LH*.42*(1 - f*.9);
      if (C.pt > 1.1){ C.ph = 'send'; C.pt = 0; mkSay(`La carta va en camino a ${nameTag(C.opts.to, C.opts.toColor)}…`); }
      break; }
    case 'send': { const k = ez2(Math.min(1, C.pt/.7)); L.g.position.set(k*1.6, C.DY + .004 + Math.sin(Math.PI*k)*.25, -.36 - k*1.2); L.g.rotation.y = .03 + k*1.5;
      if (!C.pend){ C.pendR = undefined; C.pend = Promise.resolve(C.opts.decide(L.offer, L.ask)).then(r => C.pendR = !!r, () => C.pendR = false); }
      if (C.pt > 1.5 && C.pendR === undefined && !C.waitSaid){ C.waitSaid = true; mkSay(`Esperando la respuesta de ${nameTag(C.opts.to, C.opts.toColor)}…`, 0); }
      if (C.pt > 1.5 && C.pendR !== undefined){ // the answer comes back to be stamped
        C.result = C.pendR; C.pend = null; C.waitSaid = false; L.paper.scale.z = LET.LH; C.sealDrop.visible = false; L.models.forEach(m => m.obj.visible = true); drawLetter(C);
        C.ph = 'back'; C.pt = 0; mkSay(`¡Llegó la respuesta de ${nameTag(C.opts.to, C.opts.toColor)}!`); }
      break; }
    case 'back': { const k = ez2(Math.min(1, C.pt/.6)); L.g.position.set(-1.6*(1 - k), C.DY + .004 + Math.sin(Math.PI*k)*.2, -.36 - 1.2*(1 - k)); L.g.rotation.y = .03 - (1 - k)*1.2;
      if (k >= 1){ C.ph = 'reply'; C.pt = 0;
        if (!C.replyStamps) C.replyStamps = [[true, 0x2a7a3a, 'SÍ', 1], [false, 0xa82a2a, 'NO', -1]].map(([ok, col, lab, sx]) => { const x = sx*(LET.LW/2 + .1), z = -.44, pad = inkPadModel(col); pad.position.set(x, C.DY, z); C.desk.add(pad); const s = stampModel(col, lab); s.position.set(x, C.DY + .022, z); C.desk.add(s); return { ok, obj: s, home: s.position.clone() }; });
        const S = C.replyStamps.find(s => s.ok === !!C.result); C.stamp = { obj: S.obj, ok: C.result, home: S.home.clone() }; }
      break; }
    case 'reply': {
      const S = C.stamp, home = S.home || (S.home = S.obj.position.clone()), tgt = L.g.localToWorld(letterPos(LET.W - 62, 212)).sub(C.desk.position);
      const k1 = ez2(Math.min(1, C.pt/.4)), k2 = Math.min(1, Math.max(0, (C.pt - .4)/.25)), k3 = ez2(Math.min(1, Math.max(0, (C.pt - .8)/.4)));
      const above = tgt.clone().setY(C.DY + .16), down = tgt.clone().setY(C.DY + .01);
      if (k3 <= 0){ S.obj.position.lerpVectors(home, above, k1); if (k2 > 0) S.obj.position.lerpVectors(above, down, Math.sin(Math.PI*k2)); S.obj.rotation.z = -.2*k1; }
      else { S.obj.position.lerpVectors(above, home, k3); S.obj.rotation.z = -.2*(1 - k3); }
      if (k2 > .5 && !L.stamp){ L.stamp = C.result ? 'ok' : 'no'; drawLetter(C); SFX.stamp?.(); }
      if (C.pt > 1.5){ C.ph = 'done'; C.pt = 0;
        mkSay(C.result ? `${nameTag(C.opts.to, C.opts.toColor)} aprobó tu trato. Un mensajero va en camino.` : `${nameTag(C.opts.to, C.opts.toColor)} rechazó tu trato.`); }
      break; }
    case 'done': if (C.pt > 1.3 && !C.fin){ C.fin = true; (async () => { const d = C.done; C.done = null; const r = { ok: C.result, offer: { ...L.offer }, ask: { ...L.ask } }; await exitMarket(); d && d(r); })(); } break;
    case 'cancel': if (!C.fin){ C.fin = true; (async () => { const d = C.done; C.done = null; await exitMarket(); d && d({ ok: false, cancel: true }); })(); } break;
    // ---------- missions ----------
    case 'qdoor': { const k = ez2(Math.min(1, C.pt/.6)); C.door.rotation.y = -1.6*k; if (C.pt > .5){ C.ph = 'qwalk'; C.pt = 0; } break; }
    case 'qwalk': { const n = C.npc, k = Math.min(1, C.pt/2.0); n.g.position.z = -5.4 + 3.6*(1 - Math.pow(1 - k, 1.6)); n.ph += dt*7.5*(1 - k*.5); stride(n, n.ph, .5*(1 - k*.6), false);
      if (k >= 1){ C.ph = 'qtalk'; C.pt = 0; relaxP(n, 1); mkSay(`<b>${C.q.name}:</b> ${pick(['¡Me dijeron que lo conseguiste!', '¡Alcalde! ¿De verdad lo tiene?', 'Vengo por el encargo… ¡qué alegría!'])}`); tweenCam(new THREE.Vector3(0, 1.25, .4), new THREE.Vector3(0, 1.02, -1.4), 700); } break; }
    case 'qtalk': { relaxP(C.npc, dt*5); C.npc.head.rotation.x = -.15;
      if (C.pt > .8 && !C.qit){ const it = new THREE.Group(); it.userData.inner = it; const ks = Object.keys(qItems(C.q)); ks.forEach((k, i) => { const o = spinner(itemOf(k), ks.length > 1 ? .09 : .12); o.position.set((i - (ks.length - 1)/2)*.1, 0, 0); it.add(o); }); it.position.set(.15, C.DY + .32, -.45); C.desk.add(it); const hd = handModel(G.players[0].color, true); hd.scale.setScalar(.6); hd.position.set(.15, C.DY + .25, -.4); C.desk.add(hd); C.qhand = hd; it.traverse(o => { if (o.isMesh) o.userData.mk = { type: 'qitem' }; }); C.qit = it; C.items = [{ obj: it, type: 'qitem' }]; C.ph = 'qoffer'; C.pt = 0; C.ready = false; C.busy = true; mkSay(`Le entregas ${qListM(C.q)}…`, 2200); }
      break; }
    case 'qoffer': { relaxP(C.npc, dt*5); const ha = C.npc.tool ? C.npc.armL : C.npc.armR; ha.rotation.x += (-1.1 - ha.rotation.x)*Math.min(1, dt*4);   // a cane stays in the right hand: take it with the left
 C.qit.userData.inner.rotation.y += dt*1.5; if (C.pt > 1.1){ C.ph = 'qgive'; C.pt = 0; C.ready = false; SFX.click?.(); } break; }
    case 'qgive': { const n = C.npc, k = ez2(Math.min(1, C.pt/.6)), L = !!n.tool, armT = L ? n.armL : n.armR, armO = L ? n.armR : n.armL, elT = L ? n.elbowL : n.elbowR; n.g.updateMatrixWorld(true); const hw = new THREE.Vector3(0, -.36, .06); elT.localToWorld(hw); hw.sub(C.desk.position);
      if (!C.taken){ C.qit.position.lerpVectors(new THREE.Vector3(.15, C.DY + .32, -.45), hw, k); C.qhand.position.set(C.qit.position.x, C.qit.position.y - .07, C.qit.position.z + .05); if (k >= 1){ C.qhand.visible = false; C.taken = true; elT.attach(C.qit); SFX.pick?.(); mkSay(`<b>${C.q.name}:</b> ${pick(['¡Gracias, de corazón! Le dejo esto.', '¡Justo lo que necesitaba! Esto es para usted.', '¡Qué alivio! Tome, se lo ganó.'])}`); } }
      else { armT.rotation.x += (0 - armT.rotation.x)*Math.min(1, dt*5); if (!L) armO.rotation.x = -1.1*Math.min(1, (C.pt - .6)/.4); }
      if (C.pt > 1.0 && !C.sack){ const s = sackModel(); s.scale.setScalar(.32); s.position.set(-.05, C.DY, -.55); C.desk.add(s); C.sack = s; SFX.click?.(); }
      if (C.pt > 1.6){ C.ph = 'qturn'; C.pt = 0; }
      break; }
    case 'qturn': { const n = C.npc; n.armL.rotation.x *= .9; n.g.rotation.y = Math.PI*ez2(Math.min(1, C.pt/.45)); if (C.pt > .45){ C.ph = 'qleave'; C.pt = 0; } break; }
    case 'qleave': { const n = C.npc; n.ph += dt*8; stride(n, n.ph, .5, false); n.g.position.z -= dt*2.4; if (n.g.position.z < -5.3){ n.g.visible = false; } if (C.pt > 1.9){ C.door.rotation.y = -1.6*Math.max(0, 1 - (C.pt - 1.9)/.4); }
      if (C.pt > 2.3){ C.ph = 'qreward'; C.pt = 0; tweenCam(new THREE.Vector3(0, 1.2, .26), new THREE.Vector3(0, .78, -.45), 600); } break; }
    case 'qreward': { const S = C.sack;
      if (C.pt > .5 && !C.burst){ C.burst = true; SFX.reveal?.(); const r = C.q.reward, list = r.type === 'res' ? Object.entries(r.res).flatMap(([k, n]) => Array(n).fill(k)) : [r.type];
        C.pops = list.map((k, i) => { let m; if (RES.includes(k)) m = makeResourceItem(k); else if (k === 'card') m = cardMesh(); else if (k === 'discount') m = pieceModel(r.build); else if (k === 'road') m = pieceModel('camino'); else if (k === 'amulet') m = amuletModel(r.k); else { m = new THREE.Mesh(sg(new THREE.IcosahedronGeometry(1, 0)), keepMat(new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0xa06a00, emissiveIntensity: .8, flatShading: true }))); outlineItem(m); }
          const sp = spinner(m, .1); const M = contourMats(0xffe07a); sp.traverse(o => { if (o.isMesh && !o.userData.outline){ const h = new THREE.Mesh(o.geometry, M.glow); h.userData.outline = true; o.add(h); } }); sp.position.set(S.position.x, C.DY + .1, S.position.z); C.desk.add(sp); return { sp, a: (i - (list.length - 1)/2)*.6 }; });
        const glow = new THREE.PointLight(0xffd070, 3, 2); glow.position.set(S.position.x, C.DY + .3, S.position.z); C.desk.add(glow); C.glow = glow; }
      if (C.pops){ const k = Math.min(1, (C.pt - .5)/.7); C.pops.forEach((p, i) => { p.sp.position.set(S.position.x + Math.sin(p.a)*.22*k, C.DY + .08 + Math.sin(Math.PI*Math.min(1, k))*.12 + k*.04, S.position.z + .1*k); p.sp.userData.inner.rotation.y += dt*4; }); if (C.glow) C.glow.intensity = 3*(1 - Math.max(0, C.pt - 1.6)); }
      if (C.pt > 1.4 && !C.applied){ C.applied = true; completeQuest(C.q); }
      if (C.pt > 2.4 && !C.fin){ C.fin = true; (async () => { const d = C.done; C.done = null; await exitMarket(); d && d(true); })(); }
      break; }
  }
}
// public entry points
function officeScene(opts){ return new Promise(async res => { if (mode !== 'board' || busy || marketCtx){ res(null); return; } await enterMarket('office', opts); if (marketCtx && marketCtx.office) marketCtx.done = res; else res(null); }); }
function officeStart(C){
  const o = C.opts;
  if (o.mode === 'write'){ C.have = k => RES.includes(k) ? G.players[0].res[k] : ((G.players[0].special || {})[k] || 0); const qi = { obj: C.quill, type: 'quill' }; C.quill.traverse(m => { if (m.isMesh) m.userData.mk = { type: 'quill' }; }); C.items.push(qi);
    syncLetterModels(C); C.ph = 'compose'; C.ready = true; C.busy = false;
    mkSay(`Toca un <b>recuadro +</b> de la carta para elegir lo que ofreces y lo que pides. Luego <b>toca la pluma</b> para firmar.`, 4000);
    $('#mk-ui').innerHTML = '<button id="of-cancel">◀ Guardar la pluma</button>'; $('#of-cancel').onclick = () => { if (C.ph === 'compose'){ C.ph = 'cancel'; C.ready = false; } }; }
  else if (o.mode === 'quest'){ const q = o.q; const n = questPerson(q); n.g.position.set(-.0, 0, -5.4); C.sc.add(n.g); C.npc = n; C.q = q; C.L.g.visible = false;
    camera.position.set(0, 1.35, .52); controls.target.set(0, 1.25, -3); camera.lookAt(controls.target); C.ph = 'qdoor'; C.pt = 0; SFX.click?.(); }
}

