// ================= TEXTURED MINI HOUSES (timber frame / stone / planks, tiled roofs tinted with the player color) =================
const HT = {};
function houseAssets(){
  if (HT.ready) return HT;
  const P = (c, col, x, y, w=1, h=1) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const R = mulberry32(77);
  const base = {
    timber: c => { P(c, '#e6dcc4', 0, 0, 32, 32); for (let i=0;i<60;i++) P(c, pick(['#d8cdb2', '#efe6d2'], R), Math.floor(R()*32), Math.floor(R()*32)); P(c, '#5a3a22', 0, 0, 2, 32); P(c, '#5a3a22', 30, 0, 2, 32); P(c, '#5a3a22', 0, 0, 32, 2); P(c, '#5a3a22', 0, 15, 32, 2); P(c, '#7a5232', 0, 15, 32, 1); },
    stone: c => { P(c, '#6e6a62', 0, 0, 32, 32); for (let row=0; row<8; row++){ const off = row % 2 ? 3 : 0; for (let x = -off; x < 32; x += 7){ P(c, pick(['#a8a49a', '#9a968c', '#b4b0a6', '#8e8a80'], R), x + 1, row*4 + 1, 6, 3); P(c, '#c8c4ba', x + 1, row*4 + 1, 6, 1); } } },
    plank: c => { for (let x=0;x<32;x+=4){ P(c, pick(['#8a6440', '#7a5634', '#96704a'], R), x, 0, 4, 32); P(c, '#4a3020', x, 0, 1, 32); for (let k=0;k<3;k++) P(c, '#6a4a2c', x + 1 + Math.floor(R()*3), Math.floor(R()*32), 1, 2); } P(c, '#3a2414', 0, 0, 32, 2); },
  };
  const stoneBase = c => { for (let x=0;x<32;x+=5){ P(c, pick(['#9a968c', '#8a867c', '#a8a49a'], R), x, 26, 5, 6); P(c, '#5e5a52', x, 26, 1, 6); } P(c, '#5e5a52', 0, 25, 32, 1); };
  const window_ = (c, x, y) => { P(c, '#2a1a0c', x - 1, y - 1, 7, 7); P(c, '#34485e', x, y, 5, 5); P(c, '#6e8eae', x, y, 2, 1); P(c, '#6e8eae', x, y, 1, 2); P(c, '#2a1a0c', x + 2, y, 1, 5); P(c, '#2a1a0c', x, y + 2, 5, 1); P(c, '#d8c8a8', x - 1, y + 6, 7, 1); P(c, '#8a2e22', x - 3, y - 1, 2, 7); P(c, '#8a2e22', x + 6, y - 1, 2, 7); };
  const door = c => { P(c, '#2a1a0c', 11, 16, 10, 16); P(c, '#5a3420', 12, 18, 8, 14); P(c, '#4a2a18', 12, 17, 8, 1); P(c, '#6e4428', 13, 19, 1, 13); P(c, '#6e4428', 17, 19, 1, 13); P(c, '#e0b040', 18, 25, 1, 1); P(c, '#3a2414', 13, 16, 6, 1); };
  const mk = draw => { const t = pxTex(32, 32, c => draw(c)); return t; };
  HT.tex = {};
  Object.keys(base).forEach(v => {
    HT.tex[v] = {
      front: mk(c => { base[v](c); if (v === 'timber'){ P(c, '#5a3a22', 6, 2, 2, 13); P(c, '#5a3a22', 24, 2, 2, 13); } door(c); window_(c, 3, 6); window_(c, 24, 6); if (v !== 'stone') stoneBase(c); door(c); }),
      side: mk(c => { base[v](c); if (v === 'timber'){ for (let k=0;k<13;k++){ P(c, '#5a3a22', 2 + k, 2 + k, 2, 1); P(c, '#5a3a22', 29 - k, 2 + k, 2, 1); } } window_(c, 13, 18); if (v !== 'stone') stoneBase(c); }),
      plain: mk(c => { base[v](c); if (v === 'timber'){ P(c, '#5a3a22', 15, 0, 2, 32); } }),
    };
  });
  HT.roof = {
    tile: mk(c => { for (let row=0; row<8; row++){ const y = row*4, off = row % 2 ? 2 : 0; P(c, '#5c5c5c', 0, y + 3, 32, 1); for (let x = -off; x < 32; x += 4){ P(c, '#d6d6d6', x, y, 4, 3); P(c, '#ffffff', x, y, 4, 1); P(c, '#a4a4a4', x + 3, y, 1, 3); P(c, '#b8b8b8', x, y + 2, 4, 1); } } }),
    shingle: mk(c => { for (let row=0; row<10; row++){ const y = row*3 + 1; P(c, '#666666', 0, y + 2, 32, 1); let x = Math.floor(R()*3) - 3; while (x < 32){ const w = 3 + Math.floor(R()*3); P(c, pick(['#cfcfcf', '#c2c2c2', '#dadada'], R), x, y, w, 2); P(c, '#f0f0f0', x, y, w, 1); P(c, '#8a8a8a', x + w - 1, y, 1, 2); x += w; } } }),
  };
  HT.chimney = mk(c => base.stone(c));
  HT.mats = new Map();
  HT.ready = true; return HT;
}
function hmat(key, make){ const A = houseAssets(); if (!A.mats.has(key)) A.mats.set(key, keepMat(make())); return A.mats.get(key); }
function wallMats(v, tint){
  const A = houseAssets(), c = new THREE.Color(tint), k = v + tint;
  const m = face => hmat(k + face, () => new THREE.MeshStandardMaterial({ map: A.tex[v][face], color: c, roughness: .95 }));
  return { front: m('front'), side: m('side'), plain: m('plain') };
}
function roofMat(kind, color){ const A = houseAssets(); return hmat('roof' + kind + color, () => new THREE.MeshStandardMaterial({ map: A.roof[kind], color: new THREE.Color(color).lerp(new THREE.Color(0xffffff), .12), roughness: .85 })); }
const ROOF_GEO = sg((() => {
  const v = [[-.5,0,.5],[.5,0,.5],[.5,1,0], [-.5,0,.5],[.5,1,0],[-.5,1,0], [.5,0,-.5],[-.5,0,-.5],[-.5,1,0], [.5,0,-.5],[-.5,1,0],[.5,1,0], [.5,0,.5],[.5,0,-.5],[.5,1,0], [-.5,0,-.5],[-.5,0,.5],[-.5,1,0]];
  const uv = [0,0, 1,0, 1,1, 0,0, 1,1, 0,1, 0,0, 1,0, 1,1, 0,0, 1,1, 0,1, 0,0, 1,0, .5,1, 0,0, 1,0, .5,1];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v.flat(), 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.addGroup(0, 12, 0); g.addGroup(12, 6, 1); g.computeVertexNormals(); return g;
})());
function miniHouse(g, x, z, w, d, h, ry, roof, wall, rng, o = {}){
  const hg = new THREE.Group(); hg.position.set(x, 0, z); hg.rotation.y = ry; g.add(hg);
  const v = o.variant || (rng() < .55 ? 'timber' : rng() < .55 ? 'stone' : 'plank');
  const W = wallMats(v, v === 'timber' ? wall : 0xffffff);
  const body = new THREE.Mesh(GEO.box, [W.side, W.side, W.plain, W.plain, W.front, W.side]); body.scale.set(w, h, d); body.castShadow = true; body.receiveShadow = true; hg.add(body);
  const rf = new THREE.Mesh(ROOF_GEO, [roofMat(rng() < .6 ? 'tile' : 'shingle', roof), W.plain]); rf.position.y = h; rf.scale.set(w*1.07, h*(o.steep || .8), d*1.2); rf.castShadow = true; rf.receiveShadow = true; hg.add(rf);
  if (o.chimney !== false && rng() < .55){ const ch = new THREE.Mesh(GEO.box, hmat('chim', () => new THREE.MeshStandardMaterial({ map: houseAssets().chimney, roughness: 1 }))); ch.scale.set(w*.14, h*.75, w*.14); ch.position.set(w*.3, h*.9, -d*.15); ch.castShadow = true; hg.add(ch); }
  return hg;
}
function stoneMat(){ return hmat('stoneblk', () => new THREE.MeshStandardMaterial({ map: houseAssets().chimney, roughness: 1 })); }
function boardVillage(p, city, conn, seed){
  const g = new THREE.Group(), rng = mulberry32(seed*131 + 7), roof = roofColor(p);
  const roofDark = new THREE.Color(roof).multiplyScalar(.8).getHex();
  const n = (city ? 6 : 3) + Math.min(conn, city ? 5 : 4), placed = [];
  const tryPos = (r0, r1, rad) => { for (let k=0;k<30;k++){ const a = rng()*6.28, r = r0 + rng()*(r1 - r0), x = Math.cos(a)*r, z = Math.sin(a)*r; if (placed.every(q => Math.hypot(q[0] - x, q[1] - z) > q[2] + rad)) { placed.push([x, z, rad]); return [x, z]; } } return null; };
  if (city){
    placed.push([0, 0, .055]);
    const tw = new THREE.Group(); g.add(tw);
    const tb = mesh(GEO.box, stoneMat(), 0, 0, 0, .06, .2, .06); tw.add(tb);
    for (let k=0;k<4;k++){ const a = k*Math.PI/2; tw.add(mesh(GEO.box, stoneMat(), Math.cos(a)*.026, .2, Math.sin(a)*.026, .016, .018, .016)); }
    const sp = mesh(GEO.cone4, roofMat('tile', roof), 0, .205, 0, .05, .1, .05); sp.rotation.y = Math.PI/4; tw.add(sp);
    tw.add(mesh(GEO.box, 0x2a2420, 0, .14, .0305, .02, .03, .002, false));
    miniHouse(g, .0, -.07, .07, .05, .07, 0, roofDark, 0xd9d0bf, rng, { chimney: false });
  } else placed.push([0, 0, .03]);
  for (let i=0;i<n;i++){
    const big = city && rng() < .5, w = (big ? .062 : .05) + rng()*.018, d = w*(.75 + rng()*.35), h = (big ? .075 : .05) + rng()*.02;
    const pos = tryPos(city ? .07 : .04, city ? .2 : .15, w*.62); if (!pos) continue;
    miniHouse(g, pos[0], pos[1], w, d, h, Math.atan2(-pos[0], -pos[1]) + (rng() - .5)*.6, rng() < .7 ? roof : roofDark, pick(WALLS, rng), rng, { win: big });
  }
  if (!city){ g.add(mesh(GEO.cyl, 0x8a8a84, 0, 0, 0, .014, .016, .014)); g.add(mesh(GEO.cyl, 0x3a6a9a, 0, .0165, 0, .01, .001, .01, false)); }
  for (let i=0;i<(city ? 3 : 2);i++){ const pos = tryPos(.12, .2, .02); if (pos){ g.add(mesh(GEO.cyl, 0x6b4a2f, pos[0], 0, pos[1], .005, .03, .005)); g.add(mesh(GEO.sphere, 0x3f7a35, pos[0], .045, pos[1], .025, .028, .025)); } }
  { const ph = city ? .27 : .21; const pole = mesh(GEO.cyl, 0x4a3020, 0, 0, 0, .006, ph, .006); g.add(pole); const fl = new THREE.Mesh(FLAG_TRI, hmat('pen' + roof, () => new THREE.MeshStandardMaterial({ color: roof, roughness: .8, side: THREE.DoubleSide, flatShading: true }))); fl.position.set(.004, ph - .042, 0); fl.scale.set(.065, .036, 1); fl.castShadow = true; g.add(fl); g.add(mesh(GEO.sphere, 0xd9a83a, 0, ph + .005, 0, .01, .01, .01)); }
  g.scale.setScalar(2.15);
  if (city) for (let i=0;i<10;i++){ const a = i/10*6.28 + rng()*.2; if (i % 3 === 2) continue; const wg = new THREE.Group(); wg.position.set(Math.cos(a)*.215, 0, Math.sin(a)*.215); wg.rotation.y = -a + Math.PI/2; g.add(wg); wg.add(mesh(GEO.box, stoneMat(), 0, 0, 0, .075, .03, .014)); for (let k=0;k<4;k++) wg.add(mesh(GEO.box, stoneMat(), -.028 + k*.0187, .03, 0, .009, .01, .016)); }
  return g;
}
// connectivity: how many of the owner's towns are joined to this one by the owner's roads
function connectedTowns(vid){
  const p = G.verts[vid].building.p, seen = new Set([vid]), q = [vid], towns = new Set([vid]);
  while (q.length){
    const cur = q.shift();
    for (const eid of G.verts[cur].edges){
      const e = G.edges[eid]; if (e.road !== p) continue;
      const o = e.a === cur ? e.b : e.a; if (seen.has(o)) continue;
      const ob = G.verts[o].building; if (ob && ob.p !== p) continue;
      seen.add(o); q.push(o); if (ob) towns.add(o);
    }
  }
  return towns;
}
const connCount = vid => connectedTowns(vid).size - 1;
function updateClusters(p){
  G.verts.forEach(v => { if (!v.building || v.building.p !== p || !v.mesh) return; const c = connCount(v.id); if (c !== v.conn) drawBuilding(v.id, true); });
}
// fenced dirt road along an edge, fence painted in the owner's color
function fencedRoad(p, a, b){
  const g = new THREE.Group(), L = Math.hypot(b.x - a.x, b.z - a.z), col = new THREE.Color(roofColor(p)), dark = col.clone().multiplyScalar(.62);
  g.position.set((a.x + b.x)/2, .2, (a.z + b.z)/2); g.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x);
  const r = mulberry32(Math.round((a.x + b.x)*97 + (a.z + b.z)*53)), pts = [];
  for (let i=0;i<=8;i++){ const t = -.3 + i*.075; pts.push({ x: t*L, z: Math.sin(i*1.3 + r()*2)*.008 }); }
  const path = new THREE.Mesh(stripGeo(pts, .1), roadMat()); path.position.y = .006; path.receiveShadow = true; g.add(path);
  const parts = [], box = (x, y, z, sx, sy, sz, c, ry = 0) => { const bg = new THREE.BoxGeometry(sx, sy, sz); bg.rotateY(ry); bg.translate(x, y + sy/2, z); const n = bg.attributes.position.count, cc = new Float32Array(n*3); for (let i=0;i<n;i++){ cc[i*3] = c.r; cc[i*3 + 1] = c.g; cc[i*3 + 2] = c.b; } bg.setAttribute('color', new THREE.BufferAttribute(cc, 3)); parts.push(bg.toNonIndexed()); };
  [-1, 1].forEach(sd => {
    const z0 = sd*.066; let prev = null;
    for (let i=0;i<=6;i++){
      const x = (-.27 + i*.09)*L, z = z0 + (r() - .5)*.004;
      box(x, 0, z, .014, .052, .014, dark); box(x, .052, z, .018, .006, .018, col);
      if (prev){ const mx = (x + prev[0])/2, mz = (z + prev[1])/2, len = Math.hypot(x - prev[0], z - prev[1]), ry = -Math.atan2(z - prev[1], x - prev[0]); box(mx, .036, mz, len, .01, .007, col, ry); box(mx, .017, mz, len, .01, .007, col, ry); }
      prev = [x, z];
    }
  });
  const fg = mergeGeometries(parts); parts.forEach(q => q.dispose());
  const fm = new THREE.Mesh(fg, keepMat(FENCE_MAT)); fm.castShadow = true; fm.receiveShadow = true; g.add(fm);
  return g;
}
const FENCE_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85, flatShading: true });
// antique magnifying glass floating over the main player's towns (click to enter)
let LUPA_PARTS = null;
const FLAG_TRI = sg((() => { const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(1, .5); sh.lineTo(0, 1); sh.closePath(); return new THREE.ShapeGeometry(sh); })());
function makeLupa(){
  itemAssets();
  if (!LUPA_PARTS) LUPA_PARTS = {
    ring: sg(new THREE.TorusGeometry(.085, .014, 6, 18)), lens: sg(new THREE.CircleGeometry(.08, 18)), shine: sg(new THREE.TorusGeometry(.055, .006, 3, 10, 1.4)),
    brass: keepMat(new THREE.MeshStandardMaterial({ color: 0xd2a645, metalness: .75, roughness: .35, envMap: IT.env, flatShading: true })),
    glass: keepMat(new THREE.MeshStandardMaterial({ color: 0xcfe8ff, transparent: true, opacity: .28, roughness: .05, metalness: .2, envMap: IT.env, side: THREE.DoubleSide, depthWrite: false })),
    shineM: keepMat(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8 })),
    wood: keepMat(new THREE.MeshStandardMaterial({ color: 0x5a3720, roughness: .8, flatShading: true })),
  };
  const P = LUPA_PARTS, g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  body.add(new THREE.Mesh(P.ring, P.brass));
  const lens = new THREE.Mesh(P.lens, P.glass); body.add(lens);
  const sh = new THREE.Mesh(P.shine, P.shineM); sh.rotation.z = 2.2; sh.position.z = .002; body.add(sh);
  body.add(mesh(GEO.cyl, P.brass, 0, -.11, 0, .02, .03, .02));
  body.add(mesh(GEO.cyl, P.wood, 0, -.2, 0, .015, .09, .015));
  body.add(mesh(GEO.sphere, P.brass, 0, -.205, 0, .02, .016, .02));
  body.rotation.z = -.5; body.position.y = .1; g.scale.setScalar(1.45);
  return g;
}
const LUPAS = [];
function stepLupas(t){ LUPAS.forEach((l, i) => { l.position.y = (l.userData.baseY || .74) + Math.sin(t*2 + i)*.03; l.children[0].rotation.y = Math.sin(t*.8 + i)*.6 + .3; }); }
// ---------- ports ----------
const PORT_ICON = { '3:1': '⚓' };
function makePorts(tiles, verts, edges, rng = Math.random){
  const outer = edges.filter(e => verts[e.a].tiles.filter(t => verts[e.b].tiles.includes(t)).length === 1)
    .map(e => { const A = verts[e.a], B = verts[e.b], mx = (A.x + B.x)/2, mz = (A.z + B.z)/2; return { e, ang: Math.atan2(mz, mx), mx, mz }; }).sort((p, q) => p.ang - q.ang);
  const big = tiles.length > 19, off = Math.floor(rng()*outer.length), types = shuffle(big ? ['3:1', '3:1', '3:1', '3:1', '3:1', 'madera', 'ladrillo', 'lana', 'lana', 'trigo', 'mineral'] : ['3:1', '3:1', '3:1', '3:1', 'madera', 'ladrillo', 'lana', 'trigo', 'mineral'], rng), NP = types.length;
  return types.map((type, i) => {
    const o = outer[(off + Math.round(i*outer.length/NP)) % outer.length], ti = verts[o.e.a].tiles.find(t => verts[o.e.b].tiles.includes(t)), t = tiles[ti];
    const nx = o.mx - t.x, nz = o.mz - t.z, nl = Math.hypot(nx, nz);
    verts[o.e.a].port = type; verts[o.e.b].port = type;
    return { type, a: o.e.a, b: o.e.b, x: o.mx, z: o.mz, nx: nx/nl, nz: nz/nl, tile: ti };
  });
}
function portsFrom(list, tiles, verts){
  return list.map(([type, a, b]) => { const A = verts[a], B = verts[b], mx = (A.x + B.x)/2, mz = (A.z + B.z)/2, ti = A.tiles.find(t => B.tiles.includes(t)), t = tiles[ti], nx = mx - t.x, nz = mz - t.z, nl = Math.hypot(nx, nz);
    A.port = type; B.port = type; return { type, a, b, x: mx, z: mz, nx: nx/nl, nz: nz/nl, tile: ti }; });
}
function tradeRate(p, r){
  if (G.merchant === G.turnId && G.current === p) return 2;
  if (G.players[p].buffs && G.players[p].buffs.halfTrade) return Math.max(1, Math.ceil(tradeRateBase(p, r)/2));
  return tradeRateBase(p, r);
}
function tradeRateBase(p, r){
  let k = 4;
  G.verts.forEach(v => { if (v.building && v.building.p === p && v.port){ if (v.port === '3:1') k = Math.min(k, 3); else if (v.port === r) k = 2; } });
  return k;
}
function portSign(type){
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const paint = img => {
    c.clearRect(0, 0, 128, 128);
    c.fillStyle = 'rgba(22,26,32,.9)'; c.beginPath(); c.arc(64, 60, 54, 0, 7); c.fill();
    c.lineWidth = 6; c.strokeStyle = '#d9a83a'; c.stroke();
    if (img) c.drawImage(img, 30, 14, 68, 68); else { c.font = '52px serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#f3eee2'; c.fillText(PORT_ICON[type] || '?', 64, 50); }
    c.font = 'bold 30px Inter, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#f6d36a'; c.fillText(type === '3:1' ? '3:1' : '2:1', 64, 94);
    tex.needsUpdate = true;
  };
  paint(null);
  if (type !== '3:1' && RES_IMG[type]){ const im = new Image(); im.onload = () => paint(im); im.src = RES_IMG[type]; }
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.setScalar(.34); return sp;
}
function sailBoat(sailCol, rng){
  const g = new THREE.Group();
  const hull = mesh(BOAT_HULL, 0x7a5232, 0, 0, 0, 1, 1, 1); g.add(hull);
  g.add(mesh(GEO.box, 0xa07a4a, 0, .028, 0, .05, .004, .15));
  g.add(mesh(GEO.cyl, 0x5a3e28, 0, .028, .01, .004, .17, .004));
  const sail = new THREE.Mesh(SAIL_GEO, mat(sailCol, { side: THREE.DoubleSide })); sail.position.set(0, .045, .014); sail.castShadow = true; g.add(sail);
  return g;
}
const BOAT_HULL = sg((() => { const b = new THREE.BoxGeometry(.07, .04, .2, 1, 1, 4), p = b.attributes.position; for (let i=0;i<p.count;i++){ const z = p.getZ(i), y = p.getY(i), k = Math.max(0, (z - .02)/.08); p.setX(i, p.getX(i)*(1 - k*.92)*(y < 0 ? .7 : 1)); p.setY(i, y + (Math.abs(z) > .08 ? .012 : 0)); } b.translate(0, .01, 0); b.computeVertexNormals(); return b; })());
const SAIL_GEO = sg((() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, .14, 0, 0, 0, .1], 3)); g.computeVertexNormals(); return g; })());
const PORT_SAIL = { madera: 0x8a6a40, ladrillo: 0xc0603a, lana: 0xf4f0e6, trigo: 0xe6c060, mineral: 0x9aa4b0, '3:1': 0xe9e2d0 };
function buildPorts(sc, F, anims){
  if (!G.ports) return;
  G.ports.forEach((pt, pi) => {
    const t = G.tiles[pt.tile], rng = mulberry32(pi*71 + 3);
    let Lw = .3; for (let s = .1; s < 3; s += .03){ if (F.info(pt.x + pt.nx*s, pt.z + pt.nz*s).h < -.05){ Lw = s; break; } }
    const g = new THREE.Group(); g.position.set(pt.x, 0, pt.z); g.rotation.y = Math.atan2(pt.nx, pt.nz); sc.add(g); g.userData.port = pi; PORT_GROUPS.push(g);
    const yAt = s => F.info(pt.x + pt.nx*s, pt.z + pt.nz*s).h;
    // dirt path from the board edge to the pier
    const pts = []; for (let s = .02; s <= Lw - .08; s += .05) pts.push({ x: 0, z: s });
    if (pts.length > 1){ const pg = stripGeo(pts.map(q => ({ x: q.x, z: q.z })), .08), pp = pg.attributes.position; for (let i=0;i<pp.count;i++) pp.setY(i, Math.max(.0, yAt(pp.getZ(i))) + .008); pg.computeVertexNormals(); const pm = new THREE.Mesh(pg, roadMat()); pm.receiveShadow = true; g.add(pm); }
    // jetties to the two port corners
    [pt.a, pt.b].forEach(vid => { const v = G.verts[vid], lx = (v.x - pt.x), lz = (v.z - pt.z), c = Math.cos(-g.rotation.y), s2 = Math.sin(-g.rotation.y), x = lx*c + lz*s2, z = -lx*s2 + lz*c; const len = Math.hypot(x, z - .12), m = mesh(GEO.box, 0x8a6a48, x/2, .2, (z + .12)/2, .022, .008, len, false); m.rotation.y = Math.atan2(x, z - .12); g.add(m); });
    const s0 = Math.max(.08, Lw - .12), s1 = Lw + .42, dy = .055, type = t.type;
    const add = (geo, c, x, y, z, sx, sy, sz, ry = 0) => { const m = mesh(geo, c, x, y, z, sx, sy, sz); m.rotation.y = ry; g.add(m); return m; };
    if (type === 'montana' || type === 'cerro'){
      const stone = type === 'montana' ? [0x8b8f98, 0x7a7f88, 0x9aa0a8] : [0xb5573b, 0xa04a30, 0xc0603a];
      for (let s = s0; s < s1; s += .05) [-1, 1].forEach(sd => add(GEO.box, pick(stone, rng), sd*.035, -.25, s, .068, .25 + dy + (rng()*.006), .05));
      add(GEO.box, type === 'montana' ? 0x6c727c : 0x8a3a26, 0, dy, (s0 + s1)/2, .15, .008, s1 - s0);
      if (type === 'montana'){ const lh = add(GEO.cyl, 0xe9e4da, 0, dy, s1 - .03, .025, .16, .025); add(GEO.cyl, 0xc0392b, 0, dy + .06, s1 - .03, .026, .03, .026); const lamp = add(GEO.sphere, LAMP_MAT, 0, dy + .17, s1 - .03, .018, .018, .018); add(GEO.cone7, 0x3a3a3a, 0, dy + .185, s1 - .03, .025, .03, .025); }
      else { const cr = new THREE.Group(); cr.position.set(.04, dy, s1 - .05); g.add(cr); cr.add(mesh(GEO.box, 0x6b4a2f, 0, 0, 0, .012, .17, .012)); const arm = mesh(GEO.box, 0x6b4a2f, 0, .16, .05, .008, .008, .13); cr.add(arm); cr.add(mesh(GEO.box, 0x9a8a70, 0, .1, .1, .002, .06, .002)); cr.add(mesh(GEO.box, 0xc0603a, 0, .08, .1, .025, .02, .025)); anims.push((dt, tt) => { cr.rotation.y = Math.sin(tt*.4 + pi)*.6; }); }
    } else {
      const wood = { bosque: [0x6b4a2f, 0x5a3e28, 0x7a5232], desierto: [0xd8c08a, 0xc9ae78, 0xe2cc98], pradera: [0xb08a5a, 0xa07a4a, 0xbf9a68], campo: [0xb08a5a, 0xa07a4a, 0xbf9a68] }[type] || [0xb08a5a, 0xa07a4a];
      for (let s = s0; s < s1; s += .12) [-1, 1].forEach(sd => add(type === 'bosque' ? GEO.cyl : GEO.box, pick(wood, rng), sd*.05, -.25, s, type === 'bosque' ? .011 : .014, .25 + dy + .025, type === 'bosque' ? .011 : .014));
      if (type === 'bosque') for (let s = s0; s < s1; s += .028){ const m = add(GEO.cyl, pick(wood, rng), -.06, dy + .004, s, .012, .12, .012); m.rotation.z = -Math.PI/2; }
      else for (let s = s0; s < s1; s += .024) add(GEO.box, pick(wood, rng), 0, dy, s, .12, .006, .02);
      if (type === 'desierto'){ [[-.05, s1 - .1], [.05, s1 - .1], [-.05, s1 - .01], [.05, s1 - .01]].forEach(([x, z]) => add(GEO.cyl, 0xc9ae78, x, dy, z, .005, .1, .005)); const aw = add(GEO.box, 0xd9603a, 0, dy + .1, s1 - .055, .13, .004, .11); add(GEO.box, 0xf0e6d0, 0, dy + .1005, s1 - .055, .043, .004, .11); }
      else { [-1, 1].forEach(sd => add(GEO.box, 0x9a7a50, sd*.05, dy + .035, (s0 + s1)/2, .004, .004, s1 - s0)); }
      if (type === 'pradera' || type === 'campo'){ add(GEO.box, 0x8a6a40, .03, dy + .006, s1 - .08, .03, .03, .03); add(GEO.cyl, 0x7a5a3a, -.025, dy + .006, s1 - .12, .015, .03, .015); }
      if (type === 'bosque'){ for (let k=0;k<3;k++){ const m = add(GEO.cyl, 0x7a5232, .085, -.01, s0 + .05 + k*.03, .014, .1, .014); m.rotation.z = Math.PI/2; } }
    }
    // boats moored at the pier
    const nb = 1 + (rng() < .6 ? 1 : 0);
    for (let k=0;k<nb;k++){
      const bt = sailBoat(PORT_SAIL[pt.type], rng), sd = k === 0 ? 1 : -1; bt.position.set(sd*.15, -.035, s1 - .1 - k*.12); bt.rotation.y = (rng() - .5)*.3; g.add(bt);
      const ph = rng()*6; anims.push((dt, tt) => { bt.position.y = -.035 + Math.sin(tt*1.6 + ph)*.008; bt.rotation.z = Math.sin(tt*1.2 + ph)*.06; bt.rotation.x = Math.sin(tt*.9 + ph)*.03; });
    }
    const sign = portSign(pt.type); sign.position.set(0, .36, s1 - .12); g.add(sign);
    anims.push((dt, tt) => { sign.position.y = .36 + Math.sin(tt*1.5 + pi)*.012; });
  });
}

