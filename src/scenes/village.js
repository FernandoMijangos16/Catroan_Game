// ================= VILLAGE =================
function vertexDirs(v){
  const ta = v.tiles.map(ti => ({ ti, a: Math.atan2(G.tiles[ti].z - v.z, G.tiles[ti].x - v.x) }));
  const a0 = ta[0].a;
  return [a0, a0 + 2*Math.PI/3, a0 - 2*Math.PI/3].map(a => { const m = ta.find(t => angDiff(t.a, a) < .3); return { angle: a, tile: m ? m.ti : null }; });
}
function roadDirsOf(v){
  return v.edges.filter(id => G.edges[id].road !== null).map(id => { const e = G.edges[id], o = G.verts[e.a === v.id ? e.b : e.a]; return Math.atan2(o.z - v.z, o.x - v.x); });
}
function sectorPos(rng, angle, r0, r1, spread=.85){
  const a = angle + (rng() - .5) * (2*Math.PI/3) * spread, r = r0 + Math.sqrt(rng()) * (r1 - r0);
  return [Math.cos(a)*r, Math.sin(a)*r];
}
function villageProps(sc, type, angle, rng, anims, ok){
  const P = (r0, r1, sp) => { for (let k=0;k<8;k++){ const p = sectorPos(rng, angle, r0, r1, sp); if (ok(p[0], p[1])) return p; } return null; };
  const each = (n, r0, r1, fn, sp) => { for (let i=0;i<n;i++){ const p = P(r0, r1, sp); if (p) fn(p[0], p[1]); } };
  switch (type){
    case 'bosque':
      each(230, 24, 165, (x,z) => tree(sc, x, z, .75 + rng()*.75, rng, 'bosque'));
      each(22, 21, 60, (x,z) => bush(sc, x, z, .8 + rng()*.6, rng));
      each(10, 22, 70, (x,z) => rock(sc, x, z, .5 + rng()*1.2, rng));
      each(4, 40, 90, (x,z) => addAnimal(sc, 'ciervo', x, z, anims, rng, { rad: 14 }));
      each(3, 25, 60, (x,z) => addAnimal(sc, 'conejo', x, z, anims, rng, { rad: 6 }));
      break;
    case 'pradera':
      each(16, 30, 150, (x,z) => bigTree(sc, x, z, treeKindFor('pradera', rng), 1.05 + rng()*.4, rng));
      each(16, 25, 80, (x,z) => addAnimal(sc, 'oveja', x, z, anims, rng, { rad: 7 }));
      each(2, 45, 80, (x,z) => addAnimal(sc, 'caballo', x, z, anims, rng, { rad: 10 }));
      each(5, 24, 70, (x,z) => addAnimal(sc, 'conejo', x, z, anims, rng, { rad: 6 }));
      each(20, 22, 90, (x,z) => bush(sc, x, z, .7 + rng()*.6, rng));
      break;
    case 'campo':
      each(10, 50, 90, (x,z) => haystack(sc, x, z));
      each(16, 45, 150, (x,z) => bigTree(sc, x, z, treeKindFor('campo', rng), 1 + rng()*.35, rng));
      each(6, 22, 50, (x,z) => bush(sc, x, z, .7, rng));
      break;
    case 'cerro':
      each(18, 22, 100, (x,z) => rock(sc, x, z, .7 + rng()*1.8, rng, pick([0xb8643a, 0x9c5a3a, 0xa4705a], rng)));
      each(18, 25, 130, (x,z) => { if (GH(x,z) < 7) bigTree(sc, x, z, treeKindFor('cerro', rng), 1 + rng()*.35, rng); });
      each(10, 22, 60, (x,z) => bush(sc, x, z, .7, rng));
      break;
    case 'montana':
      each(28, 22, 90, (x,z) => rock(sc, x, z, .6 + rng()*2.4, rng));
      each(80, 24, 140, (x,z) => { if (GH(x,z) < 14) pine(sc, x, z, .8 + rng()*.6, rng); });
      each(3, 30, 70, (x,z) => addAnimal(sc, 'ciervo', x, z, anims, rng, { rad: 12 }));
      break;
    case 'desierto':
      each(24, 22, 120, (x,z) => cactus(sc, x, z, .8 + rng()*.7));
      each(16, 22, 100, (x,z) => rock(sc, x, z, .6 + rng()*1.8, rng, pick([0xc9a36a, 0xb88f5a], rng)));
      break;
  }
}
function turnTo(obj, want, k){ const cur = obj.rotation.y; obj.rotation.y = cur + Math.atan2(Math.sin(want - cur), Math.cos(want - cur))*k; }
function buildVillage(vid){
  const v = G.verts[vid], b = v.building, owner = G.players[b.p], city = b.type === 'ciudad';
  const rng = mulberry32(vid*7919 + 13);
  const sc = new THREE.Scene(), anims = [], colliders = [], people = [], clickables = [], animals = [];
  CUR_COLL = colliders; CUR_ANIMS = anims; CUR_ANIMALS = animals; CUR_TREES = new TreeBatch(.012);
  const POI = { seats: [], gardens: [] }; CUR_POI = POI; const stalls = [];
  sc.background = new THREE.Color(0xcfeaff); sc.fog = new THREE.Fog(0xcfeaff, 90, 330);
  const lightSpots = []; CUR_LIGHTS = lightSpots;

  const slots = vertexDirs(v).map(d => ({ a: d.angle, type: d.tile === null ? 'mar' : G.tiles[d.tile].type }));
  const roadDirs = roadDirsOf(v);
  const conn = Math.min(4, connCount(vid)), grow = conn*1.6;
  const coreR = (city ? 30 : 24) + grow;
  const sites = slots.filter(s => SITE_INFO[s.type]).map(s => {
    const info = SITE_INFO[s.type], R = s.type === 'mar' ? coreR + 4 : (city ? 46 : 39) + grow;
    return { ...s, info, R, x: Math.cos(s.a)*R, z: Math.sin(s.a)*R, rad: info.rad, face: Math.atan2(-Math.cos(s.a), -Math.sin(s.a)) };
  });
  const segs = roadDirs.map(a => ({ a, len: 1e9 })).concat(sites.filter(s => s.type !== 'mar').map(s => ({ a: s.a, len: s.R })));
  const dRoadAt = (x,z) => { let m = 1e9; for (const s of segs){ const ux = Math.cos(s.a), uz = Math.sin(s.a), t = clamp(x*ux + z*uz, 0, s.len); m = Math.min(m, Math.hypot(x - ux*t, z - uz*t)); } return m; };
  const dSiteAt = (x,z) => { let m = 1e9; for (const s of sites) if (s.type !== 'mar') m = Math.min(m, Math.hypot(x - s.x, z - s.z) - s.rad); return m; };
  const weightsAt = (x,z) => {
    const a = Math.atan2(z,x) + (fbm(x*.03, z*.03, 21) - .5)*.5;
    const ws = slots.map(s => Math.pow(Math.max(0, Math.cos(angDiff(a, s.a))), 6));
    const sum = ws.reduce((p,c) => p + c, 0) || 1; return ws.map(w => w/sum);
  };
  const domType = (x,z) => { const w = weightsAt(x,z); let bi = 0; w.forEach((val,i) => { if (val > w[bi]) bi = i; }); return slots[bi].type; };
  const baseH = (x,z) => {
    const r = Math.hypot(x,z), d = Math.max(0, Math.min(r - coreR, dRoadAt(x,z) - 4, dSiteAt(x,z)));
    if (d <= 0) return 0;
    const w = weightsAt(x,z); let h = 0;
    slots.forEach((s,i) => { if (w[i] > .001) h += w[i]*terrainH(s.type, x, z, d); });
    return h;
  };
  const clay = sites.find(s => s.type === 'cerro'), dock = sites.find(s => s.type === 'mar');
  const pit = clay ? toWorld(clay.x, clay.z, clay.face, -4, -1) : null;
  const vh = (x,z) => {
    let h = baseH(x,z);
    if (pit){ const rho = Math.hypot(x - pit[0], z - pit[1]); if (rho < 7.6) h = Math.max(h, clayMoundH(rho)); }
    if (dock){ const dx = x - dock.x, dz = z - dock.z, c = Math.cos(dock.face), s = Math.sin(dock.face); const lx = dx*c - dz*s, lz = dx*s + dz*c; if (Math.abs(lx) < 1.3 && lz > -8 && lz < 6) h = Math.max(h, .05); }
    return h;
  };
  GH = vh;
  const vcol = (x,y,z,r,ny) => {
    const R = Math.hypot(x,z);
    if (R < coreR + 1 || (R < coreR + 7 && hash2(Math.round(x*10), Math.round(z*10), 5) < (coreR + 7 - R)/6)) return terrainColor('core', x, y, z, r, ny);
    return terrainColor(domType(x,z), x, y, z, r, ny);
  };
  GH = baseH;
  sc.add(lowpolyGround(new THREE.PlaneGeometry(640,640,128,128).rotateX(-Math.PI/2), baseH, vcol, 2.2, vid*13 + 1));
  GH = vh;
  if (pit){
    const m = lowpolyGround(new THREE.PlaneGeometry(17,17,17,17).rotateX(-Math.PI/2).translate(pit[0], 0, pit[1]),
      (x,z) => { const rho = Math.hypot(x - pit[0], z - pit[1]); return rho >= 7.6 ? -.06 : clayMoundH(rho); },
      (x,y,z,r) => jc(y > 1.45 ? 0x8aa85a : y > .9 ? 0xb5653a : y > .4 ? 0xa0522d : y > .03 ? 0xb06a40 : 0x7a4a30, r, .1), .25, vid + 3);
    sc.add(m);
  }
  if (slots.some(s => s.type === 'mar')){
    const w = lowpolyWater(640, 640, 72, 72, .22, .11, [0x3fb4d9, 0x37a6d1, 0x4cc0e3, 0x2f98c8], { opacity: .9 });
    w.position.y = -.75; sc.add(w); anims.push((dt,t) => w.userData.update(t));
  }
  const S = new Scatter();
  // production sites
  const workerSpots = [];
  sites.forEach(s => { const r = buildSite(sc, s.type, s.x, s.z, s.face, rng, anims, S, owner.color); r.spots.forEach(sp => workerSpots.push({ x: sp[0], z: sp[1], role: s.info.role })); });
  // paths to sites
  sites.filter(s => s.type !== 'mar').forEach(s => {
    const pts = []; for (let r = coreR - 6; r <= s.R - s.rad*.55; r += 3) pts.push({ x: Math.cos(s.a)*r, z: Math.sin(s.a)*r });
    if (pts.length > 1){ const m = new THREE.Mesh(stripGeo(pts, 2.2), roadMat()); m.position.y = .06; m.receiveShadow = true; sc.add(m); }
  });
  const ok = (x,z) => dSiteAt(x,z) > 2 && dRoadAt(x,z) > 3.5 && Math.hypot(x,z) > coreR + 4;
  slots.forEach(s => villageProps(sc, s.type, s.a, rng, anims, ok));

  roadDirs.forEach(a => {
    const pts = []; for (let r=4; r<=300; r+=6) pts.push({ x: Math.cos(a)*r, z: Math.sin(a)*r });
    const m = new THREE.Mesh(stripGeo(pts, 3.4), roadMat()); m.position.y = .07; m.receiveShadow = true; sc.add(m);
  });

  // ---- village core
  const plazaR = city ? 7.5 : 5.5;
  const plaza = facetDisk(plazaR, 0xbdb3a2, rng); plaza.material = LP_STONE; plaza.position.y = .08; sc.add(plaza);
  sc.add(mesh(GEO.cyl, 0x9a948a, 0,0,0, 1.1,.9,1.1));
  sc.add(mesh(GEO.cyl, 0x2a5d7a, 0,.88,0, .85,.04,.85, false));
  [-1,1].forEach(s => sc.add(mesh(GEO.box, 0x6b4a2f, s*.95,0,0, .15,2.4,.15)));
  { const r = mesh(GEO.cone4, 0x8a4a35, 0,2.4,0, 1.5,.9,1.5); r.rotation.y = Math.PI/4; sc.add(r); }
  colliders.push({ x:0, z:0, r:1.6 });
  // the missions board, beside the well (away from the flag)
  const qbA = Math.PI*.75 + .45, qboard = isClassic() ? null : questBoard(sc, Math.cos(qbA)*3.5, Math.sin(qbA)*3.5, rng, anims); if (qboard) colliders.push({ x: qboard.x, z: qboard.z, r: 1.05 });
  flag(sc, 3.4, -3.4, owner.color, anims, city ? 8 : 6);

  const walls = ['#efe6d2','#e8dcc0','#f3efe6','#dccfb4','#e9d8c4','#f0e2cf','#e6d3b3','#f2e6c8','#e3e0d6'];
  const roofs = [0xb5523b, 0x9c4a35, 0xa85c3c, 0x8d5a3f, 0x6a4a3a, 0x7a5040];
  const houses = [], pathPts = [], navLines = [];
  const fits = (x, z, fr) => { const r = Math.hypot(x,z); return r > plazaR + fr + 1.8 && r < coreR - fr*.2 && dRoadAt(x,z) > fr + 2.4 && dSiteAt(x,z) > fr + 1.5 && (!dock || Math.hypot(x - dock.x, z - dock.z) > 10) && (!pit || Math.hypot(x - pit[0], z - pit[1]) > fr + 9) && houses.every(h => Math.hypot(x - h.x, z - h.z) > fr + h.fr + 2.3); };
  const access = (x, z) => {
    const r = Math.hypot(x,z) || 1; let best = [x/r*(plazaR + .2), z/r*(plazaR + .2)], bd = r - plazaR;
    for (const sg2 of segs){ const ux = Math.cos(sg2.a), uz = Math.sin(sg2.a), t = clamp(x*ux + z*uz, 3, Math.min(sg2.len, 300)), px = ux*t, pz = uz*t, d = Math.hypot(x - px, z - pz); if (d < bd && d > .01){ bd = d; best = [px + (x - px)/d*1.4, pz + (z - pz)/d*1.4]; } }
    return best;
  };
  const SPEC = {
    cabana: () => ({ w: 3 + rng()*.7, d: 3.2 + rng()*.8, h: 2.3 + rng()*.4, o: { wallTex: rng() < .5 ? 'wood' : 'plaster', roofKind: rng() < .6 ? 'thatch' : 'tile' } }),
    casa: () => ({ w: 3.6 + rng()*1, d: 3.8 + rng()*1.2, h: 2.7 + rng()*.6, o: { wallTex: 'plaster' } }),
    alta: () => ({ w: 4 + rng()*1, d: 4 + rng()*1, h: 4.6 + rng()*.8, o: { wallTex: rng() < .7 ? 'plaster' : 'brick', roofKind: 'tile', chimney: true } }),
    piedra: () => ({ w: 3.6 + rng()*.8, d: 4 + rng()*1, h: 2.8 + rng()*.4, wall: pick(['#c9c2b4', '#bdb5a5', '#d2c9b8'], rng), roof: pick([0x5a5f6a, 0x4a4f5a, 0x6a5a50], rng), o: { wallTex: 'rock', timber: false } }),
    ele: () => ({ w: 3.8 + rng()*.8, d: 4 + rng()*.8, h: 2.9 + rng()*.5, o: { wallTex: 'plaster' }, wing: true }),
    torre: () => ({ w: 3 + rng()*.4, d: 3 + rng()*.4, h: 7 + rng()*1.2, o: { wallTex: rng() < .5 ? 'rock' : 'plaster', roofKind: 'tile', chimney: false }, wall: '#d8d0c0' }),
  };
  const placeHouse = (type, r0, r1, extra) => {
    const sp = SPEC[type] ? SPEC[type]() : SPEC.casa();
    if (extra) Object.assign(sp, extra);
    const fr = Math.max(sp.w, sp.d)*.62 + (sp.wing ? 1.6 : 0) + (sp.pad || 0);
    for (let k=0;k<70;k++){
      const a = rng()*6.28, r = r0 + Math.sqrt(rng())*(r1 - r0), x = Math.cos(a)*r, z = Math.sin(a)*r;
      if (!fits(x, z, fr)) continue;
      const [ax, az] = access(x, z), face = Math.atan2(ax - x, az - z) + (rng() - .5)*.4;
      const wall = sp.wall || pick(walls, rng), roof = sp.roof || (rng() < .25 ? owner.color : pick(roofs, rng));
      const g = house(sc, x, z, sp.w, sp.d, sp.h, wall, roof, face, rng, sp.o);
      colliders.push({ x, z, r: Math.max(sp.w, sp.d)*.62 });
      if (sp.wing){ const w2 = sp.w*.7, d2 = sp.d*.8; const [wx, wz] = toWorld(x, z, face, sp.w/2 + w2/2 - .15, -sp.d/2 + d2/2 - .3); house(sc, wx, wz, w2, d2, sp.h*.85, wall, roof, face + Math.PI/2, rng, { wallTex: sp.o.wallTex, roofKind: sp.o.roofKind, chimney: false }); colliders.push({ x: wx, z: wz, r: Math.max(w2, d2)*.6 }); }
      const hs = { x, z, w: sp.w, d: sp.d, h: sp.h, face, fr, type, g };
      houses.push(hs); return hs;
    }
    return null;
  };
  // special buildings near the plaza
  const tav = placeHouse('casa', plazaR + 3, plazaR + 10, { w: 6, d: 5, h: 3.4, o: { wallTex: 'wood', roofKind: 'tile', porch: true, chimney: true, sign: { color: 0xe8c040, geo: GEO.cyl } }, pad: 1 });
  if (tav){ [[-2.2, 3.4], [2.2, 3.6]].forEach(([lx, lz]) => { const [x, z] = toWorld(tav.x, tav.z, tav.face, lx, lz); bench(sc, x, z, tav.face); }); [[-3.4, 2.6], [3.4, 2.4], [3.6, 3.3]].forEach(([lx, lz]) => { const [x, z] = toWorld(tav.x, tav.z, tav.face, lx, lz); barrel(sc, x, z, rng); }); }
  const bak = !(city || slots.some(s2 => s2.type === 'campo')) ? null : placeHouse('casa', plazaR + 3, plazaR + 12, { o: { wallTex: 'plaster', roofKind: 'tile', chimney: true, sign: { color: 0xd9a050, geo: GEO.blobs[0] } }, pad: 1.4 });
  if (bak){ const [x, z] = toWorld(bak.x, bak.z, bak.face, bak.w/2 + 1.3, -bak.d*.15); const y = GH(x, z); sc.add(mesh(GEO.box, 0x9a948a, x, y, z, 1.8, .7, 1.8)); sc.add(mesh(GEO.sphere, 0xb0563a, x, y + .7, z, .85, .75, .85)); sc.add(mesh(GEO.box, 0x2a1d17, x, y + .7, z + .78, .5, .45, .1, false)); sc.add(mesh(GEO.box, LAMP_MAT, x, y + .72, z + .74, .35, .3, .05, false)); smokeSource(sc, x, y + 1.5, z, anims, .7); colliders.push({ x, z, r: 1.2 }); }
  let smith = null;
  if (city || slots.some(s2 => s2.type === 'montana')){
    for (let k=0;k<60 && !smith;k++){
      const a = rng()*6.28, r = plazaR + 5 + rng()*(coreR - plazaR - 8), x = Math.cos(a)*r, z = Math.sin(a)*r;
      if (!fits(x, z, 3)) continue;
      const [ax, az] = access(x, z), face = Math.atan2(ax - x, az - z);
      const g = new THREE.Group(); g.position.set(x, GH(x, z), z); g.rotation.y = face; sc.add(g);
      [[-2,-1.6],[2,-1.6],[-2,1.6],[2,1.6]].forEach(([px,pz]) => g.add(mesh(GEO.box, 0x6b4a2f, px, 0, pz, .22, 2.8, .22)));
      { const rf = new THREE.Mesh(roofGeo(4.4, 3.6, 1.2, 0x6a5a50, rng), LP_ROOF); rf.position.y = 2.8; rf.castShadow = true; g.add(rf); }
      g.add(mesh(GEO.box, 0x9a948a, -1.1, 0, -.9, 1.6, 1, 1.4)); g.add(mesh(GEO.box, mat(0xff7a2a, { emissive: 0xff5a10, emissiveIntensity: 1.2 }), -1.1, 1, -.9, 1.1, .08, .9, false));
      g.add(mesh(GEO.box, 0x7d6e63, -1.1, 1, -1.35, .6, 3.4, .5)); 
      g.add(mesh(GEO.box, 0x3a3a3e, .9, 0, .2, .35, .55, .35)); g.add(mesh(GEO.box, 0x3a3a3e, .9, .55, .2, .8, .22, .3)); g.add(mesh(GEO.cone4, 0x3a3a3e, 1.4, .58, .2, .1, .3, .1, false).rotateZ(-Math.PI/2));
      g.add(mesh(GEO.box, 0x6b4a2f, 1.6, 0, -1.4, .9, 1.6, .2)); [-.3, 0, .3].forEach(o => g.add(mesh(GEO.box, 0x8a9098, 1.6 + o, .9, -1.28, .05, .5, .03, false)));
      const [cx, cz] = toWorld(x, z, face, -1.1, -1.35); smokeSource(sc, cx, GH(x, z) + 4.5, cz, anims, .8, 0x7a7470);
      { const [fx, fz] = toWorld(x, z, face, -1.1, -1); colliders.push({ x: fx, z: fz, r: 1.2 }); const [ax2, az2] = toWorld(x, z, face, .9, .2); colliders.push({ x: ax2, z: az2, r: .5 }); const [rx, rz] = toWorld(x, z, face, 1.6, -1.4); colliders.push({ x: rx, z: rz, r: .6 }); [[-2,-1.6],[2,-1.6],[-2,1.6],[2,1.6]].forEach(([px,pz]) => { const [qx, qz] = toWorld(x, z, face, px, pz); colliders.push({ x: qx, z: qz, r: .25 }); }); }
      smith = { x, z, face }; houses.push({ x, z, w: 4.4, d: 3.6, h: 2.8, face, fr: 3, type: 'herreria' });
      const [sx, sz] = toWorld(x, z, face, .9, 1.1); workerSpots.push({ x: sx, z: sz, role: 'herrero' });
    }
  }
  if (city){
    const ch = placeHouse('casa', plazaR + 5, plazaR + 13, { w: 5, d: 8, h: 5.5, wall: '#e9e2d3', roof: 0x7d4a38, o: { wallTex: 'rock', timber: false, chimney: false, roofKind: 'tile' }, pad: 1.5 });
    if (ch){
      const g = ch.g;
      g.add(mesh(GEO.box, mat('#e9e2d3', { tex: 'rock' }), 0,0,-2.5, 2.8,11,2.8));
      const spr = mesh(GEO.cone4, 0x7d4a38, 0,11,-2.5, 2.2,4,2.2); spr.rotation.y = Math.PI/4; g.add(spr);
      g.add(mesh(GEO.box, 0x2a2420, 0,8.2,-1.08, .8,1.2,.05, false));
      const bell = new THREE.Group(); bell.position.set(0, 9.4, -2.5); g.add(bell); bell.add(mesh(GEO.cone7, 0xc9a040, 0,-.6,0, .45,.6,.45, false));
      anims.push((dt,t) => { bell.rotation.z = Math.sin(t*1.4)*.25; });
      colliders[colliders.length - 1].r = 4.6;
    }
    for (let k=0;k<2;k++) placeHouse('torre', plazaR + 8, coreR - 2);
  }
  // ---- shops of the common trades, plus the ones the surrounding biomes call for
  const shops = [];
  { const types = slots.map(s2 => s2.type), list = ['abarrotes', 'doctor', 'cuartel', ...Object.keys(SHOP_DEFS).filter(k => SHOP_DEFS[k].biome && types.includes(SHOP_DEFS[k].biome))];
    list.forEach(kind => { const D = SHOP_DEFS[kind];
      const spec = () => ({ w: 4.4, d: 4, h: kind === 'cuartel' ? 3.4 : 3, wall: kind === 'cuartel' ? '#c9c2b4' : undefined, o: { wallTex: D.wall, roofKind: kind === 'cuartel' ? 'tile' : rng() < .5 ? 'tile' : 'thatch', porch: kind !== 'cuartel', chimney: kind === 'doctor' || kind === 'carniceria', timber: D.wall !== 'rock' }, pad: 1.6 });
      let hs = placeHouse('casa', plazaR + 3, plazaR + (city ? 18 : 15), spec()); for (let k=0;k<4 && !hs;k++) hs = placeHouse('casa', plazaR + 2, coreR + 2, { ...spec(), w: 3.8, d: 3.6, pad: .8 });
      if (!hs) return; hs.shop = true;
      const g = hs.g, fz = hs.d/2;
      const nm = signMesh(D.name, 100, 22, 15, { light: true }); nm.scale.set(Math.min(3, hs.w*.7), .42, .06); nm.position.set(0, hs.h - .45, fz + .05); g.add(nm);
      const br = new THREE.Group(); br.position.set(-hs.w*.38, 2.45, fz + .1); g.add(br); br.add(mesh(GEO.box, 0x3a3632, 0, 0, .35, .05, .05, .75, false));
      const bd = new THREE.Group(); bd.position.set(0, 0, .65); br.add(bd); bd.add(mesh(GEO.box, 0x8a6a48, 0, -.75, 0, .06, .7, .66)); const ic = shopIcon(kind, owner.color); ic.position.set(.09, -.42, 0); ic.rotation.y = Math.PI/2; ic.scale.setScalar(1.6); bd.add(ic);
      { const ph = rng()*6; anims.push((dt, t) => { bd.rotation.x = Math.sin(t*1.7 + ph)*.08; }); }
      const P2 = (lx, lz) => toWorld(hs.x, hs.z, hs.face, lx, lz), put = (lx, lz, f) => { const [x, z] = P2(lx, lz); f(x, z, GH(x, z)); colliders.push({ x, z, r: .5 }); };
      switch (kind){
        case 'abarrotes': put(1.6, fz + .7, (x, z) => crate(sc, x, z, .6, rng)); put(-1.7, fz + .6, (x, z) => barrel(sc, x, z, rng)); put(1.0, fz + 1.2, (x, z, y) => { [0, .3].forEach(o => sc.add(mesh(GEO.blobs[1], 0xc9b48a, x + o, y + .25, z, .25, .28, .22))); }); break;
        case 'doctor': put(1.6, fz + .7, (x, z, y) => { sc.add(mesh(GEO.box, 0x8a6a48, x, y, z, .9, .7, .5)); [-.25, 0, .25].forEach((o, i) => sc.add(mesh(GEO.cyl, [0x5a9a3a, 0xc9a040, 0x8a5aa8][i], x + o, y + .7, z, .07, .16, .07))); }); break;
        case 'cuartel': put(1.6, fz + .6, (x, z, y) => { sc.add(mesh(GEO.box, 0x6b4a2f, x, y, z, .9, .1, .3)); [-.3, 0, .3].forEach(o => sc.add(mesh(GEO.box, 0x9aa0a8, x + o, y, z, .04, 1.8, .04))); sc.add(mesh(GEO.box, 0x6b4a2f, x, y + 1.3, z, .9, .08, .1)); }); flag(sc, ...P2(-hs.w/2 - .6, fz - .5), owner.color, anims, 5); break;
        case 'carniceria': for (let k=0;k<3;k++) g.add(mesh(GEO.sphere, 0xa84a3a, -.6 + k*.6, 1.6, fz + 1.1, .16, .22, .14)); put(1.7, fz + .7, (x, z) => barrel(sc, x, z, rng)); break;
        case 'telas': put(1.5, fz + .8, (x, z, y) => { sc.add(mesh(GEO.box, 0x8a6a48, x, y, z, 1.1, .7, .5)); [0x8a2a5a, 0x2a5a8a, 0xc9a040, 0x3a7a3a].forEach((c, i) => { const b = mesh(GEO.cyl, c, x - .4 + i*.26, y + .78, z, .1, .45, .1); b.rotation.z = Math.PI/2; sc.add(b); }); }); break;
        case 'alfareria': put(1.6, fz + .7, (x, z, y) => { for (let k=0;k<4;k++){ const v = makeSpecialItem('vasija'); v.scale.setScalar(.9 + (k % 2)*.3); v.position.set(x + (k % 2)*.4 - .2, y, z + Math.floor(k/2)*.4 - .2); sc.add(v); } }); break;
        case 'carpinteria': put(1.6, fz + .8, (x, z, y) => { sc.add(mesh(GEO.box, 0x8a6a48, x, y + .45, z, 1.2, .1, .3)); [-.5, .5].forEach(o => sc.add(mesh(GEO.box, 0x6b4a2f, x + o, y, z, .08, .45, .35))); for (let k=0;k<4;k++) sc.add(mesh(GEO.box, 0xb08a5a, x - .3, y + .55 + k*.06, z, 1.6, .05, .25)); }); put(-1.8, fz + .4, (x, z) => woodPile(sc, x, z, hs.face)); break;
        case 'mariscos': put(1.6, fz + .7, (x, z, y) => { sc.add(mesh(GEO.box, 0x8a6a48, x, y, z, .8, .35, .5)); for (let k=0;k<5;k++) sc.add(mesh(GEO.sphere, 0x8ab0c8, x - .28 + k*.14, y + .4, z + (k % 2)*.1 - .05, .12, .04, .05)); }); put(-1.6, fz + .6, (x, z) => barrel(sc, x, z, rng)); break;
      }
      const door = P2(0, fz + 1), front = P2(.6, fz + 2.1), stand = P2(.6, fz + .9);
      const shop = { kind, D, h: { ...hs, door }, door, front, back: stand, vendor: null, icon: D.icon, carry: D.carry };
      shop.h.shop = shop; shops.push(shop);
    }); }
  // ---- the witch's mossy hut on the outskirts, he rocks on his porch
  let brujo = null;
  for (let k=0;k<80 && !brujo && !isClassic();k++){
    const a = rng()*6.28, r = coreR + 7 + rng()*8, x = Math.cos(a)*r, z = Math.sin(a)*r;
    if (dRoadAt(x, z) < 7 || dSiteAt(x, z) < 5 || baseH(x, z) < -.2 || baseH(x, z) > 1.2 || (dock && Math.hypot(x - dock.x, z - dock.z) < 14) || (pit && Math.hypot(x - pit[0], z - pit[1]) < 10)) continue;
    const face = Math.atan2(-x, -z), hg = house(sc, x, z, 3.4, 3, 2.3, '#6a5a44', 0x4a5a2a, face, rng, { wallTex: 'wood', roofKind: 'thatch', chimney: true, porch: true, timber: false });
    colliders.push({ x, z, r: 2.6 });
    for (let m=0;m<9;m++){ const lx = (rng() - .5)*3, lz = (rng() - .5)*2.6, y = 2.35 + (1.3 - Math.abs(lz)*.8)*.8; hg.add(mesh(GEO.blobs[m % 3], pick([0x4a7a2a, 0x3a6a2a, 0x5a8a3a], rng), lx, y, lz, .35 + rng()*.25, .14, .3 + rng()*.2)); }
    for (let m=0;m<5;m++) hg.add(mesh(GEO.blobs[m % 3], 0x3a6a2a, (rng() - .5)*3.2, .1, 1.45, .25, .2 + rng()*.25, .12));
    { const [cx, cz] = toWorld(x, z, face, 3.4*.25, -3*.15); smokeSource(sc, cx, GH(x, z) + 3.9, cz, anims, .7, 0x8a7aa0); }
    [[1.9, 1.4], [-1.9, .8]].forEach(([lx, lz]) => { const [px, pz] = toWorld(x, z, face, lx, lz); sc.add(mesh(GEO.cyl, 0x2a1e2a, px, GH(px, pz), pz, .3, .45, .3)); sc.add(mesh(GEO.sphere, keepMat(new THREE.MeshStandardMaterial({ color: 0x7aff8a, emissive: 0x2a8a3a, emissiveIntensity: 1 })), px, GH(px, pz) + .45, pz, .22, .06, .22, false)); });   // little cauldrons
    // rocking chair
    const [chx, chz] = toWorld(x, z, face, .9, 3 /2 + 1.0), chair = new THREE.Group(); chair.position.set(chx, GH(chx, chz), chz); chair.rotation.y = face; sc.add(chair);
    const rock = new THREE.Group(); chair.add(rock); const wd = 0x6a4428;
    [-1, 1].forEach(sd => { const rk = new THREE.Mesh(sg(new THREE.TorusGeometry(1.1, .035, 3, 10, .9)), mat(wd)); rk.rotation.set(0, Math.PI/2, Math.PI*1.5 - .45); rk.position.set(sd*.28, 1.1, .05); rock.add(rk);
      rock.add(mesh(GEO.box, wd, sd*.28, .05, .2, .05, .42, .05)); rock.add(mesh(GEO.box, wd, sd*.28, .05, -.22, .05, 1.05, .05)); rock.add(mesh(GEO.box, wd, sd*.28, .62, 0, .05, .05, .5)); });
    rock.add(mesh(GEO.box, wd, 0, .45, 0, .62, .06, .5)); for (let m=0;m<4;m++) rock.add(mesh(GEO.box, wd, -.21 + m*.14, .5, -.24, .06, .55, .03)); rock.add(mesh(GEO.box, wd, 0, 1.05, -.24, .62, .07, .05));
    const w = makePerson(rng, 'brujo', 'm', owner.color); w.g.position.set(0, -.45, .02); rock.add(w.g);
    w.legL.rotation.x = w.legR.rotation.x = -1.45; w.kneeL.rotation.x = w.kneeR.rotation.x = 1.5; w.armL.rotation.x = w.armR.rotation.x = -.5; w.elbowL.rotation.x = w.elbowR.rotation.x = -.6;
    w.brujo = true; w.st = { kind: 'sit' }; w.name = 'El brujo'; w.label = 'brujo';
    w.g.traverse(o => { if (o.isMesh){ o.userData.person = w; clickables.push(o); } });
    const qMark = exclaim(0xb04aff); qMark.scale.setScalar(2.2); qMark.position.y = 2.2; qMark.visible = false; w.g.add(qMark); w.qMark = qMark;
    anims.push((dt, t) => { rock.rotation.x = Math.sin(t*1.3)*.13; w.head.rotation.y = Math.sin(t*.4)*.4; qMark.visible = (G.quests || []).some(q => q.p === 0 && q.vid === vid && q.kind === 'brujo' && q.state === 'new'); qMark.rotation.y = t*1.5; qMark.position.y = 2.2 + Math.sin(t*2.4)*.06; });
    brujo = { x, z, w };
  }
  const mix = city ? ['casa','casa','alta','alta','alta','piedra','ele','ele','cabana','casa'] : ['cabana','cabana','casa','casa','casa','alta','piedra','ele'];
  if (conn >= 2) mix.push('alta', 'piedra', 'ele'); if (conn >= 3) mix.push('alta', 'torre');
  const want = (city ? 24 : 13) + conn*3;
  for (let k=0; houses.length < want && k < want*4; k++) placeHouse(pick(mix, rng), plazaR + 3, coreR);
  // little dirt paths from every door to the plaza or the nearest road
  const blockedBy = (x, z, self) => houses.some(h => h !== self && Math.hypot(x - h.x, z - h.z) < h.fr*.85);
  houses.forEach(hs => {
    const [dx0, dz0] = toWorld(hs.x, hs.z, hs.face, 0, hs.d/2 + .9);
    const tryPath = ([tx, tz]) => {
      const mx = (dx0 + tx)/2, mz = (dz0 + tz)/2, L = Math.hypot(tx - dx0, tz - dz0); if (L < .5) return null;
      const nx = -(tz - dz0)/L, nz = (tx - dx0)/L, off = (rng() - .5)*L*.35, cx = mx + nx*off, cz = mz + nz*off;
      const pts = [];
      for (let i=0;i<=10;i++){ const t = i/10, a = (1 - t)*(1 - t), b = 2*(1 - t)*t, c = t*t; pts.push({ x: a*dx0 + b*cx + c*tx, z: a*dz0 + b*cz + c*tz }); }
      return pts.some((p, i) => i > 1 && blockedBy(p.x, p.z, hs)) ? null : pts;
    };
    const r0 = Math.hypot(dx0, dz0) || 1;
    const pts = tryPath(access(dx0, dz0)) || tryPath([dx0/r0*(plazaR + .2), dz0/r0*(plazaR + .2)]);
    if (!pts) return;
    const m = new THREE.Mesh(stripGeo(pts, 1.3), roadMat()); m.position.y = .065; m.receiveShadow = true; sc.add(m);
    pts.forEach(p => pathPts.push(p)); navLines.push(pts.map(q => [q.x, q.z]));
    if (rng() < .5){ const p = pts[3]; const side = rng() < .5 ? 1 : -1, q = pts[4], L = Math.hypot(q.x - p.x, q.z - p.z) || 1; lantern(sc, p.x - (q.z - p.z)/L*1.1*side, p.z + (q.x - p.x)/L*1.1*side); }
  });
  const nearPath = (x, z, r) => { for (const p of pathPts) if (Math.abs(p.x - x) < r && Math.abs(p.z - z) < r && Math.hypot(p.x - x, p.z - z) < r) return true; return false; };
  const free = (x, z, r) => colliders.every(c => Math.hypot(x - c.x, z - c.z) > c.r + r) && dRoadAt(x,z) > 2.4 + r && Math.hypot(x,z) > plazaR + r && dSiteAt(x,z) > r && !nearPath(x, z, r + .8);
  // yards: barrels, wood piles, gardens, little fences, flower beds
  houses.forEach(hs => {
    if (hs.type === 'herreria') return;
    const side = rng() < .5 ? 1 : -1;
    const [bx, bz] = toWorld(hs.x, hs.z, hs.face, side*(hs.w/2 + .7), hs.d/2 - .5);
    if (free(bx, bz, .5)) { if (rng() < .5) barrel(sc, bx, bz, rng); else crate(sc, bx, bz, .7, rng); }
    if (rng() < .4){ const [wx, wz] = toWorld(hs.x, hs.z, hs.face, -side*(hs.w/2 + 1.1), -.3); if (free(wx, wz, .9)) woodPile(sc, wx, wz, hs.face + Math.PI/2); }
    if (rng() < .5){ const [gx, gz] = toWorld(hs.x, hs.z, hs.face, (rng() - .5)*1.5, -hs.d/2 - 2.7); if (free(gx, gz, 1.9)) garden(sc, gx, gz, hs.face + (rng() - .5)*.4, rng); }
    if (rng() < .45){
      const sx = side*(hs.w/2 + 1.6); let prev = null;
      for (let k=0;k<6;k++){ const [fx, fz] = toWorld(hs.x, hs.z, hs.face, sx, hs.d/2 - k*1.0); if (!free(fx, fz, .15)){ prev = null; continue; } const fy = GH(fx, fz); sc.add(mesh(GEO.box, 0xe8e0cc, fx, fy, fz, .1, .75, .1)); if (prev){ const L = Math.hypot(fx - prev[0], fz - prev[1]); [.3, .58].forEach(yy => { const rl = mesh(GEO.box, 0xe8e0cc, (fx + prev[0])/2, fy + yy, (fz + prev[1])/2, L, .06, .04, false); rl.rotation.y = Math.atan2(-(fz - prev[1]), fx - prev[0]); sc.add(rl); }); } prev = [fx, fz]; colliders.push({ x: fx, z: fz, r: .15 }); }
    }
    for (let k=0;k<5;k++){ const [fx, fz] = toWorld(hs.x, hs.z, hs.face, (k - 2)*.45 + (rng() - .5)*.2, hs.d/2 + .35); S.flower(fx, GH(fx, fz), fz, 1 + rng()*.3, pick(FLOWER_COLORS, rng), rng()*6); }
    for (let k=0;k<16;k++){ const a = rng()*6.28, rr = hs.fr + .2 + rng()*.6, x = hs.x + Math.cos(a)*rr, z = hs.z + Math.sin(a)*rr; if (!nearPath(x, z, .7) && dRoadAt(x, z) > 2) S.add('tuft', x, GH(x, z), z, 1 + rng()*.8, rng()*6, jc(0x6fb84a, rng(), .16), 1.3 + rng()*.6); }
  });
  const spotAt = (r0, r1, rad, tries=30) => { for (let k=0;k<tries;k++){ const a = rng()*6.28, r = r0 + rng()*(r1 - r0), x = Math.cos(a)*r, z = Math.sin(a)*r; if (free(x, z, rad)) return [x, z]; } return null; };
  // lanterns along roads and the plaza
  roadDirs.forEach(a => [8, 15, 22, 29].forEach(r => { const x = Math.cos(a)*r - Math.sin(a)*2.6, z = Math.sin(a)*r + Math.cos(a)*2.6; if (colliders.every(c => Math.hypot(x - c.x, z - c.z) > c.r + .3)) lantern(sc, x, z); }));
  [0.8, 2.9, 4.6].forEach(a => lantern(sc, Math.cos(a)*(plazaR + .6), Math.sin(a)*(plazaR + .6)));
  [1.9, 3.8, 5.6].forEach(a => { const x = Math.cos(a)*(plazaR + 1.2), z = Math.sin(a)*(plazaR + 1.2); if (free(x, z, .8)) bench(sc, x, z, Math.atan2(-x, -z)); });
  // market stalls
  const stallN = city ? 3 : 1;
  [2.3, 3.5, 4.7].slice(0, stallN).forEach((a,i) => {
    const R0 = city ? 5 : 4.2, x = Math.cos(a)*R0, z = Math.sin(a)*R0, g = new THREE.Group(); g.position.set(x,0,z); g.rotation.y = Math.atan2(-x,-z);
    g.add(mesh(GEO.box, 0x8a6a48, 0,0,0, 2,.9,1.1));
    [[-.95,-.5],[.95,-.5],[-.95,.5],[.95,.5]].forEach(([px,pz]) => g.add(mesh(GEO.box, 0x6b4a2f, px,0,pz, .1,2.2,.1)));
    const cc = i === 1 ? owner.color : pick([0xc0392b, 0x2e86c1, 0x27ae60, 0xf1c40f], rng);
    [-1,0,1].forEach(k => g.add(mesh(GEO.box, k === 0 ? 0xf4f1ea : cc, k*.8,2.2,0, .8,.12,1.5)));
    [-.6, 0, .6].forEach(ox => { const it = makeResourceItem(pick(RES, rng)); it.scale.setScalar(.38); it.position.set(ox, .92, 0); it.rotation.y = rng()*6; g.add(it); });
    sc.add(g); colliders.push({ x, z, r:1.4 });
    const rot = Math.atan2(-x,-z); stalls.push({ x, z, front: toWorld(x, z, rot, 0, 1.9), back: toWorld(x, z, rot, 0, -1.8), vendor: null });
  });
  // laundry, trees between houses, a cart
  for (let k=0;k<(city ? 4 : 3);k++){ const p = spotAt(plazaR + 4, coreR - 2, 2.5); if (p){ const a = rng()*6.28; laundry(sc, p[0] - Math.cos(a)*2, p[1] - Math.sin(a)*2, p[0] + Math.cos(a)*2, p[1] + Math.sin(a)*2, rng, anims); } }
  for (let k=0;k<(city ? 10 : 7);k++){ const p = spotAt(plazaR + 3, coreR, 2.2); if (p) bigTree(sc, p[0], p[1], weighted([['roble', 70], ['abedul', 20], ['alamo', 10]]), .75 + rng()*.3, rng); }
  for (let k=0;k<(city ? 14 : 10);k++){ const p = spotAt(plazaR + 2, coreR, .9); if (p) bush(sc, p[0], p[1], .6 + rng()*.5, rng); }
  roadDirs.slice(0, 1).forEach(a => { const x = Math.cos(a)*(coreR - 2) + Math.sin(a)*4.5, z = Math.sin(a)*(coreR - 2) - Math.cos(a)*4.5; if (free(x, z, 1.5)) cart(sc, x, z, a + Math.PI/2, rng, 0xe3c46a); });
  // a ring of trees around the village: dense mixed woods next to forests, few but huge leafy trees elsewhere
  for (let k=0;k<(city ? 190 : 160);k++){
    const a = rng()*6.28, r = coreR - 2 + Math.pow(rng(), .75)*22, x = Math.cos(a)*r, z = Math.sin(a)*r;
    if (dRoadAt(x, z) < 4 || dSiteAt(x, z) < 2 || nearPath(x, z, 1.6) || !colliders.every(c => Math.hypot(x - c.x, z - c.z) > c.r + 1.6)) continue;
    if (baseH(x, z) < -.3) continue;
    const bio = domType(x, z), forest = bio === 'bosque' || bio === 'montana';
    if (!forest && rng() < .55) { if (rng() < .3) bush(sc, x, z, .7 + rng()*.6, rng); continue; }
    if (forest) bigTree(sc, x, z, treeKindFor(bio, rng), .75 + rng()*.6, rng);
    else bigTree(sc, x, z, treeKindFor(bio, rng), 1.15 + rng()*.45, rng);
    if (rng() < .35){ const ox = x + (rng() - .5)*4, oz = z + (rng() - .5)*4; if (dRoadAt(ox, oz) > 3.8 && !nearPath(ox, oz, 1.2)) bush(sc, ox, oz, .6 + rng()*.5, rng); }
  }

  // ---- ground cover (grass, flowers, mushrooms, pebbles)
  const N = city ? 15000 : 13000;
  for (let i=0;i<N;i++){
    const a = rng()*6.28, r = 3 + Math.pow(rng(), 1.45)*140, x = Math.cos(a)*r, z = Math.sin(a)*r;
    if (r < plazaR + .4 || dRoadAt(x,z) < 2 || dSiteAt(x,z) < -.5) continue;
    if (pit && Math.hypot(x - pit[0], z - pit[1]) < 8) continue;
    if (r < coreR + 3 && nearPath(x, z, .75)) continue;
    if (r < coreR + 3 && colliders.some(c => Math.abs(x - c.x) < c.r + .2 && Math.abs(z - c.z) < c.r + .2 && Math.hypot(x - c.x, z - c.z) < c.r)) continue;
    const y = vh(x, z);
    if (y < -.55) continue;
    groundCover(S, r < coreR - 1 ? 'core' : domType(x, z), x, z, rng, y);
  }
  for (let i=0;i<70;i++){ const a = rng()*6.28, r = plazaR + .5 + rng()*.9, x = Math.cos(a)*r, z = Math.sin(a)*r; if (dRoadAt(x,z) > 2) S.flower(x, .05, z, 1 + rng()*.4, pick(FLOWER_COLORS, rng), rng()*6); }
  S.build(sc);

  // ---- animals in the village
  { const p = spotAt(6, 14, .5); if (p) addAnimal(sc, 'perro', p[0], p[1], anims, rng, { follow: true, rad: 10 }); }
  { const p = spotAt(8, 16, .5); if (p) addAnimal(sc, 'perro', p[0], p[1], anims, rng, { rad: 9 }); }
  for (let k=0;k<2;k++){ const p = spotAt(7, 16, .4); if (p) addAnimal(sc, 'gato', p[0], p[1], anims, rng, { rad: 3 }); }
  { const p = spotAt(9, 16, 1); if (p) for (let k=0;k<6;k++) addAnimal(sc, 'gallina', p[0] + (rng() - .5)*2, p[1] + (rng() - .5)*2, anims, rng, { hx: p[0], hz: p[1], rad: 4 }); }

  // ---- people: every villager has a home, a schedule and things to do
  const freeAround = (hx, hz, rad) => { for (let k=0;k<20;k++){ const a = Math.random()*6.28, r = Math.random()*rad, x = hx + Math.cos(a)*r, z = hz + Math.sin(a)*r; if (colliders.every(c => Math.hypot(x - c.x, z - c.z) > c.r + .5)) return [x, z]; } return [hx, hz]; };
  const homes = houses.filter(h => h.type !== 'herreria' && h !== tav && !h.shop).map(h => ({ ...h, door: toWorld(h.x, h.z, h.face, 0, h.d/2 + 1) }));
  const tavern = tav ? { ...tav, door: toWorld(tav.x, tav.z, tav.face, 0, tav.d/2 + 1) } : null;
  POI.seats.forEach(st => { st.tavern = !!tav && Math.hypot(st.pos[0] - tav.x, st.pos[1] - tav.z) < 7; });
  { const ring = []; for (let i=0;i<=12;i++){ const a = i/12*Math.PI*2; ring.push([Math.cos(a)*(plazaR + 1), Math.sin(a)*(plazaR + 1)]); } navLines.push(ring); }
  roadDirs.forEach(a => { const ln = []; for (let r = plazaR + 1; r <= coreR + 8; r += 2.5) ln.push([Math.cos(a)*r - Math.sin(a)*.9, Math.sin(a)*r + Math.cos(a)*.9]); navLines.push(ln); });
  const sitesPts = [];
  sites.filter(s2 => s2.type !== 'mar').forEach(s2 => { const ln = []; for (let r = coreR - 6; r <= s2.R - s2.rad*.55; r += 2.5) ln.push([Math.cos(s2.a)*r, Math.sin(s2.a)*r]); if (ln.length > 1){ navLines.push(ln); sitesPts.push(ln[ln.length - 1]); } });
  const V = { shops, people, colliders, vh, freeAround, plazaR, coreR, seats: POI.seats, gardens: POI.gardens, stalls, tavern, homes, sitesPts, meets: [], it: null, nav: buildNav(navLines, []), dayN: () => DAY.n || 0 };
  if (bak) stalls.push({ x: bak.x, z: bak.z, front: toWorld(bak.x, bak.z, bak.face, -.9, bak.d/2 + 1.6), back: toWorld(bak.x, bak.z, bak.face, -.9, bak.d/2 + .55), vendor: null, bakery: true });
  const roles = ['niño','niño','niño','anciano','anciano','panadero','guardia','guardia','comerciante','vecino','vecino','vecino','vecino','vecino'];
  if (city) roles.push('niño','niño','anciano','comerciante','comerciante','vecino','vecino','vecino','vecino','vecino','guardia');
  for (let k=0;k<conn;k++) roles.push('vecino', 'vecino', 'niño', k % 2 ? 'comerciante' : 'anciano');
  const plans = roles.map(role => ({ role, hx: 0, hz: 0 }));
  plans.forEach((pl, i) => { if (pl.role === 'guardia'){ const a = roadDirs[i % Math.max(1, roadDirs.length)] ?? 0; const sd = (i % 2 ? 1 : -1); pl.hx = Math.cos(a)*(coreR - 4) + Math.sin(a)*2.8*sd; pl.hz = Math.sin(a)*(coreR - 4) - Math.cos(a)*2.8*sd; pl.guard = true; } });
  workerSpots.forEach(sp => plans.push({ role: sp.role, hx: sp.x, hz: sp.z, work: true }));
  shops.forEach(sh => plans.push({ role: sh.D.role, shop: sh, hx: sh.back[0], hz: sh.back[1] }));
  for (let k=0;k<Math.min(4, shops.length);k++) plans.push({ role: 'vecino' });
  if (sites.some(s => s.type === 'pradera')) { const sp = workerSpots.find(w => w.role === 'pastor'); if (sp) plans.push({ role: 'campesino', hx: sp.x, hz: sp.z, work: true }); }
  let hi = 0;
  plans.forEach(pl => {
    const gender = pl.role === 'guardia' ? (rng() < .3 ? 'f' : 'm') : (rng() < .5 ? 'f' : 'm');
    const p = makePerson(rng, pl.role, gender, owner.color);
    Object.assign(p, { V, hx: pl.hx, hz: pl.hz, work: !!pl.work, guard: !!pl.guard, speed: p.kid ? 1.25 : p.old ? .42 : pl.guard ? .6 : .58 + rng()*.3, stuck: 0, chatCD: rng()*8, spd: 0 });
    p.home = homes.length ? homes[hi++ % homes.length] : null;
    if (p.guard){ const a = Math.atan2(p.hz, p.hx); p.posts = [[p.hx, p.hz], [p.hx + Math.cos(a)*7, p.hz + Math.sin(a)*7], [p.hx - Math.cos(a)*6, p.hz - Math.sin(a)*6]]; p.patrol = 0; }
    if (pl.shop){ p.shop = pl.shop; pl.shop.vendor = p; p.vendor = pl.shop; p.home = p.home || null; }
    else if (p.role === 'comerciante'){ const s = stalls.find(q => !q.vendor && !q.bakery); if (s){ s.vendor = p; p.vendor = s; } }
    if (p.role === 'panadero' && !pl.shop){ const s = stalls.find(q => !q.vendor && q.bakery) || stalls.find(q => !q.vendor); if (s){ s.vendor = p; p.vendor = s; } }
    let x, z;
    if (p.vendor) [x, z] = p.vendor.back; else if (p.work || p.guard) [x, z] = freeAround(p.hx, p.hz, 2); else [x, z] = freeAround(0, 0, coreR*.7);
    p.g.position.set(x, vh(x, z), z); p.g.rotation.y = rng()*6.28;
    idle(p, rng()*3);
    if (isNight() && !p.guard && p.home){ p.g.visible = false; p.st = { kind: 'inside', h: p.home, t: 999 }; }
    p.g.traverse(o => { if (o.isMesh){ o.userData.person = p; clickables.push(o); } });
    sc.add(p.g); people.push(p);
    anims.push((dt, t) => personTick(V, p, dt, t));
  });
  animals.forEach(a => a.g.traverse(o => { if (o.isMesh){ o.userData.animal = a; clickables.push(o); } }));

  // ---- sky life
  birdFlock(sc, anims, rng, 0, 0, { n: 7, r: 45, h: 30 });
  birdFlock(sc, anims, rng, 40, -30, { n: 5, r: 30, h: 38, speed: -.2 });
  if (slots.some(s => s.type === 'mar')) { const s = slots.find(q => q.type === 'mar'); birdFlock(sc, anims, rng, Math.cos(s.a)*60, Math.sin(s.a)*60, { n: 5, r: 18, h: 14, color: 0xf4f6f8, speed: .45 }); }
  butterflies(sc, anims, rng, 0, 0, city ? 16 : 12, 18);
  clouds(sc, anims, rng, 0, 0, 340);
  pollen(sc, anims);
  CUR_TREES.build(sc); CUR_TREES = null;
  makeEnv(sc, { shadow: true, fireflies: true, lights: lightSpots, far: [0, 0, vid*3 + 1] });
  CUR_COLL = null; CUR_ANIMS = null; CUR_ANIMALS = null; CUR_LIGHTS = null; CUR_POI = null;

  const startA = roadDirs.length ? roadDirs[0] : Math.PI/2;
  const startR = coreR - 3;
  return { brujo, qboard, V, sc, anims, colliders, people, animals, clickables, vid, gh: vh, types: slots.map(s => s.type), sites, start: { x: Math.cos(startA)*startR, z: Math.sin(startA)*startR } };
}

