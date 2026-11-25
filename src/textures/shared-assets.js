// ================= SHARED ASSETS =================
const CACHED_MATS = new Set();
const matCache = new Map();
const WOOD_C = new Set([0x6b4a2f,0x7a5a3a,0x8a6a48,0x7a5232,0x5a3b26,0x9c7a4c,0x8a5a32,0x7a4e2c,0xa0784a,0x8f6a3e,0x4a3a2a,0x6b4a30,0x3a2a20,0x8a6a45,0x7a5a38,0x4a3020,0x6d3624+1]);
const ROCK_C = new Set([0x8b8f98,0x9a978e,0x7f838c,0x9a948a,0x8f95a0,0x7f8794,0x9aa1ad,0xc9ccd2,0xbfc3ca,0x8a8174,0x6a7280,0xa4705a,0xb8643a,0x9c5a3a,0xc9a36a,0xb88f5a,0x7d6e63,0x5e534b,0x9a9488,0xbdb3a2]);
const BRICK_C = new Set([0x9c4a2e,0xb0563a,0x8f4a32,0x6d3624]);
function mat(color, opts={}) {
  let tex = opts.tex;
  if (tex === undefined && typeof color === 'number') tex = WOOD_C.has(color) ? 'wood' : ROCK_C.has(color) ? 'rock' : BRICK_C.has(color) ? 'brick' : null;
  const k = String(color) + JSON.stringify(opts) + '|' + (tex || '');
  if (!matCache.has(k)) {
    const o = { ...opts }; delete o.tex; delete o.texScale; delete o.wind;
    const m = new THREE.MeshStandardMaterial({ color, roughness: .9, metalness: 0, flatShading: true, ...o });
    if (tex || opts.wind) texturize(m, tex, opts.texScale, opts.wind);
    matCache.set(k, m); CACHED_MATS.add(m);
  }
  return matCache.get(k);
}
const SHARED = new Set();
const sg = g => (SHARED.add(g), g);
const smoothstep = (a, b, x) => { const t = clamp((x - a)/(b - a), 0, 1); return t*t*(3 - 2*t); };
function hash2(x, y, s=0){ let h = Math.imul(x|0, 374761393) ^ Math.imul(y|0, 668265263) ^ Math.imul(s|0, 1442695041); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function vnoise(x, y, s=0){
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf*xf*(3 - 2*xf), v = yf*yf*(3 - 2*yf);
  const a = hash2(xi,yi,s), b = hash2(xi+1,yi,s), c = hash2(xi,yi+1,s), d = hash2(xi+1,yi+1,s);
  return a + (b - a)*u + (c - a)*v + (a - b - c + d)*u*v;
}
function fbm(x, y, s=0){ let t = 0, a = .5, f = 1; for (let i=0;i<4;i++){ t += a*vnoise(x*f, y*f, s + i*31); f *= 2.03; a *= .5; } return t/.9375; }
function jitterGeo(g, amt, seed=1){
  const p = g.attributes.position, map = new Map();
  for (let i=0;i<p.count;i++){
    const k = Math.round(p.getX(i)*1000) + ',' + Math.round(p.getY(i)*1000) + ',' + Math.round(p.getZ(i)*1000);
    let o = map.get(k);
    if (!o){ const r = mulberry32(seed*7919 + map.size*131); o = [(r() - .5)*amt, (r() - .5)*amt, (r() - .5)*amt]; map.set(k, o); }
    p.setXYZ(i, p.getX(i) + o[0], p.getY(i) + o[1], p.getZ(i) + o[2]);
  }
  g.computeVertexNormals(); return g;
}
const GEO = {
  box: sg(new THREE.BoxGeometry(1,1,1).translate(0,.5,0)),
  cone7: sg(new THREE.ConeGeometry(1,1,7).translate(0,.5,0)),
  cone4: sg(new THREE.ConeGeometry(1,1,4).translate(0,.5,0)),
  cone6: sg(new THREE.ConeGeometry(1,1,6).translate(0,.5,0)),
  cyl: sg(new THREE.CylinderGeometry(1,1,1,8).translate(0,.5,0)),
  cyl14: sg(new THREE.CylinderGeometry(1,1,1,12).translate(0,.5,0)),
  sphere: sg(new THREE.SphereGeometry(1,8,6)),
  trunk: sg(new THREE.CylinderGeometry(.75,1,1,5).translate(0,.5,0)),
  pineTier: sg(jitterGeo(new THREE.ConeGeometry(1,1,7).translate(0,.5,0), .14, 4)),
  rocks: [1,2,3].map(s => sg(jitterGeo(new THREE.IcosahedronGeometry(1,0), .45, s))),
  blobs: [1,2,3].map(s => sg(jitterGeo(new THREE.IcosahedronGeometry(1,1), .28, s + 10))),
  hex: sg(new THREE.CylinderGeometry(.97,.97,.2,6)),
  hexSide: sg(new THREE.CylinderGeometry(.97,.97,.2,6,1,true)),
};
function mesh(geo, color, x=0,y=0,z=0, sx=1,sy=1,sz=1, shadow=true) {
  const m = new THREE.Mesh(geo, (color && color.isMaterial) ? color : mat(color));
  m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow = shadow; m.receiveShadow = true; return m;
}
// ---- low poly helpers
const LP_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 });
CACHED_MATS.add(LP_MAT);
const TMP_C = new THREE.Color();
function jc(hex, r, amt=.09){ TMP_C.set(hex); TMP_C.offsetHSL((r - .5)*.015, 0, (r - .5)*amt); return TMP_C; }
function colorize(g, fn, rng){
  const q = g.attributes.position, col = new Float32Array(q.count*3);
  for (let i=0;i<q.count;i+=3){
    const ax = q.getX(i), ay = q.getY(i), az = q.getZ(i), bx = q.getX(i+1), by = q.getY(i+1), bz = q.getZ(i+1), cx = q.getX(i+2), cy = q.getY(i+2), cz = q.getZ(i+2);
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx, nl = Math.hypot(nx, ny, nz) || 1;
    const c = fn((ax + bx + cx)/3, (ay + by + cy)/3, (az + bz + cz)/3, rng(), Math.abs(ny)/nl);
    for (let k=0;k<3;k++){ col[(i+k)*3] = c.r; col[(i+k)*3+1] = c.g; col[(i+k)*3+2] = c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals(); return g;
}
function lowpolyGround(geo, heightFn, colorFn, jitter, seed){
  const rng = mulberry32(seed), p = geo.attributes.position;
  for (let i=0;i<p.count;i++){ const x = p.getX(i) + (rng() - .5)*jitter, z = p.getZ(i) + (rng() - .5)*jitter; p.setXYZ(i, x, heightFn(x, z), z); }
  const g = geo.toNonIndexed(); geo.dispose();
  colorize(g, colorFn, rng);
  const m = new THREE.Mesh(g, LP_MAT); m.receiveShadow = true; return m;
}
function lowpolyWater(w, d, sw, sd, amp, k, colors, opts={}){
  const geo = new THREE.PlaneGeometry(w, d, sw, sd).rotateX(-Math.PI/2);
  const rng = mulberry32(99), p = geo.attributes.position, cw = w/sw;
  for (let i=0;i<p.count;i++) p.setXYZ(i, p.getX(i) + (rng() - .5)*cw*.55, 0, p.getZ(i) + (rng() - .5)*cw*.55);
  const g = geo.toNonIndexed(); geo.dispose();
  colorize(g, (x,y,z,r) => jc(colors[Math.floor(hash2(Math.round(x*97), Math.round(z*89), 3)*colors.length)], r, .05), rng);
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .3, metalness: .05, transparent: !!opts.opacity, opacity: opts.opacity || 1 }));
  m.receiveShadow = true;
  const pos = g.attributes.position, base = Float32Array.from(pos.array);
  m.userData.update = t => {
    const a = pos.array;
    for (let i=0;i<a.length;i+=3){ const x = base[i], z = base[i+2]; a[i+1] = (Math.sin(x*k + t*1.1) + Math.cos(z*k*1.2 - t*.9) + Math.sin((x + z)*k*.7 + t*1.7)*.6) * amp; }
    pos.needsUpdate = true;
  };
  return m;
}
function skyDome(top, horizon, bottom, r=700){
  const g = new THREE.SphereGeometry(r, 32, 16), p = g.attributes.position, col = [];
  const ct = new THREE.Color(top), ch = new THREE.Color(horizon), cb = new THREE.Color(bottom), c = new THREE.Color();
  for (let i=0;i<p.count;i++){ const y = p.getY(i)/r; if (y >= 0) c.copy(ch).lerp(ct, Math.pow(y, .5)); else c.copy(ch).lerp(cb, Math.min(1, -y*4)); col.push(c.r, c.g, c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -10; m.frustumCulled = false; return m;
}
function facetDisk(r, color, rng){
  const g = new THREE.RingGeometry(.01, r, 12, 3).rotateX(-Math.PI/2).toNonIndexed();
  colorize(g, (x,y,z,rr) => jc(color, rr, .12), rng);
  const m = new THREE.Mesh(g, LP_MAT); m.receiveShadow = true; return m;
}
function disposeScene(sc){
  sc.traverse(o => {
    if (!o.isMesh && !o.isPoints) return;
    if (o.isInstancedMesh) o.dispose();
    if (!SHARED.has(o.geometry)) o.geometry.dispose();
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
      if (CACHED_MATS.has(m)) return;
      if (m.map) m.map.dispose();
      m.dispose();
    });
  });
}