let robberMesh = null;
const tileGroups = [];
function buildBoardScene(){
  if (boardScene) disposeScene(boardScene);
  tileGroups.length = 0; LUPAS.length = 0; PORT_GROUPS.length = 0; TOKENS = {}; REVEALS.length = 0; FLY.length = 0; FW.length = 0;
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(0xb2c9dd); sc.fog = new THREE.Fog(0xb2c9dd, 26, 75);
  const sky = skyDome(0x3a6ea6, 0xb2c9dd, 0x3a7fae); sc.add(sky); sc.userData.sky = sky;
  sc.add(new THREE.HemisphereLight(0xdcefff, 0x8a7a5a, 1.35));
  const sun = new THREE.DirectionalLight(0xffe9c6, 2.4); sun.position.set(6,12,5); sun.castShadow = true;
  sun.shadow.mapSize.set(2048,2048); Object.assign(sun.shadow.camera, { left:-7, right:7, top:7, bottom:-7, near:1, far:40 }); sun.shadow.bias = -.0006;
  sc.add(sun);
  const ocean = lowpolyWater(90, 90, 64, 64, .022, 1.7, [0x3fb4d9, 0x37a6d1, 0x4cc0e3, 0x2f98c8], { opacity: .86 });
  ocean.position.y = -.03; sc.add(ocean); sc.userData.water = ocean;
  { const ir = mulberry32(21);
    for (let i=0;i<7;i++){
      const a = i/7*Math.PI*2 + ir()*.5, d = 30 + ir()*16, ix = Math.cos(a)*d, iz = Math.sin(a)*d, s = 2 + ir()*3;
      sc.add(mesh(GEO.cyl14, 0xd8c79a, ix, -.3, iz, s*1.3, .4, s*1.1, false));
      const n = 2 + Math.floor(ir()*3);
      for (let k=0;k<n;k++){ const h = s*(.8 + ir()*1.4), m = mesh(GEO.cone6, pick([0x55704a, 0x6e7480, 0x5f7a50], ir), ix + (ir() - .5)*s, -.1, iz + (ir() - .5)*s*.8, s*(.5 + ir()*.4), h, s*(.5 + ir()*.4), false); m.rotation.y = ir()*3; sc.add(m); if (h > s*1.6) { const c2 = mesh(GEO.cone6, 0xeef2f6, m.position.x, -.1 + h*.7, m.position.z, m.scale.x*.3, h*.3, m.scale.z*.3, false); c2.rotation.y = m.rotation.y; sc.add(c2); } }
    } }
  const S = new Scatter(), sr = mulberry32(11), banims = []; sc.userData.anims = banims;
  CUR_TREES = new TreeBatch(.06);
  const COAST = buildCoast(sc, S, banims); sc.userData.coast = COAST; buildPorts(sc, COAST, banims);
  const prevGH = GH;
  GH = (x, z) => { let best = null, bd = 9; for (const tt of G.tiles){ const d = Math.hypot(x - tt.x, z - tt.z); if (d < bd){ bd = d; best = tt; } } return best ? .2 + tileHeight(best, x - best.x, z - best.z) : 0; };
  G.tiles.forEach(t => {
    const g = new THREE.Group(); g.position.set(t.x, 0, t.z); g.userData.tile = t.i;
    const gc = { bosque: [0x2f7a38, 45], pradera: [0x7cc456, 70], campo: [0xc9b85a, 26], cerro: [0x9cb85a, 18], montana: [0x7a9a55, 12], desierto: [0xc9b06a, 6] }[t.type];
    for (let k=0;k<gc[1];k++){
      const a = sr()*6.28, d = .38 + sr()*.52, lx = Math.cos(a)*d, lz = Math.sin(a)*d;
      if (Math.max(Math.abs(lx), Math.abs(lx*.5 + lz*SQ3/2), Math.abs(-lx*.5 + lz*SQ3/2)) > TILE_IN*.93) continue;
      const y = .2 + tileHeight(t, lx, lz), x = t.x + lx, z = t.z + lz;
      if (t.type === 'pradera' && sr() < .35) S.flower(x, y, z, .09, pick(FLOWER_COLORS, sr), sr()*6);
      else S.add('tuft', x, y, z, .08 + sr()*.05, sr()*6, jc(gc[0], sr(), .15));
    }
    const side = new THREE.Mesh(GEO.hexSide, mat(0x7a5c40)); side.position.y = .1; side.receiveShadow = true; g.add(side);
    g.add(hexTileMesh(t));
    tileProps(g, t, sc, banims);
    if (t.num){ const tk = numberToken(t.num); g.add(tk); TOKENS[t.i] = tk; }
    sc.add(g); tileGroups.push(g);
  });
  S.build(sc);
  CUR_TREES.build(sc); CUR_TREES = null; GH = prevGH;
  { const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true, transparent: true, opacity: .7, emissive: 0xfff4e8, emissiveIntensity: .35 }), cr = mulberry32(3);
    for (let i=0;i<5;i++){ const cg = new THREE.Group(), n = 3 + Math.floor(cr()*3), cmi = cm.clone(); cmi.depthWrite = false; for (let j=0;j<n;j++){ const m = new THREE.Mesh(pick(GEO.blobs, cr), cmi); m.position.set(j*.32 - n*.16, cr()*.1, cr()*.2); m.scale.set(.28 + cr()*.2, .16 + cr()*.08, .24 + cr()*.12); m.castShadow = true; cg.add(m); }
      cg.position.set((cr() - .5)*16, 3.6 + cr()*.7, (cr() - .5)*12); sc.add(cg);
      banims.push(dt => { cg.position.x += dt*.12; if (cg.position.x > 9) cg.position.x = -9; const over = Math.abs(cg.position.x) < 6.8 && Math.abs(cg.position.z) < 6.2, to = over ? .16 : .72; cmi.opacity += (to - cmi.opacity)*Math.min(1, dt*2); const sh = cmi.opacity > .5; cg.children.forEach(m => m.castShadow = sh); }); } }
  { const bc = new THREE.Group(); bc.scale.setScalar(.045); sc.add(bc); const br = mulberry32(8); birdFlock(bc, banims, br, 0, 0, { n: 6, r: 50, h: 45, speed: .2 }); birdFlock(bc, banims, br, 30, -20, { n: 4, r: 35, h: 55, speed: -.25 }); }
  robberMesh = new THREE.Group();
  robberMesh.add(mesh(GEO.cyl, 0x2b2b30, 0,0,0, .08,.24,.08));
  robberMesh.add(mesh(GEO.sphere, 0x2b2b30, 0,.3,0, .075,.075,.075));
  sc.add(robberMesh);
  boardScene = sc;
  placeRobberMesh();
}
const POPS = [];
function pop(m, quiet){ POPS.push({ m, t: 0, s: m.scale.clone() }); m.scale.multiplyScalar(.01); if (!quiet && mode === 'board' && G && !G.setup) SFX.build(); }
function stepBoardFx(dt){
  if (boardScene && boardScene.userData.anims) boardScene.userData.anims.forEach(fn => fn(dt, clock.elapsedTime));
  stepLupas(clock.elapsedTime); stepQuestMarks(clock.elapsedTime); stepPings(dt); stepFocus(dt); stepDecals(clock.elapsedTime);
  for (let i = POPS.length - 1; i >= 0; i--){ const q = POPS[i]; q.t = Math.min(1, q.t + dt/.55); const k = q.t - 1, e = 1 + 2.7*k*k*k + 1.7*k*k; q.m.scale.copy(q.s).multiplyScalar(Math.max(.01, e)); if (q.t >= 1){ q.m.scale.copy(q.s); POPS.splice(i, 1); } }
  if (robberMesh && robberMesh.userData.to){ const r = robberMesh.position, to = robberMesh.userData.to, d = Math.hypot(to.x - r.x, to.z - r.z); r.x += (to.x - r.x)*Math.min(1, dt*5); r.z += (to.z - r.z)*Math.min(1, dt*5); r.y = .24 + Math.min(1.2, d*.5); if (d < .005){ r.set(to.x, .24, to.z); robberMesh.userData.to = null; } }
}
function placeRobberMesh(){ const t = G.tiles[G.robber]; if (G.setup || !robberMesh.userData.placed){ robberMesh.position.set(t.x, .24, t.z); robberMesh.userData.placed = true; } else robberMesh.userData.to = { x: t.x, z: t.z }; }
function drawBuilding(vid, quiet){
  const v = G.verts[vid], p = v.building.p;
  if (v.mesh) { boardScene.remove(v.mesh); }
  v.conn = connCount(vid);
  const m = boardVillage(p, v.building.type === 'ciudad', v.conn, vid);
  m.position.set(v.x, .2, v.z); m.rotation.y = (vid*1.7) % Math.PI;
  addContour(m, G.players[p].color);
  m.userData.vid = vid; v.mesh = m; boardScene.add(m);
  // the glass floats just above the tallest roof (a city is much taller than a town); measured before pop() shrinks it
  const topY = Math.max(.74, new THREE.Box3().setFromObject(m).max.y + .14), lupaY = () => topY;
  pop(m, quiet);
  if (v.lupa) v.lupa.userData.baseY = lupaY();
  if (p === 0 && !v.lupa && scenesOn()){ const l = makeLupa(); l.userData.baseY = lupaY(); l.position.set(v.x, l.userData.baseY, v.z); l.userData.lupa = vid; l.traverse(o => { if (o.isMesh) o.userData.lupa = vid; }); boardScene.add(l); LUPAS.push(l); v.lupa = l; pop(l, true); }
}
function drawRoad(eid){
  const e = G.edges[eid], a = G.verts[e.a], b = G.verts[e.b];
  const m = fencedRoad(e.road, a, b); addContour(m, G.players[e.road].color);
  e.mesh = m; boardScene.add(m); pop(m);
}

