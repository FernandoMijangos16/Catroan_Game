function pirateModel(rng, opt = {}){
  const p = makePerson(rng, 'comerciante', 'm', 0x2a2a3a, { expr: 'serio', beard: true, ...opt });
  p.head.children.forEach(o => { if (o.position.y > .33) o.visible = false; });
  const coat = fabricMat(0x2a3048, 'wool', 1), trim = mat(0xc89a40), sash = fabricMat(0x9a2a22, 'cloth', 2);
  // tricorn
  const hat = new THREE.Group(); hat.position.set(0, .43, -.01); p.head.add(hat);
  hat.add(mesh(PGEO.crown, 0x1e1a18, 0, 0, 0, .15, .1, .14));
  [0, 2.094, 4.189].forEach(a => { const b = mesh(GEO.box, 0x1e1a18, Math.sin(a)*.12, .015, Math.cos(a)*.12, .26, .05, .035); b.rotation.y = a; b.rotation.x = -.35; hat.add(b); const t = mesh(GEO.box, trim, Math.sin(a)*.135, .055, Math.cos(a)*.135, .24, .012, .012); t.rotation.y = a; hat.add(t); });
  // long coat, sash, buttons
  p.body.add(mesh(PGEO.skirt, coat, 0, .42, -.01, .25, .58, .19));
  p.body.add(mesh(PGEO.chest, coat, 0, 1.14, -.006, .235, .33, .15));
  p.body.add(mesh(GEO.box, sash, 0, .92, 0, .35, .08, .25));
  p.body.add(mesh(GEO.box, sash, .12, .76, .12, .06, .18, .02));
  [1.05, 1.15, 1.25].forEach(y => [-1, 1].forEach(s => p.body.add(mesh(GEO.sphere, trim, s*.07, y, .145, .012, .012, .008))));
  [p.armL, p.armR].forEach(a => { a.children.forEach(c => { if (c.isMesh && c.geometry === PGEO.limb) c.material = coat; }); const cuff = mesh(PGEO.joint, coat, 0, -.27, 0, .06, .04, .06); a.add(cuff); });
  // beard, eyepatch and a parrot
  p.head.add(mesh(PGEO.rbox, 0x2b1d14, 0, .15, .1, .2, .12, .1));
  p.head.add(mesh(GEO.box, 0x0a0806, .055, .29, .128, .06, .045, .01));
  const strap = mesh(GEO.box, 0x0a0806, 0, .31, .0, .25, .012, .26); strap.rotation.z = .25; p.head.add(strap);
  const par = new THREE.Group(); par.position.set(-.21, 1.52, -.02); p.body.add(par);
  par.add(mesh(GEO.sphere, 0x2a9a3a, 0, .06, 0, .05, .07, .045)); par.add(mesh(GEO.sphere, 0x2a9a3a, 0, .14, .01, .035, .035, .035)); par.add(mesh(GEO.cone4, 0xe8a020, 0, .13, .045, .012, .03, .012)).rotation.x = Math.PI/2;
  par.add(mesh(GEO.box, 0xd83a2a, 0, .02, -.05, .02, .08, .03)); [-1, 1].forEach(s => par.add(mesh(GEO.sphere, 0x111111, s*.025, .15, .03, .006, .006, .006)));
  p.parrot = par;
  return p;
}
function woodTex(base, seed = 1, opts = {}){
  const key = 'wood' + base + seed + (opts.tar ? 't' : '') + (opts.algae ? 'a' : ''); if (FAB.has(key)) return FAB.get(key);
  const B = new THREE.Color(base), ph = opts.plank || 8;
  const tex = pxTex(32, 32, c => {
    for (let y=0;y<32;y++){ const row = Math.floor(y/ph), tone = .86 + hash2(row, 3, seed)*.26, off = Math.floor(hash2(row, 4, seed)*32);
      for (let x=0;x<32;x++){ const gx = (x + off) % 32, grain = Math.sin(gx*.5 + y*1.7 + row*3)*.5 + .5, streak = hash2(gx >> 1, y, seed + 7) > .8 ? .86 : 1;
        let k = tone*(.9 + grain*.12)*streak*(.95 + hash2(x, y, seed)*.1);
        if (y % ph === 0) k *= opts.tar ? .35 : .5;                         // seam between planks
        if (gx === 15 || gx === 31) k *= .72;                               // butt joint
        if ((gx === 14 || gx === 30) && (y % ph === 2 || y % ph === ph - 2)) k = 1.35;   // nail heads
        const kn = hash2(row, 9, seed)*32; if (Math.hypot(gx - kn, (y % ph) - ph/2) < 1.3) k *= .55;   // knot
        if (opts.algae && y > 24) k *= .8;
        const col = B.clone().multiplyScalar(k); if (opts.algae && y > 24) col.lerp(new THREE.Color(0x2e4a2a), .45);
        c.fillStyle = '#' + col.getHexString(); c.fillRect(x, y, 1, 1); } }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; const m = keepMat(new THREE.MeshStandardMaterial({ map: tex, roughness: .9, flatShading: true })); FAB.set(key, m); return m;
}
const woodMat = (base, seed, rx = 1, ry = 1, opts = {}) => { const m = woodTex(base, seed, opts).clone(); m.map = m.map.clone(); m.map.repeat.set(rx, ry); m.map.needsUpdate = true; return keepMat(m); };
function shipModel(rng){
  const g = new THREE.Group(), A = houseAssets();
  const hullM = woodMat(0x7a4e2c, 3, 3, 3, { tar: true }), darkM = woodMat(0x4a2e18, 5, 1, 4);
  // hull from a lathe-like profile stretched along z; bow points to +z
  const hullGeo = (() => { const pts = [], L = 7, W = 1.35; const sec = 9, rows = 10; const pos = [], idx = [];
    for (let i=0;i<=rows;i++){ const u = i/rows, z = -L/2 + u*L, wb = W*Math.sin(Math.PI*Math.min(1, u*1.05 + .02))**.55*(u > .8 ? 1 - (u - .8)*2.6 : 1);
      for (let j=0;j<=sec;j++){ const a = -Math.PI/2 + Math.PI*j/sec, x = Math.sin(a)*Math.max(.05, wb), y = -Math.cos(a)*1.05*(1 - u*.15) + 1.05 + (u > .85 ? (u - .85)*2.2 : 0) - .2*(u < .12 ? (.12 - u)*-4 : 0); pos.push(x, Math.max(0, y) - .05 + (1 - Math.abs(Math.cos(a)))*0, z); } }
    for (let i=0;i<rows;i++) for (let j=0;j<sec;j++){ const a = i*(sec + 1) + j, b = a + 1, c = a + sec + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gg.setIndex(idx);
    const uv = []; for (let i=0;i<=rows;i++) for (let j=0;j<=sec;j++) uv.push(i/rows*4, j/sec); gg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); gg.computeVertexNormals(); return sg(gg); })();
  const hull = new THREE.Mesh(hullGeo, hullM); hull.material.side = THREE.DoubleSide; hull.castShadow = true; g.add(hull);
  { const wl = new THREE.Mesh(hullGeo, keepMat(new THREE.MeshStandardMaterial({ color: 0x2a3a2a, roughness: 1, flatShading: true, side: THREE.DoubleSide }))); wl.scale.set(1.01, .32, 1.01); wl.position.y = -.02; g.add(wl); }   // tarred, weedy waterline
  g.add(mesh(GEO.box, darkM, 0, 1.02, 0, 2.5, .06, 6.2));            // deck
  [-1, 1].forEach(s => { g.add(mesh(GEO.box, darkM, s*1.26, 1.05, -.2, .08, .32, 6.0)); g.add(mesh(GEO.box, 0xc89a40, s*1.27, .78, -.2, .04, .05, 6.0)); });  // rails, gold strake
  g.add(mesh(GEO.box, darkM, 0, 1.05, -3.3, 2.4, .9, .1)); g.add(mesh(GEO.box, hullM, 0, 1.05, -2.6, 2.4, .9, 1.3));     // stern castle
  for (let k=0;k<4;k++) g.add(mesh(GEO.box, LAMP_MAT, -.8 + k*.55, 1.45, -3.36, .22, .2, .03, false));
  // bowsprit and figurehead
  const bs = mesh(GEO.cyl, 0x4a2c18, 0, 1.2, 3.2, .06, 2.2, .06); bs.rotation.x = Math.PI/2 - .35; g.add(bs);
  g.add(mesh(GEO.sphere, 0xc89a40, 0, 1.0, 3.55, .14, .2, .14));
  // masts, yards, sails and flag
  const sailM = keepMat(new THREE.MeshStandardMaterial({ map: stripeTex('#2a2420', '#8a2a22'), roughness: 1, side: THREE.DoubleSide, flatShading: true }));
  [[1.1, 5.2], [-1.4, 4.4]].forEach(([z, h], i) => { g.add(mesh(GEO.cyl, 0x4a2c18, 0, 1, z, .09, h, .09));
    [h*.55, h*.85].forEach((y, k) => { g.add(mesh(GEO.cyl, 0x4a2c18, 0, 1 + y, z, .05, .05, .05)); const yard = mesh(GEO.box, 0x4a2c18, 0, 1 + y, z, 2.6 - k*.6, .07, .07); g.add(yard);
      const sl = new THREE.Mesh(sg(new THREE.PlaneGeometry(1, 1, 4, 3)), sailM); const sp = sl.geometry.attributes.position; for (let q=0;q<sp.count;q++) sp.setZ(q, Math.sin((sp.getX(q) + .5)*Math.PI)*.12*(1 - (sp.getY(q) + .5)*.3)); sl.geometry.computeVertexNormals(); sl.scale.set(2.4 - k*.6, h*.26, 1); sl.position.set(0, 1 + y - h*.14, z + .05); g.add(sl); });
    if (i === 0){ const fl = new THREE.Mesh(FLAG_TRI, keepMat(new THREE.MeshStandardMaterial({ color: 0x111111, side: THREE.DoubleSide }))); fl.scale.set(.9, .5, 1); fl.position.set(0, 1 + h - .1, z); fl.rotation.y = Math.PI/2; g.add(fl); g.userData.flag = fl; } });
  // ropes from masts to the hull
  [[1.1, 5.2], [-1.4, 4.4]].forEach(([z, h]) => [-1, 1].forEach(s => { const a = new THREE.Vector3(0, 1 + h*.9, z), b = new THREE.Vector3(s*1.25, 1.1, z - .6), d = b.clone().sub(a), r = mesh(GEO.cyl, 0x2a2018, 0, 0, 0, .012, d.length(), .012, false); r.position.copy(a); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(r); }));
  // cargo at the bow
  g.add(mesh(GEO.box, 0x8a6a40, .7, 1.05, 2.1, .4, .35, .4)); g.add(mesh(GEO.cyl, 0x7a4e2c, -.7, 1.05, 2.2, .2, .45, .2));
  g.add(mesh(GEO.cyl14, 0xc89a40, -.6, 1.05, 1.4, .18, .08, .18));
  outlineItem(g);
  return g;
}