const ctl = { yaw:0, pitch:-.05, keys:{}, pos: new THREE.Vector3(), bob:0 };
function updateVillage(dt, t){
  const c = villageCtx, k = ctl.keys;
  const f = ((k.w || k.arrowup) ? 1 : 0) - ((k.s || k.arrowdown) ? 1 : 0);
  const s = ((k.d || k.arrowright) ? 1 : 0) - ((k.a || k.arrowleft) ? 1 : 0);
  if (f || s){
    const sp = (k.shift ? 11 : 5.5) * dt;
    const fx = -Math.sin(ctl.yaw), fz = -Math.cos(ctl.yaw), rx = Math.cos(ctl.yaw), rz = -Math.sin(ctl.yaw);
    let mx = fx*f + rx*s, mz = fz*f + rz*s; const l = Math.hypot(mx,mz); mx /= l; mz /= l;
    ctl.pos.x += mx*sp; ctl.pos.z += mz*sp;
    const ob = Math.floor(ctl.bob/Math.PI); ctl.bob += dt*(k.shift ? 13 : 9);
    if (Math.floor(ctl.bob/Math.PI) !== ob) SFX.step(k.shift ? 1.4 : 1);
  }
  const push = (x, z, r) => { const dx = ctl.pos.x - x, dz = ctl.pos.z - z; if (Math.abs(dx) > r + .5 || Math.abs(dz) > r + .5) return; const d = Math.hypot(dx,dz), min = r + .4; if (d < min && d > 1e-4){ ctl.pos.x = x + dx/d*min; ctl.pos.z = z + dz/d*min; } };
  for (const h of c.colliders) push(h.x, h.z, h.r);
  if (f || s) for (const p of c.people) if (p.g.visible && p.st.kind !== 'sit') push(p.g.position.x, p.g.position.z, .3*p.S);
  for (const a of c.animals) push(a.g.position.x, a.g.position.z, .35);
  const R = Math.hypot(ctl.pos.x, ctl.pos.z); if (R > 150){ ctl.pos.x *= 150/R; ctl.pos.z *= 150/R; }
  const gy = Math.max(c.gh(ctl.pos.x, ctl.pos.z), -.3);
  ctl.y = ctl.y === undefined ? gy : ctl.y + (gy - ctl.y)*Math.min(1, dt*12);
  camera.position.set(ctl.pos.x + Math.cos(ctl.bob*.5)*.03, ctl.y + 1.7 + Math.abs(Math.sin(ctl.bob))*.07, ctl.pos.z);
  camera.rotation.order = 'YXZ'; camera.rotation.set(ctl.pitch, ctl.yaw, Math.sin(ctl.bob*.5)*.006);
  c.anims.forEach(fn => fn(dt, t));
}
function openVillage(vid){
  disposeCtx();
  villageCtx = buildVillage(vid);
  setTimeout(() => villageQuest(vid), 1500);
  const v = G.verts[vid], P = G.players[v.building.p];
  ctl.pos.set(villageCtx.start.x, 1.7, villageCtx.start.z); ctl.y = undefined;
  ctl.yaw = Math.atan2(villageCtx.start.x, villageCtx.start.z); ctl.pitch = -.06; ctl.keys = {};
  camera.fov = 70; camera.near = .05; camera.far = 900; camera.updateProjectionMatrix();
  mode = 'village'; document.body.dataset.mode = 'village'; controls.enabled = false;
  refresh(); canvas.focus();
  setTimeout(() => { if (villageCtx && villageCtx.vid === vid) villageNote(v); }, 400);
}
const ANIMAL_SAYS = { cabra: '¡Meeeeh!', oveja: '¡Beeeee!', vaca: '¡Muuuuu!', cerdo: '¡Oinc, oinc!', gallina: '¡Coc, coc, cocoroco!', caballo: '¡Hiiiii! (resopla)', perro: '¡Guau, guau! (mueve la cola)', gato: 'Miau… (te ignora)', ciervo: '(te mira y sale corriendo)', conejo: '(mueve la nariz)' };
const ANIMAL_NAME = { cabra: 'Cabra', oveja: 'Oveja', vaca: 'Vaca', cerdo: 'Cerdo', gallina: 'Gallina', caballo: 'Caballo', perro: 'Perro', gato: 'Gato', ciervo: 'Ciervo', conejo: 'Conejo' };
function say(html, av){ sysNote(html, { ms: 4800, av }); }
function brujoTalk(w){
  const q = (G.quests || []).find(x => x.p === 0 && x.vid === villageCtx.vid && x.kind === 'brujo' && x.state === 'new');
  say3D(w, q ? '🔮' : '🌙', 1.6);
  if (q){ questDialog(q); return; }
  const acc = (G.quests || []).find(x => x.p === 0 && x.kind === 'brujo' && x.state === 'accepted');
  say(`<b>El brujo:</b> ${acc ? (questReady(acc) ? 'Ya tienes todo… entrégalo desde tu despacho y te daré tu amuleto.' : 'Aún te falta algo para mi caldero. ' + qImgs(acc)) : pick(['La luna sabe cosas que tú no… vuelve otro día.', 'Mis amuletos no se regalan, se ganan.', 'Huele a tormenta. O a sopa. A veces confundo.'])}`);
}
function villageClick(e){
  setRay(e);
  const hit = ray.intersectObjects(villageCtx.clickables, false).find(h => { let o = h.object; while (o){ if (!o.visible) return false; o = o.parent; } return true; });
  if (!hit || hit.distance > 25) return;
  if (hit.object.userData.qposter){ posterTalk(hit.object.userData.qposter); return; }
  const an = hit.object.userData.animal;
  if (an){ const kind = an.kindName; SFX.animal(kind); say(`<b>${ANIMAL_NAME[kind] || 'Animal'}:</b> ${ANIMAL_SAYS[kind] || '…'}`); return; }
  const p = hit.object.userData.person;
  if (!p) return;
  if (p.brujo){ brujoTalk(p); return; }
  const busy = ['chat','meetWait','sit','trade','vend','work','tend','well','inside','enter'].includes(p.st.kind);
  if (!busy){ idle(p, 4.5); p.g.rotation.y = Math.atan2(camera.position.x - p.g.position.x, camera.position.z - p.g.position.z); }
  say3D(p, '👋', 1.5);
  const pool = [...(ROLE_LINES[p.role] || []), ...(ROLE_LINES[p.role] || [])];
  const k = p.st.kind, m = p.st.meet;
  if ((k === 'chat' || k === 'meetWait') && m){ const other = m.members.find(w => w !== p); pool.length = 0; pool.push(`Aquí platicando con ${other ? other.name : 'los vecinos'} sobre ${m.topic}.`, `¿Tú qué opinas de ${m.topic}?`); }
  else if (k === 'trade') { pool.length = 0; pool.push('Vine al puesto a cambiar unas cosas. ¡Aquí todo se consigue!'); }
  else if (k === 'vend') { pool.length = 0; pool.push('¡Pásele, pásele! Tengo de todo un poco.', p.role === 'panadero' ? '¡Pan recién horneado!' : '¿Qué le doy? Precio justo.'); }
  else if (k === 'sit') { pool.length = 0; pool.push(p.st.icon ? '¡Salud! Aquí en la taberna se está a gusto.' : 'Descansando un rato, que el día es largo.'); }
  else if (k === 'tend') { pool.length = 0; pool.push('Hay que cuidar el huerto todos los días.', 'Estas calabazas van a quedar enormes.'); }
  else if (k === 'well') { pool.length = 0; pool.push('Sacando agua del pozo para la casa.'); }
  else if (k === 'play') { pool.length = 0; pool.push('¡No me alcanzas!', '¡Estamos jugando a las traes!'); }
  else if (p.carry) pool.push('Ya llevo lo que necesitaba, voy para mi casa.');
  if (!p.work) { pool.push(...LINES.generic); villageCtx.types.forEach(t => pool.push(...(LINES[t] || []))); }
  const v = G.verts[villageCtx.vid];
  if (v.building.p === 0 && !p.kid) pool.push('¡Gracias por fundar este lugar! Aquí estamos a gusto.');
  if (G.gossip.length && Math.random() < .35) pool.push(`Me contaron que ${pick(G.gossip)}.`);
  SFX.talk(p);
  if (ENV_STATE.nightF > .6 && !p.guard) pool.push('Ya es tarde, mejor me voy a descansar.', '¡Qué bonitas se ven las luciérnagas!');
  say(`<b>${p.name}</b> <span class="muted">(${p.label})</span>: ${pick(pool)}`);
}

