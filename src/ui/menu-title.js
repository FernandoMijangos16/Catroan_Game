// ================= MENU ART: the name written into a biome hexagon, and the models that keep falling =================
const GLYPHS = {
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
};
// ---------- the SwapHolm wordmark: block letters of brass and wood; the O is a little tile of one of the board's biomes ----------
const LOGO_BIOMES = ['bosque', 'pradera', 'cerro', 'campo', 'montana'];
function logoHex(biome, rnd = mulberry32(Math.floor(Math.random()*1e6)), town = false){
  const g = new THREE.Group(), t = { type: biome, x: 0, z: 0, i: Math.floor(rnd()*900) }, Y = (x, z) => tileHeight(t, x, z);
  g.add(hexTileMesh(t));
  const rim = new THREE.Mesh(sg(new THREE.CylinderGeometry(TILE_R*1.02, TILE_R*1.06, .1, 6)), icm(0xa8823a, { m: .55, r: .45 })); rim.rotation.y = Math.PI/6; rim.position.y = -.06; g.add(rim);
  const trees = new TreeBatch(.012), spot = (r0, r1) => { const a = rnd()*6.28, d = r0 + rnd()*(r1 - r0); return [Math.cos(a)*d, Math.sin(a)*d]; };
  const nTrees = { bosque: 12, pradera: 3, cerro: 3, campo: 2, montana: 4 }[biome];
  for (let k=0;k<nTrees;k++){ const [x, z] = spot(town ? .45 : .25, .78); trees.add(treeKindFor(biome, rnd), x, Y(x, z) - .004, z, .045 + rnd()*.02, rnd()*6.28, treeTint(biome === 'montana' || biome === 'cerro' ? 'pino' : 'roble', rnd)); }
  trees.build(g);
  if (biome === 'pradera') for (let k=0;k<3;k++){ const [x, z] = spot(.2, .6), a = makeAnimal('oveja', rnd).g; a.scale.setScalar(.11); a.position.set(x, Y(x, z), z); a.rotation.y = rnd()*6.28; g.add(a); }
  if (biome === 'cerro') for (let k=0;k<4;k++){ const [x, z] = spot(.15, .7), m = mesh(pick(GEO.rocks, rnd), pick([0xb8643a, 0x9c5a3a], rnd), x, Y(x, z), z, .09, .06, .08); m.rotation.y = rnd()*6; g.add(m); }
  if (town){ const h = boardHouse('#e0473b', true); h.scale.setScalar(2.1); h.position.set(.05, Y(.05, .05), .05); g.add(h); }
  return g;
}
function buildWordmark(biome){
  const word = 'SWAPHOLM', cells = [], cs = .1, gap = 6, letters = [];
  [...word].forEach((ch, i) => { if (ch === 'O') return; GLYPHS[ch].forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') cells.push({ i, x: i*gap + x, y }); })); });
  const W = (word.length*gap - 1)*cs, g = new THREE.Group();
  const brass = pxTex(8, 8, c => { for (let y=0;y<8;y++) for (let x=0;x<8;x++){ const k = .86 + hash2(x, y, 9)*.22 - (y > 5 ? .1 : 0); c.fillStyle = '#' + new THREE.Color(0xd8a840).multiplyScalar(k).getHexString(); c.fillRect(x, y, 1, 1); } });
  const face = keepMat(new THREE.MeshStandardMaterial({ map: brass, color: 0xffffff, metalness: .55, roughness: .45, flatShading: true })), wood = keepMat(new THREE.MeshStandardMaterial({ color: 0x4a2c16, roughness: .9, flatShading: true }));
  [...word].forEach((ch, i) => { const L = new THREE.Group(); L.position.x = -W/2 + (i*gap + 2)*cs + cs/2; g.add(L); letters.push(L); });
  // each lit pixel: a brass cube with a dark wooden backing, a little worn so every block reads on its own
  cells.forEach(({ i, x, y }) => { const L = letters[i], lx = (x - i*gap - 2)*cs, ly = (3 - y)*cs, j = (hash2(x, y, 4) - .5)*.012;
    const f = new THREE.Mesh(GEO.box, face); f.scale.set(cs*.98, cs*.98, cs*.5); f.position.set(lx, ly - cs*.47 + j, cs*.12); f.castShadow = true; L.add(f);
    const b = new THREE.Mesh(GEO.box, wood); b.scale.set(cs, cs, cs*.5); b.position.set(lx, ly - cs*.5, -cs*.3); L.add(b); });
  const O = letters[word.indexOf('O')], hex = spinner(logoHex(biome), cs*8.6); hex.rotation.x = .66; hex.position.y = -cs*.3; O.add(hex);   // tilted toward you, turning on its own axis
  return { g, letters, hex, biome };
}
function titleMask(text){
  const cells = []; let x0 = 0;
  for (const ch of text){ const g = GLYPHS[ch]; if (g) g.forEach((row, y) => [...row].forEach((c, x) => { if (c === '#') cells.push([x0 + x, y]); })); x0 += 6; }
  return { cells, w: x0 - 1, h: 7 };
}
function instField(geo, matl, list){
  const m = new THREE.InstancedMesh(geo, matl, Math.max(1, list.length)), o = new THREE.Object3D(), col = new THREE.Color();
  list.forEach((p, i) => { o.position.set(p.x, p.y || 0, p.z); o.rotation.set(p.rx || 0, p.ry || 0, p.rz || 0); o.scale.set(p.sx ?? 1, p.sy ?? 1, p.sz ?? 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); if (p.c != null) m.setColorAt(i, col.set(p.c)); });
  if (!list.length) m.count = 0; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; return m;
}
function groundTex(base, spots, seed){
  const B = new THREE.Color(base);
  return pxTex(32, 32, c => { for (let y=0;y<32;y++) for (let x=0;x<32;x++){ const n = hash2(x, y, seed), k = .82 + n*.3 - (hash2(x >> 2, y >> 2, seed + 3) > .8 ? .12 : 0); c.fillStyle = '#' + B.clone().multiplyScalar(k).getHexString(); c.fillRect(x, y, 1, 1); } (spots || []).forEach(([col, n]) => { for (let i=0;i<n;i++){ c.fillStyle = col; c.fillRect(Math.floor(hash2(i, 1, seed)*32), Math.floor(hash2(i, 2, seed)*32), 1 + (i % 2), 1); } }); });
}
// The title is an anamorphosis: every pixel of the letters is cast from the fixed menu camera onto the hexagon (onto the ground, or onto
// stumps, spires, rocks and sheep at different heights). Seen from that camera the pixels line up into CATROAN; from anywhere else
// they are just pieces scattered over the land.
const TITLE_CAM = { fov: 30, w: 720, h: 380, pos: [0, 2.28, 2.38], look: [0, .04, -.08] };
const TITLE_TERRAIN = { bosque: ['bosque', .2, 2.2], pradera: ['pradera', .26, 1.9], cerro: ['cerro', .26, 2.5], campo: ['campo', .2, 1.7], montana: ['montana', .5, 1.9] };
// biome: bosque · pradera · cerro · campo · montana; returns { g, biome, variant }
function titleHex(biome, variant){
  const g = new THREE.Group(), rnd = mulberry32(Math.floor(Math.random()*1e6)), seed = Math.floor(rnd()*900), [ttype, amp, freq] = TITLE_TERRAIN[biome];
  const R = TILE_R, IN = R*SQ3/2, hexD = (x, z) => Math.max(Math.abs(x), Math.abs(x*.5 + z*SQ3/2), Math.abs(-x*.5 + z*SQ3/2))/IN;
  const inHex = (x, z, m = .97) => hexD(x, z) < m;
  // a board tile with more relief, so the letters cast on it bend and scatter
  const hf = (x, z) => { const k = 1 - smoothstep(.74, 1, hexD(x, z)); if (k <= 0) return 0; const n = fbm(x*freq + seed, z*freq - seed*.7, 3);
    return (ttype === 'montana' ? Math.pow(n, 1.25)*1.35 : ttype === 'campo' ? Math.round(n*5)/5*.9 + n*.1 : n)*amp*k; };
  const Y = (x, z) => .2 + hf(x, z), T = { type: ttype, x: 0, z: 0, i: seed };
  { const n = 16, pos = [], corner = k => { const a = (60*k - 30)*Math.PI/180; return [R*Math.cos(a), R*Math.sin(a)]; };
    const tri = (a, b, c) => { const cr = (b[2] - a[2])*(c[0] - a[0]) - (b[0] - a[0])*(c[2] - a[2]); if (cr > 0) pos.push(...a, ...b, ...c); else pos.push(...a, ...c, ...b); };
    for (let k=0;k<6;k++){ const [ax, az] = corner(k), [bx, bz] = corner(k + 1);
      const P = (i, j) => { const x = ax*i/n + (bx - ax)*j/n, z = az*i/n + (bz - az)*j/n; return [x, hf(x, z), z]; };
      for (let i=0;i<n;i++) for (let j=0;j<=i;j++){ tri(P(i, j), P(i + 1, j), P(i + 1, j + 1)); if (j < i) tri(P(i, j), P(i + 1, j + 1), P(i, j + 1)); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    colorize(geo, (x, y, z, r) => tileColor(T, x, y/amp*TILE_AMP[ttype], z, r), mulberry32(seed));
    const m = new THREE.Mesh(geo, LP_BOARD); m.position.y = .2; m.receiveShadow = true; g.add(m); }
  const side = keepMat(new THREE.MeshStandardMaterial({ map: groundTex(ttype === 'montana' ? 0x5a5c62 : 0x5a3a22, [['#3a2414', 120], ['#6a4a2a', 60]], 5), roughness: 1, flatShading: true }));
  const body = new THREE.Mesh(sg(new THREE.CylinderGeometry(R*.999, R*1.02, .12, 6)), side); body.position.y = .14; g.add(body);   // a thin slab   // same corners as the tile (pointing to ±z)
  // the camera the menu will look from: everything is cast from it
  const cam = new THREE.PerspectiveCamera(TITLE_CAM.fov, TITLE_CAM.w/TITLE_CAM.h, .1, 50); cam.position.set(...TITLE_CAM.pos); cam.lookAt(...TITLE_CAM.look); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const M = titleMask('CATROAN'), X0 = .52, cw = 2*X0/(M.w + 1), ch = cw*cam.aspect, Yc = .06;
  const cellNdc = (cx, cy, u = .5, v = .5) => [-X0 + (cx + u)*cw, Yc + (M.h/2 - cy - v)*ch];
  const ray = (nx, ny) => { const p = new THREE.Vector3(nx, ny, .5).unproject(cam); return { o: cam.position.clone(), d: p.sub(cam.position).normalize() }; };
  // walk down a ray until it is h above the land
  const hitAt = (r, h) => { let t0 = .5, t1 = 0, p = new THREE.Vector3();
    for (let t = .5; t < 8; t += .01){ p.copy(r.o).addScaledVector(r.d, t); if (p.y <= Y(p.x, p.z) + h){ t1 = t; break; } t0 = t; }
    if (!t1) return null; for (let k=0;k<12;k++){ const tm = (t0 + t1)/2; p.copy(r.o).addScaledVector(r.d, tm); if (p.y <= Y(p.x, p.z) + h) t1 = tm; else t0 = tm; }
    return p.copy(r.o).addScaledVector(r.d, t1); };
  const onPlane = (r, y) => r.o.clone().addScaledVector(r.d, (y - r.o.y)/r.d.y);
  // where the letters sit on screen, so nothing else is put in front of them
  const LS = new Set(M.cells.map(([x, y]) => x + ',' + y)), v3 = new THREE.Vector3();
  const coversText = (x, y0, z, y1, pad = 1, rad = .03) => { for (let k=0;k<=8;k++){ const dx0 = (k % 3 - 1)*rad; v3.set(x + dx0, y0 + (y1 - y0)*Math.floor(k/2)/4, z).project(cam); const cx = Math.floor((v3.x + X0)/cw), cy = Math.floor(M.h/2 - (v3.y - Yc)/ch);
    for (let dx=-pad;dx<=pad;dx++) for (let dy=-pad;dy<=pad;dy++) if (LS.has((cx + dx) + ',' + (cy + dy))) return true; } return false; };
  // geometry of the cast pixels: quads (caps and decals) and the posts under them, colored per vertex
  const pos = [], col = [], C = new THREE.Color();
  const quad = (a, b, c, d, hex, k = 1) => { C.set(hex).multiplyScalar(k); [a, b, c, a, c, d].forEach(p => { pos.push(p.x, p.y, p.z); col.push(C.r, C.g, C.b); }); };
  const shrink = (pts, f) => { const m = pts.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1/pts.length); return pts.map(p => p.clone().lerp(m, f)); };
  const cellRays = (cx, cy) => [[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, v]) => ray(...cellNdc(cx, cy, u, v)));
  const decal = (cx, cy, hex, lift = .004) => { const pts = cellRays(cx, cy).map(r => hitAt(r, lift)); if (pts.some(p => !p || !inHex(p.x, p.z))) return false; const [a, b, c, d] = shrink(pts, .06); quad(a, d, c, b, hex, .9 + rnd()*.2); return true; };
  // a cap h above the land with a post (or a rock, a stump…) under it; the post is narrower so it hides almost nothing behind
  const posted = (cx, cy, h, capHex, postHex, o = {}) => {
    const cr = ray(...cellNdc(cx, cy)), P = hitAt(cr, h); if (!P || !inHex(P.x, P.z, .9)) return false;
    const top = shrink(cellRays(cx, cy).map(r => onPlane(r, P.y)), .05), th = o.th ?? .012, bot = top.map(p => p.clone().setY(p.y - th));
    quad(top[0], top[3], top[2], top[1], capHex, .92 + rnd()*.16);
    for (let k=0;k<4;k++){ const a = top[k], b = top[(k + 1) % 4], c = bot[(k + 1) % 4], d = bot[k]; quad(a, b, c, d, o.rimHex ?? capHex, .62); }
    const post = shrink(bot, 1 - (o.narrow ?? .32)), base = post.map(p => p.clone().setY(Y(p.x, p.z) - .02));
    if (P.y - th - Y(P.x, P.z) > .006) for (let k=0;k<4;k++){ const a = post[k], b = post[(k + 1) % 4], c = base[(k + 1) % 4], d = base[k]; quad(a, b, c, d, postHex, .55 + (k % 2)*.25); }
    return P; };
  const trees = new TreeBatch(.012), deco = (n, place) => { for (let i=0, k=0; i<n && k<n*8; k++){ const x = (rnd()*2 - 1)*R, z = (rnd()*2 - 1)*R; if (!inHex(x, z, .9)) continue; if (place(x, z, Y(x, z))) i++; } };
  const B = (c, o) => keepMat(new THREE.MeshStandardMaterial({ color: c, roughness: .85, flatShading: true, ...o }));
  const putAnimal = (kind, x, z, s, ry) => { const a = makeAnimal(kind, rnd).g; const bb = new THREE.Box3().setFromObject(a), sz = bb.getSize(new THREE.Vector3()); a.scale.setScalar(s/Math.max(sz.x, sz.y, sz.z)); a.position.set(x, Y(x, z), z); a.rotation.y = ry; g.add(a); return a; };
  const cells = M.cells;
  if (biome === 'bosque'){
    const burnt = variant === 'quemado';
    cells.forEach(([cx, cy]) => { const ok = posted(cx, cy, .012 + rnd()*.2, burnt ? pick([0xff7a22, 0xf06418, 0xffa040, 0xe8501a], rnd) : pick([0xe8c48a, 0xd8b07a, 0xf0d29c], rnd), burnt ? 0x16110d : 0x4a3020, { rimHex: burnt ? 0x1a1310 : 0x7a5232, narrow: .18 }); if (!ok) decal(cx, cy, burnt ? 0x221a14 : 0xb08858); });
    deco(160, (x, z, y) => { if (coversText(x, y, z, y + .26, 2, .06)) return false; trees.add(treeKindFor('bosque', rnd), x, y - .004, z, .02 + rnd()*.014, rnd()*6.28, burnt ? 0x3a3430 : treeTint('abeto', rnd)); return true; });
    if (!burnt) deco(6, (x, z, y) => { if (coversText(x, y, z, y + .02)) return false; const lg = mesh(GEO.cyl, 0x6a4428, x, y + .012, z, .012, .08, .012); lg.rotation.set(0, rnd()*3, Math.PI/2); g.add(lg); return true; });
  } else if (biome === 'pradera'){
    if (variant === 'ovejas'){
      const wool = [0xf4f0e6, 0xe8e2d4, 0xfaf6ee];
      cells.forEach(([cx, cy]) => { const h = rnd() < .45 ? .02 : .03 + rnd()*.16; if (!posted(cx, cy, h, pick(wool, rnd), h > .025 ? pick([0x7a7a72, 0x8a8a80, 0x5f7a4a], rnd) : 0x2e2a28, { th: .022, rimHex: 0xd8d2c4, narrow: h > .025 ? .08 : .5 })) decal(cx, cy, pick(wool, rnd)); });
      deco(12, (x, z, y) => coversText(x, y, z, y + .05) ? false : !!putAnimal('oveja', x, z, .07, rnd()*6.28));
    } else {
      cells.forEach(([cx, cy]) => { const c = pick([0x8a6a3a, 0x7a5a30, 0x9a7a44, 0x6e5028], rnd); if (rnd() < .55 && posted(cx, cy, .02 + rnd()*.14, c, 0x6a4a2a, { th: .02, rimHex: 0x5a3e22, narrow: .85 })) return; decal(cx, cy, c); });   // the trodden path, partly over little dirt mounds
      const end = cells.reduce((a, b) => b[0] > a[0] ? b : a), P = hitAt(ray(...cellNdc(end[0] + 1, end[1] + 2)), 0);
      if (P && inHex(P.x - .14, P.z, .85)) [0, 1, 2].forEach(k => putAnimal('oveja', P.x - k*.06, P.z + .02 + k*.04, .075, 2.4 + rnd()*.4));
      deco(8, (x, z, y) => coversText(x, y, z, y + .05) ? false : !!putAnimal('oveja', x, z, .065, rnd()*6.28));
    }
    deco(14, (x, z, y) => { if (coversText(x, y, z, y + .22, 2, .06)) return false; trees.add(treeKindFor('pradera', rnd), x, y - .004, z, .022 + rnd()*.01, rnd()*6.28, treeTint('roble', rnd)); return true; });
  } else if (biome === 'cerro'){
    const ore = { oro: [0xf2c44a, 0xa07818], plata: [0xe2e6ec, 0x8a8e96], turquesa: [0x4ad8c4, 0x1a7a6a] }[variant] || [0xf2c44a, 0xa07818];
    cells.forEach(([cx, cy]) => { const h = rnd() < .3 ? 0 : .02 + rnd()*.2; if (h === 0 || !posted(cx, cy, h, pick([ore[0], ore[0], ore[1]], rnd), pick([0xa8553a, 0x8f4a32, 0xb8643a], rnd), { rimHex: ore[1], narrow: .22 })) decal(cx, cy, ore[0]); });
    deco(18, (x, z, y) => { if (coversText(x, y, z, y + .05)) return false; const m = mesh(pick(GEO.rocks, rnd), pick([0xb8643a, 0x9c5a3a], rnd), x, y + .01, z, .05, .035, .045); m.rotation.y = rnd()*6; g.add(m); return true; });
    deco(8, (x, z, y) => { if (coversText(x, y, z, y + .18, 2, .05)) return false; trees.add(treeKindFor('cerro', rnd), x, y - .004, z, .018 + rnd()*.008, rnd()*6.28, treeTint('pino', rnd)); return true; });
  } else if (biome === 'campo'){
    const green = variant === 'verde';
    cells.forEach(([cx, cy]) => { if (rnd() < .6){ if (posted(cx, cy, .03 + rnd()*.16, green ? pick([0x5aa83a, 0x6ab844], rnd) : pick([0x3a2810, 0x4a3418, 0x2e200c], rnd), 0x5a4020, { th: .03, rimHex: green ? 0x3a7a2a : 0x2a1c0a, narrow: .3 })) return; } decal(cx, cy, green ? pick([0x5aa83a, 0x6ab844, 0x4a9a32], rnd) : pick([0x3a2810, 0x4a3418, 0x2e200c], rnd)); });
    const stalks = []; deco(900, (x, z, y) => { if (coversText(x, y, z, y + .06, 2, .015)) return false; stalks.push({ x, z, y: y + .02, sx: .006, sy: .04 + rnd()*.02, sz: .006, rx: (rnd() - .5)*.25, c: pick([0xe3c46a, 0xd8b450, 0xf0d27a], rnd) }); return true; });
    g.add(instField(GEO.box, B(0xffffff), stalks));
    deco(3, (x, z, y) => { if (coversText(x, y, z, y + .1)) return false; trees.add('alamo', x, y - .004, z, .016, rnd()*6.28, treeTint('alamo', rnd)); return true; });
  } else {
    cells.forEach(([cx, cy]) => { if (rnd() < .45 && posted(cx, cy, .02 + rnd()*.16, 0x1a1714, 0x6a6c72, { rimHex: 0x2a2622, narrow: .4 })) return; decal(cx, cy, pick([0x14110e, 0x1e1a16, 0x26211c], rnd)); });
    deco(14, (x, z, y) => { if (coversText(x, y, z, y + .05)) return false; const m = mesh(pick(GEO.rocks, rnd), 0x8b8f98, x, y + .01, z, .05, .04, .045); m.rotation.y = rnd()*6; g.add(m); return true; });
    deco(10, (x, z, y) => { if (y > .4 || coversText(x, y, z, y + .18, 2, .05)) return false; trees.add(rnd() < .6 ? 'abeto' : 'pino', x, y - .004, z, .016 + rnd()*.006, rnd()*6.28, treeTint('pino', rnd)); return true; });
  }
  trees.build(g);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const px = new THREE.Mesh(geo, keepMat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8, flatShading: true, side: THREE.DoubleSide, emissive: biome === 'cerro' || variant === 'quemado' ? 0x2a1a08 : 0x000000 }))); px.castShadow = true; g.add(px);
  return { g, biome, variant };
}
const TITLE_BIOMES = [['bosque', ['talado', 'quemado']], ['pradera', ['ovejas', 'sendero']], ['cerro', ['oro', 'plata', 'turquesa']], ['campo', ['cortado', 'verde']], ['montana', ['grietas']]];
function randomTitleHex(){ const [b, vs] = pick(TITLE_BIOMES); return titleHex(b, pick(vs)); }
// ---------- the rain of models behind the menu ----------
// big, slow and tilted, down both sides of the screen (the middle stays clear for the title and the options)
function fallingView(canvas){
  const v = miniView(canvas, { w: innerWidth, h: innerHeight, res: .42, fov: 50, fps: 30, tick: (dt) => step(dt) });
  v.cam.position.set(0, 0, 10); v.cam.lookAt(0, 0, 0);
  const pool = [], kinds = [...Array(40).fill(0).map((_, i) => ({ k: RES[i % 5] })), ...['margarita', 'amapola', 'hongo', 'miel', 'cristal', 'ambar'].filter(k => SPECIAL[k]).map(k => ({ k, rare: 1 })), ...['ojo', 'trebol', 'escudo', 'pluma'].map(k => ({ k, am: 1, rare: 2 }))];
  const halfH = z => Math.tan(THREE.MathUtils.degToRad(25))*(10 - z);
  let side = 0;
  const spawn = (o, first) => { const z = -5 + Math.random()*5, hh = halfH(z), hw = hh*v.cam.aspect, s = (side++ % 2) ? 1 : -1;
    const band = Math.random() < .22 ? Math.random()*.35 : .45 + Math.random()*.62;   // mostly at the sides, now and then through the middle
    o.z = z; o.g.position.set(s*hw*band, first ? (Math.random()*2 - 1)*hh : hh + 1.5 + Math.random()*(o.rare ? 12 : 5), z);
    o.vy = .45 + Math.random()*.55; o.g.rotation.set((Math.random() - .5)*2.2, Math.random()*Math.PI*2, (Math.random() - .5)*1.8); };   // no spin while falling: each one keeps its own tilt
  kinds.forEach(d => { const m = d.am ? amuletModel(d.k) : itemOf(d.k), sp = spinner(m, 1.5 + Math.random()*.9); const o = { g: sp, rare: d.rare }; v.sc.add(sp); spawn(o, !d.rare); pool.push(o); });
  function step(dt){ pool.forEach(o => { o.g.position.y -= o.vy*dt; if (o.g.position.y < -halfH(o.z) - 2) spawn(o); }); }
  v.fit = () => v.resize(innerWidth, innerHeight);
  return v;
}
