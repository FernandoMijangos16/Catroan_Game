function cardModel(k){
  const A = itemAssets(), g = new THREE.Group();
  const add = (geo, m, x, y, z, sx, sy, sz, rx=0, ry=0, rz=0) => { const o = new THREE.Mesh(geo, m.isMaterial ? m : mat(m)); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx, ry, rz); g.add(o); return o; };
  const goldM = keepMat(new THREE.MeshStandardMaterial({ color: 0xe0b040, metalness: .7, roughness: .3, envMap: A.env, flatShading: true }));
  switch (k){
    case 'caballero': {
      add(GEO.cyl, 0xa8322a, 0, 0, -.05, .32, .06, .38, Math.PI/2);
      add(GEO.cyl, goldM, 0, 0, -.06, .35, .04, .41, Math.PI/2);
      add(GEO.box, 0xf0e0c0, 0, .0, .02, .06, .4, .02); add(GEO.box, 0xf0e0c0, 0, .12, .02, .3, .06, .02);
      const sw = new THREE.Group(); sw.rotation.z = -.75; sw.position.set(.05, .05, .1); g.add(sw);
      sw.add(new THREE.Mesh(GEO.box, A.m.metal)).scale.set(.06, .62, .015); sw.children[0].position.y = -.05;
      const gd = new THREE.Mesh(GEO.box, goldM); gd.scale.set(.24, .04, .04); gd.position.y = -.08; sw.add(gd);
      const gr = new THREE.Mesh(GEO.box, mat(0x5a3720)); gr.scale.set(.04, .14, .04); gr.position.y = -.22; sw.add(gr);
      const pm = new THREE.Mesh(GEO.sphere, goldM); pm.scale.setScalar(.035); pm.position.y = -.24; sw.add(pm);
      break; }
    case 'punto': {
      add(sg(new THREE.CylinderGeometry(.3, .3, .16, 12, 1, true)), goldM, 0, 0, 0, 1, 1, 1);
      for (let i=0;i<6;i++){ const a = i/6*6.28; add(GEO.cone6, goldM, Math.cos(a)*.29, .08, Math.sin(a)*.29, .06, .16, .06); add(GEO.sphere, i % 2 ? 0x2f6ac8 : 0xc8322f, Math.cos(a)*.31, .0, Math.sin(a)*.31, .035, .035, .035); }
      add(GEO.cyl, 0x7a1a2a, 0, -.06, 0, .27, .2, .27);
      break; }
    case 'caminos': {
      const r1 = fencedRoad(0, { x: -.5, z: 0 }, { x: .5, z: 0 }); r1.position.set(0, -.2, 0); r1.scale.setScalar(1.1); r1.rotation.y = .5; g.add(r1);
      const r2 = fencedRoad(0, { x: -.5, z: 0 }, { x: .5, z: 0 }); r2.position.set(.1, -.2, -.25); r2.scale.setScalar(.9); r2.rotation.y = -.7; g.add(r2);
      add(GEO.box, 0x6b4a2f, .32, 0, .1, .025, .3, .025); add(GEO.box, 0xc9a06a, .38, .22, .1, .16, .06, .02);
      break; }
    case 'abundancia': {
      for (let i=0;i<5;i++){ const t = i/4, r = .17 - t*.13; add(GEO.cyl, i % 2 ? 0xc9963a : 0xb07a2a, -.05 - t*.3, .05 + t*t*.25, 0, r, .1, r, 0, 0, Math.PI/2 + t*1.1); }
      [['trigo', .2, -.05, .05, .45], ['madera', .14, -.08, -.14, .4], ['lana', .26, -.02, .2, .38]].forEach(([res, x, y, z, s]) => { const it = makeResourceItem(res); it.scale.setScalar(s); it.position.set(x, y - .08, z); it.rotation.y = x*4; g.add(it); });
      add(GEO.sphere, 0xd03a2a, .05, -.04, .25, .06, .06, .06);
      break; }
    case 'monopolio': {
      add(GEO.box, 0x6b4a2f, 0, -.15, 0, .5, .26, .32); add(GEO.box, goldM, 0, -.15, 0, .52, .04, .34); add(GEO.box, goldM, 0, -.02, .16, .08, .08, .02);
      const lid = add(sg(new THREE.CylinderGeometry(.16, .16, .5, 10, 1, false, 0, Math.PI)), 0x7a5232, 0, .11, -.16, 1, 1, 1, 0, 0, Math.PI/2); lid.rotation.x = -1.1;
      for (let i=0;i<9;i++) add(GEO.cyl, goldM, (i % 3 - 1)*.12 + (i*.37 % .05), .1 + Math.floor(i/3)*.02, (Math.floor(i/3) - 1)*.07, .05, .012, .05, .3*i, 0, .2*i);
      const b = makeResourceItem('ladrillo'); b.scale.setScalar(.5); b.position.set(.05, .12, .02); b.rotation.set(.3, .5, .2); g.add(b);
      break; }
    case 'mercader': {
      add(GEO.cyl, 0x6b4a2f, 0, -.3, 0, .14, .04, .14); add(GEO.box, 0x6b4a2f, 0, -.28, 0, .03, .5, .03);
      add(GEO.box, goldM, 0, .2, 0, .62, .025, .025); add(GEO.sphere, goldM, 0, .22, 0, .04, .04, .04);
      [-1, 1].forEach(sd => { add(GEO.box, 0x9a8a70, sd*.29, .07, 0, .004, .26, .004); add(GEO.cyl, goldM, sd*.29, -.07, 0, .13, .025, .13); for (let i=0;i<3;i++) add(GEO.cyl, 0xf0c850, sd*.29 + (i - 1)*.03, -.045 + i*.014, 0, .045, .012, .045); });
      break; }
    case 'espia': {
      const mk = 0x1d1a22;
      [-1, 1].forEach(sd => { add(GEO.sphere, mk, sd*.13, .05, 0, .16, .1, .06, 0, 0, sd*.25); add(GEO.sphere, 0xf6e7c1, sd*.12, .055, .045, .05, .025, .02); add(GEO.sphere, 0x101010, sd*.12, .055, .055, .02, .02, .01); });
      add(GEO.box, mk, 0, .05, -.01, .1, .05, .04); add(GEO.box, 0x5a2a6a, 0, .06, -.04, .62, .025, .01);
      const dg = new THREE.Group(); dg.position.set(.05, -.22, .05); dg.rotation.z = 1.2; g.add(dg);
      const bl = new THREE.Mesh(GEO.cone4, A.m.metal); bl.scale.set(.04, .32, .015); dg.add(bl);
      const hd = new THREE.Mesh(GEO.box, goldM); hd.scale.set(.14, .03, .03); dg.add(hd);
      const gp = new THREE.Mesh(GEO.box, mat(0x3a2418)); gp.scale.set(.035, .12, .035); gp.position.y = -.08; dg.add(gp);
      break; }
    case 'cosecha': {
      add(sg(new THREE.CylinderGeometry(.32, .24, .22, 10, 1, true)), A.m.straw, 0, -.12, 0, 1, 1, 1);
      add(GEO.cyl, 0x8a6430, 0, -.24, 0, .24, .02, .24);
      add(sg(new THREE.TorusGeometry(.3, .02, 4, 12, Math.PI)), A.m.twine, 0, -.02, 0, 1, 1.2, 1);
      [[-.1, .0, .05, 0xd03a2a], [.08, .0, .1, 0xe8a030], [.12, -.01, -.08, 0xd03a2a], [-.05, .02, -.1, 0x7ab040]].forEach(([x, y, z, c]) => add(GEO.sphere, c, x, y, z, .08, .08, .08));
      add(GEO.sphere, 0xe07a20, 0, .06, 0, .13, .1, .13);
      for (let i=0;i<7;i++){ const a = i*.9; add(GEO.box, 0xe6c058, Math.cos(a)*.12, .1, Math.sin(a)*.12, .01, .3, .01, Math.sin(a)*.3, 0, Math.cos(a)*.3); }
      break; }
  }
  g.traverse(o => { if (o.isMesh){ o.castShadow = true; } });
  return outlineItem(g);
}
function cardMesh(){
  const back = cardBackTex(), side = keepMat(new THREE.MeshStandardMaterial({ color: 0xe9dcc0 })), face = keepMat(new THREE.MeshStandardMaterial({ map: back, roughness: .8 }));
  const m = new THREE.Mesh(sg(new THREE.BoxGeometry(.5, .7, .04)), [side, side, side, side, face, face]); m.castShadow = true;
  const g = new THREE.Group(); g.add(m); return outlineItem(g);
}
const CARD_BACKS = new Map();
function cardBackTex(color){
  const key = String(color || 'base'); if (CARD_BACKS.has(key)) return CARD_BACKS.get(key);
  const t = new THREE.CanvasTexture(cardBackCanvas(color)); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; CARD_BACKS.set(key, t); return t;
}
const CARD_BACK_URL = new Map();
const cardBackURL = color => CARD_BACK_URL.get(color) || (CARD_BACK_URL.set(color, cardBackCanvas(color).toDataURL()), CARD_BACK_URL.get(color));
// ---- worn velvet cards in the owner's colour; the corners are plated in a different mineral for each card
const MINERAL = { caballero: ['Hierro', 0x8c9096], punto: ['Oro', 0xe2b442], caminos: ['Cobre', 0xc2703c], abundancia: ['Esmeralda', 0x2fa860], monopolio: ['Rubí', 0xc4283c], mercader: ['Plata', 0xccd0d6], espia: ['Amatista', 0x8e4ccc], cosecha: ['Ámbar', 0xe08c22] };
function velvetBase(color){ const B = new THREE.Color(color || '#56407e'), h = {}; B.getHSL(h); return new THREE.Color().setHSL(h.h, Math.min(.55, h.s*.85), Math.min(.19, Math.max(.085, h.l*.36))); }
function velvet(c, x0, y0, w, h, color, seed){
  const base = velvetBase(color), grey = new THREE.Color(0x6a6058);
  for (let y=0;y<h;y++) for (let x=0;x<w;x++){
    const u = x/w, v = y/h, n = hash2(x, y, seed), nap = ((x + Math.floor(y*.34) + seed) % 5 === 0) ? -.07 : 0;
    const d = u - v*.62 - .2, sheen = Math.exp(-d*d/.018)*.14, edge = Math.min(u, v, 1 - u, 1 - v), vig = edge < .08 ? -(.08 - edge)*2.4 : 0;
    let k = .8 + n*.24 + nap + sheen + vig; const rub = hash2(x >> 2, y >> 2, seed + 9) > .87 && (edge < .22 || Math.abs(u - .5) < .1);
    k = Math.round(k*14)/14;                                                     // stepped tones read as pixels
    const col = base.clone().multiplyScalar(k + (rub ? .1 : 0)); if (rub) col.lerp(grey, .22);
    const n2 = hash2(x, y, seed + 31), n3 = hash2(x >> 1, y >> 1, seed + 47); col.offsetHSL((n2 - .5)*.035, (n3 - .5)*.12, (hash2(x, y, seed + 53) > .94 ? .025 : 0));
    c.fillStyle = '#' + col.getHexString(); c.fillRect(x0 + x, y0 + y, 1, 1);
  }
}
function mineralTone(m, k){ return '#' + new THREE.Color(m).multiplyScalar(k).getHexString(); }
function mineralCorners(c, W, H, m, sz, seed){
  // rounded brackets: a quarter ring that follows the card's rounded corner
  const T = [.32, .55, .8, 1.02, 1.28].map(k => mineralTone(m, k)), R = cardRadius(W);
  for (let q=0;q<4;q++){ const fx = q & 1, fy = q >> 1;
    for (let y=0;y<sz;y++) for (let x=0;x<sz;x++){
      const dOut = Math.hypot(Math.max(0, R - x - .5), Math.max(0, R - y - .5)), dIn = Math.hypot(sz - x - .5, sz - y - .5);
      if (dOut > R || dIn < sz*.62) continue;
      const edge = dOut > R - 1.1 || dIn < sz*.62 + 1.1;
      let t = edge ? 0 : dIn > sz*.95 ? 4 : dIn > sz*.82 ? 3 : 2; if (!edge && hash2(x, y, seed + q) > .86) t = Math.max(1, t - 2);
      c.fillStyle = T[t]; c.fillRect(fx ? W - 1 - x : x, fy ? H - 1 - y : y, 1, 1); } }
}
const cardRadius = W => Math.max(3, Math.round(W*.075));
// cut the card's corners round, with a dark rim
function roundCard(c, W, H){
  const R = cardRadius(W);
  for (let q=0;q<4;q++){ const fx = q & 1, fy = q >> 1;
    for (let y=0;y<R;y++) for (let x=0;x<R;x++){ const d = Math.hypot(R - x - .5, R - y - .5), px = fx ? W - 1 - x : x, py = fy ? H - 1 - y : y;
      if (d > R) c.clearRect(px, py, 1, 1); else if (d > R - 1.1){ c.fillStyle = '#0b0705'; c.fillRect(px, py, 1, 1); } } }
}
function cardFaceCanvas(k, color, S){
  const d = CARD_DEFS[k], m = (MINERAL[k] || ['', 0xc8a040])[1], W = 90, H = 126, cv = document.createElement('canvas'); cv.width = W*S; cv.height = H*S; const c = cv.getContext('2d'); c.scale(S, S); c.imageSmoothingEnabled = false;
  const seed = k.length*13 + 7, base = velvetBase(color);
  c.fillStyle = '#0b0705'; c.fillRect(0, 0, W, H);
  velvet(c, 1, 1, W - 2, H - 2, color, seed);
  // name band
  c.fillStyle = 'rgba(0,0,0,.38)'; c.fillRect(7, 7, W - 14, 17); c.fillStyle = mineralTone(m, .7); c.fillRect(7, 24, W - 14, 1);
  c.font = `700 ${d.name.length > 14 ? 8 : 10}px 'Pixelify Sans', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const words = d.name.split(' '), line = (t, y) => { c.fillStyle = '#0b0705'; c.fillText(t, 45, y + 1); c.fillStyle = '#e6d4a2'; c.fillText(t, 45, y); };
  if (d.name.length > 14 && words.length > 1){ const h = Math.ceil(words.length/2); line(words.slice(0, h).join(' '), 12); line(words.slice(h).join(' '), 20); } else line(d.name, 16);
  // art window: deeper velvet, a thin mineral rim
  const gr = c.createRadialGradient(45, 62, 4, 45, 62, 42); gr.addColorStop(0, '#' + base.clone().multiplyScalar(1.45).getHexString()); gr.addColorStop(1, '#' + base.clone().multiplyScalar(.5).getHexString()); c.fillStyle = gr; c.fillRect(11, 29, 68, 66);
  c.fillStyle = mineralTone(m, .62); c.fillRect(10, 28, 70, 1); c.fillRect(10, 95, 70, 1); c.fillRect(10, 28, 1, 68); c.fillRect(79, 28, 1, 68);
  c.fillStyle = mineralTone(m, 1.05); c.fillRect(11, 29, 68, 1); c.fillRect(11, 29, 1, 66);
  const art = S > 1 && ART2[k] ? ART2[k] : ART1[k]; if (art) c.drawImage(art, 9, 26, 72, 72);
  // kind plaque in the card's mineral
  c.fillStyle = mineralTone(m, .45); c.fillRect(22, 102, 46, 12); c.fillStyle = mineralTone(m, .85); c.fillRect(23, 103, 44, 10); c.fillStyle = mineralTone(m, 1.15); c.fillRect(23, 103, 44, 1);
  c.font = `700 7px 'Pixelify Sans', monospace`; c.fillStyle = '#140c06'; c.fillText(d.kind.toUpperCase(), 45, 108.5);
  mineralCorners(c, W, H, m, 13, seed);
  c.fillStyle = 'rgba(28,18,10,.1)'; c.fillRect(0, 0, W, H);           // years of play took some of the shine
  c.fillStyle = '#0b0705'; c.fillRect(0, 0, W, 1); c.fillRect(0, H - 1, W, 1); c.fillRect(0, 0, 1, H); c.fillRect(W - 1, 0, 1, H);   // crisp edge
  roundCard(c, W, H);
  return cv;
}
const CARD_FACE = new Map();
function cardFaceURL(k, color, S = 1){ const key = k + '|' + color + '|' + S; if (!CARD_FACE.has(key)) CARD_FACE.set(key, cardFaceCanvas(k, color, S).toDataURL()); return CARD_FACE.get(key); }
function cardBackCanvas(color){
  const W = 60, H = 84, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'), gold = 0xc8a040;
  c.fillStyle = '#0b0705'; c.fillRect(0, 0, W, H); velvet(c, 1, 1, W - 2, H - 2, color, 3);
  c.fillStyle = mineralTone(gold, .6); c.fillRect(5, 5, W - 10, 1); c.fillRect(5, H - 6, W - 10, 1); c.fillRect(5, 5, 1, H - 10); c.fillRect(W - 6, 5, 1, H - 10);
  const hex = (r, col) => { c.fillStyle = col; c.beginPath(); for (let k=0;k<6;k++){ const a = (60*k - 30)*Math.PI/180; c.lineTo(30 + Math.cos(a)*r, 42 + Math.sin(a)*r); } c.fill(); };
  hex(14, '#0b0705'); hex(12.5, mineralTone(gold, .75)); hex(10.5, mineralTone(gold, 1)); hex(8, '#' + velvetBase(color).getHexString());
  c.fillStyle = mineralTone(gold, 1.1); c.font = 'bold 11px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('C', 30, 43);
  mineralCorners(c, W, H, gold, 9, 5);
  c.fillStyle = 'rgba(28,18,10,.1)'; c.fillRect(0, 0, W, H);
  roundCard(c, W, H);
  return cv;
}
function renderCardArt(){
  let r2; try { r2 = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true }); } catch { return; }
  r2.setSize(72, 72); r2.setPixelRatio(1); r2.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xfff4e0, 0x4a3a2a, 2.2)); const dl = new THREE.DirectionalLight(0xfff0d8, 2.8); dl.position.set(2, 3, 3); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(30, 1, .05, 20);
  const art = {};
  Object.keys(CARD_DEFS).forEach(k => {
    const it = cardModel(k); it.rotation.set(.25, -.45, 0); sc.add(it);
    const box = new THREE.Box3().setFromObject(it), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()).length();
    cam.position.set(c.x + sz*.25, c.y + sz*.45, c.z + sz*1.45); cam.lookAt(c); r2.setSize(72, 72); r2.render(sc, cam);
    const a = document.createElement('canvas'); a.width = a.height = 72; a.getContext('2d').drawImage(r2.domElement, 0, 0); art[k] = a;
    r2.setSize(160, 160); r2.render(sc, cam); const a2 = document.createElement('canvas'); a2.width = a2.height = 160; a2.getContext('2d').drawImage(r2.domElement, 0, 0); ART2[k] = a2;
    sc.remove(it);
  });
  r2.dispose(); r2.forceContextLoss?.();
  Object.assign(ART1, art);
}
// ---------- hand: fan of half-hidden cards at the bottom left ----------
