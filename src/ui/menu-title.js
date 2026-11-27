// ================= MENU ART: the SwapHolm wordmark (its O is a biome hexagon), and the models that keep falling =================
const GLYPHS = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
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
  // hexTileMesh already sits .2 up: everything on it goes at .2 + the relief, like on the board
  const g = new THREE.Group(), t = { type: biome, x: 0, z: 0, i: Math.floor(rnd()*900) }, Y = (x, z) => .2 + tileHeight(t, x, z);
  g.add(hexTileMesh(t));
  const side = new THREE.Mesh(GEO.hexSide, mat(0x7a5c40)); side.position.y = .1; g.add(side);   // the earth wall, as on the board
  const rim = new THREE.Mesh(sg(new THREE.CylinderGeometry(TILE_R*1.02, TILE_R*1.06, .1, 6)), icm(0xa8823a, { m: .55, r: .45 })); rim.rotation.y = Math.PI/6; rim.position.y = .03; g.add(rim);
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
function groundTex(base, spots, seed){
  const B = new THREE.Color(base);
  return pxTex(32, 32, c => { for (let y=0;y<32;y++) for (let x=0;x<32;x++){ const n = hash2(x, y, seed), k = .82 + n*.3 - (hash2(x >> 2, y >> 2, seed + 3) > .8 ? .12 : 0); c.fillStyle = '#' + B.clone().multiplyScalar(k).getHexString(); c.fillRect(x, y, 1, 1); } (spots || []).forEach(([col, n]) => { for (let i=0;i<n;i++){ c.fillStyle = col; c.fillRect(Math.floor(hash2(i, 1, seed)*32), Math.floor(hash2(i, 2, seed)*32), 1 + (i % 2), 1); } }); });
}
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
