// ================= MENU ART: the SwapHolm wordmark (its O is a biome hexagon), and the models that keep falling =================
const GLYPHS = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
};
// ---------- the SwapHolm wordmark: letters piled out of one resource; the O is a little tile of the biome that gives it ----------
const LOGO_BIOMES = ['bosque', 'pradera', 'cerro', 'campo', 'montana'];
function logoHex(biome, rnd = mulberry32(Math.floor(Math.random()*1e6)), town = false){
  // hexTileMesh already sits .2 up: everything on it goes at .2 + the relief, like on the board
  const g = new THREE.Group(), t = { type: biome, x: 0, z: 0, i: Math.floor(rnd()*900) }, Y = (x, z) => .2 + tileHeight(t, x, z);
  g.add(hexTileMesh(t));
  const side = new THREE.Mesh(GEO.hexSide, mat(0x7a5c40)); side.position.y = .1; g.add(side);   // the earth wall, as on the board
  // brass rim: a 6-sided cylinder already has its corners where the tile has them (no extra turn, or they stick out)
  const rim = new THREE.Mesh(sg(new THREE.CylinderGeometry(TILE_R*1.02, TILE_R*1.06, .1, 6)), icm(0xa8823a, { m: .55, r: .45 })); rim.position.y = .03; g.add(rim);
  const trees = new TreeBatch(.012), spot = (r0, r1) => { const a = rnd()*6.28, d = r0 + rnd()*(r1 - r0); return [Math.cos(a)*d, Math.sin(a)*d]; };
  const nTrees = { bosque: 12, pradera: 3, cerro: 3, campo: 2, montana: 4 }[biome];
  for (let k=0;k<nTrees;k++){ const [x, z] = spot(town ? .45 : .25, .78); trees.add(treeKindFor(biome, rnd), x, Y(x, z) - .004, z, .045 + rnd()*.02, rnd()*6.28, treeTint(biome === 'montana' || biome === 'cerro' ? 'pino' : 'roble', rnd)); }
  trees.build(g);
  if (biome === 'pradera') for (let k=0;k<3;k++){ const [x, z] = spot(.2, .6), a = makeAnimal('oveja', rnd).g; a.scale.setScalar(.11); a.position.set(x, Y(x, z), z); a.rotation.y = rnd()*6.28; g.add(a); }
  if (biome === 'cerro') for (let k=0;k<4;k++){ const [x, z] = spot(.15, .7), m = mesh(pick(GEO.rocks, rnd), pick([0xb8643a, 0x9c5a3a], rnd), x, Y(x, z), z, .09, .06, .08); m.rotation.y = rnd()*6; g.add(m); }
  if (town){ const h = boardHouse('#e0473b', true); h.scale.setScalar(2.1); h.position.set(.05, Y(.05, .05), .05); g.add(h); }
  return g;
}
// the item outline, but for InstancedMesh: same look, each copy moved by its own instance matrix
let OUTLINE_INST = null;
function outlineInstMat(){
  if (OUTLINE_INST) return OUTLINE_INST; const A = itemAssets();
  return OUTLINE_INST = keepMat(new THREE.ShaderMaterial({ uniforms: A.outline.uniforms, side: THREE.BackSide,
    vertexShader: 'uniform float w; void main(){ vec3 n = normalize(normalMatrix*(mat3(instanceMatrix)*normal)); vec4 mv = modelViewMatrix*instanceMatrix*vec4(position, 1.); mv.xyz += n*w*max(1., -mv.z*.35); gl_Position = projectionMatrix*mv; }',
    fragmentShader: A.outline.fragmentShader }));
}
// one resource model copied into every lit cell of a letter, packed tight and tumbled a little: one InstancedMesh per
// piece of the model per letter, so ~120 copies cost a few dozen draw calls
function resourceLetter(res, spots, size, rnd){
  const proto = makeResourceItem(res); proto.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(proto), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  const fit = new THREE.Matrix4().makeScale(...Array(3).fill(size/Math.max(sz.x, sz.y, sz.z))).multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z));
  // each spot is [x, y, a]: a = direction of the stroke there (long items lie along it), null = any way round
  const at = spots.map(([x, y, a]) => new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(a == null ? .5 + rnd()*.4 : 1.05 + rnd()*.3, (rnd() - .5)*.5, a == null ? (rnd() - .5)*.7 : a + (rnd() - .5)*.3, 'ZXY')).setPosition(x, y, (rnd() - .5)*.03).multiply(fit));
  const g = new THREE.Group(), m = new THREE.Matrix4();
  proto.traverse(o => { if (!o.isMesh || !o.visible) return; const im = new THREE.InstancedMesh(o.geometry, o.userData.outline ? outlineInstMat() : o.material, at.length);
    at.forEach((a, k) => im.setMatrixAt(k, m.multiplyMatrices(a, o.matrixWorld))); im.frustumCulled = false; g.add(im); });
  return g;
}
// a word of GLYPHS piled out of one resource, centred; letters in `skip` are left empty (the O of the title)
function resourceWord(word, res, skip = ''){
  const cs = .1, gap = 6, letters = [], rnd = mulberry32(Math.floor(Math.random()*1e6)), long = ['madera', 'ladrillo', 'mineral'].includes(res);
  const W = (word.length*gap - 1)*cs, g = new THREE.Group();
  [...word].forEach((ch, i) => { const L = new THREE.Group(); L.position.x = -W/2 + (i*gap + 2)*cs + cs/2; g.add(L); letters.push(L);
    if (skip.includes(ch)) return; const spots = [], on = (x, y) => GLYPHS[ch][y] && GLYPHS[ch][y][x] === '#';
    GLYPHS[ch].forEach((row, y) => [...row].forEach((c, x) => { if (c !== '#') return; const px = (x - 2)*cs, py = (3 - y)*cs - cs*.47;
      if (!long){ spots.push([px + (rnd() - .5)*cs*.12, py + (rnd() - .5)*cs*.12, null]); return; }
      // the stroke through this cell: across, down, or the diagonal of the W and the M
      const h = on(x - 1, y) || on(x + 1, y), v = on(x, y - 1) || on(x, y + 1);
      const a = h && !v ? 0 : v && !h ? Math.PI/2 : h && v ? (rnd() < .5 ? 0 : Math.PI/2) : (on(x + 1, y + 1) || on(x - 1, y - 1)) ? -Math.PI/4 : Math.PI/4;
      [-1, 1].forEach(sd => spots.push([px - Math.sin(a)*sd*cs*.22 + (rnd() - .5)*cs*.08, py + Math.cos(a)*sd*cs*.22 + (rnd() - .5)*cs*.08, a])); }));   // two per cell, side by side
    L.add(resourceLetter(res, spots, long ? cs*1.45 : res === 'lana' ? cs*1.9 : cs*1.7, rnd)); });
  return { g, letters, cs };
}
function buildWordmark(biome){
  const word = 'SWAPHOLM', { g, letters, cs } = resourceWord(word, TERRAIN[biome].res, 'O');
  // the O: as tall as the letters, tilted toward you, turning on its own axis
  const O = letters[word.indexOf('O')], hex = spinner(logoHex(biome), 1); hex.rotation.x = 1.0; hex.updateMatrixWorld(true);
  const hb = new THREE.Box3().setFromObject(hex), hs = hb.getSize(new THREE.Vector3()); hex.scale.multiplyScalar(Math.min(7*cs/hs.y, 6.4*cs/hs.x));
  hex.position.y = -cs*.47; O.add(hex);
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
