// ================= BOARD SCENE =================
function numberToken(n){
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  c.fillStyle = '#f6ecd2'; c.beginPath(); c.arc(64,64,62,0,Math.PI*2); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 3; c.stroke();
  c.fillStyle = (n===6||n===8) ? '#c0392b' : '#2b2b2b';
  c.font = 'bold 60px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(n, 64, 56);
  const p = pips(n); for (let i=0;i<p;i++){ c.beginPath(); c.arc(64 + (i-(p-1)/2)*12, 99, 4.5, 0, Math.PI*2); c.fill(); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const g = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.04,28), mat(0xd9c9a3)); disc.castShadow = true; g.add(disc);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(.6,.6).rotateX(-Math.PI/2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .5 }));
  plane.position.y = .022; g.add(plane);
  g.position.y = .22;
  return g;
}
const TILE_R = .97, TILE_IN = TILE_R*SQ3/2;
const TILE_AMP = { montana:.62, cerro:.22, bosque:.1, pradera:.06, campo:.025, desierto:.09 };
function tileHeight(t, lx, lz){
  const hr = Math.max(Math.abs(lx), Math.abs(lx*.5 + lz*SQ3/2), Math.abs(-lx*.5 + lz*SQ3/2)) / TILE_IN;
  const r = Math.hypot(lx, lz);
  const k = (1 - smoothstep(.7, 1, hr)) * smoothstep(.33, .56, r);
  if (k <= 0) return 0;
  const wx = t.x + lx, wz = t.z + lz, n = fbm(wx*2.4 + 40, wz*2.4, 3);
  let h;
  if (t.type === 'montana') h = Math.pow(n, 1.3)*1.55;
  else if (t.type === 'desierto') h = Math.sin(wx*7 + n*4)*.5 + .5;
  else h = n;
  return h * TILE_AMP[t.type] * k;
}
function tileColor(t, wx, y, wz, r){
  switch (t.type){
    case 'montana': return jc(y > .33 ? 0xf3f6fa : y > .17 ? 0x9aa1ad : y > .05 ? 0x7e8592 : 0x8d9a74, r, .08);
    case 'cerro': return jc(y > .09 ? 0xd4773f : (fbm(wx*3, wz*3, 8) > .5 ? 0xc96a3a : 0xa9b85a), r, .1);
    case 'bosque': return jc(fbm(wx*4, wz*4, 9) > .5 ? 0x3f8f45 : 0x347c3a, r, .1);
    case 'pradera': return jc(fbm(wx*4, wz*4, 10) > .55 ? 0x9bd86a : 0x86c95a, r, .1);
    case 'campo': { const u = Math.floor((wx*.8 + wz*.6)*3.2), v = Math.floor((-wx*.6 + wz*.8)*4.5); return jc([0xf2cc56,0xe6b23f,0xd2cf68,0xf6dc85,0xa8d062][Math.floor(hash2(u, v, 11)*5)], r, .06); }
    case 'desierto': return jc(y > .045 ? 0xf0d9a0 : 0xe4c88c, r, .07);
  }
  return jc(0x7cc456, r);
}
function hexTileMesh(t){
  const n = 7, pos = [];
  const corner = k => { const a = (60*k - 30)*Math.PI/180; return [TILE_R*Math.cos(a), TILE_R*Math.sin(a)]; };
  const tri = (a, b, c) => {
    const cr = (b[2] - a[2])*(c[0] - a[0]) - (b[0] - a[0])*(c[2] - a[2]);
    if (cr > 0) pos.push(...a, ...b, ...c); else pos.push(...a, ...c, ...b);
  };
  for (let k=0;k<6;k++){
    const [ax,az] = corner(k), [bx,bz] = corner(k+1);
    const P = (i,j) => { const x = ax*i/n + (bx - ax)*j/n, z = az*i/n + (bz - az)*j/n; return [x, tileHeight(t, x, z), z]; };
    for (let i=0;i<n;i++) for (let j=0;j<=i;j++){ tri(P(i,j), P(i+1,j), P(i+1,j+1)); if (j < i) tri(P(i,j), P(i+1,j+1), P(i,j+1)); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  colorize(g, (x,y,z,r) => tileColor(t, t.x + x, y, t.z + z, r), mulberry32(t.i*31 + 5));
  const m = new THREE.Mesh(g, LP_BOARD); m.position.y = .2; m.receiveShadow = true; m.castShadow = true; return m;
}
function tileProps(g, t, sc, anims){
  const rng = mulberry32(t.i*977 + 7);
  const inHex = (lx, lz, m=.9) => Math.max(Math.abs(lx), Math.abs(lx*.5 + lz*SQ3/2), Math.abs(-lx*.5 + lz*SQ3/2)) < TILE_IN*m;
  const pos = (d0=.4, d1=.86) => { for (let k=0;k<12;k++){ const a = rng()*Math.PI*2, d = d0 + rng()*(d1 - d0), x = Math.cos(a)*d, z = Math.sin(a)*d; if (inHex(x, z)) return [x, z]; } return [d0, 0]; };
  const Y = (x,z) => .2 + tileHeight(t, x, z);
  const add = m => g.add(m);
  const treeAt = (lx, lz, kind, s) => CUR_TREES.add(kind, t.x + lx, Y(lx, lz) - .004, t.z + lz, s, rng()*6.28, treeTint(kind, rng));
  const rockB = (x,z,s,c) => { const m = mesh(pick(GEO.rocks, rng), c, x, Y(x,z) + .01, z, .05*s,.035*s,.045*s); m.rotation.y = rng()*6; add(m); };
  const animal = (kind, n, sc2, rad=.22) => { for (let i=0;i<n;i++){ const a = rng()*6.28, hx = t.x + Math.cos(a)*.56, hz = t.z + Math.sin(a)*.56; addAnimal(sc, kind, hx, hz, anims, rng, { hx, hz, rad, scale: sc2, speedMul: .045, noFlee: true }); } };
  switch (t.type){
    case 'bosque':
      for (let i=0;i<40;i++){ const [x,z] = pos(.36, .9); treeAt(x, z, treeKindFor('bosque', rng), .02 + rng()*.013); }
      animal('ciervo', 2, .032, .2);
      break;
    case 'pradera':
      for (let i=0;i<5;i++){ const [x,z] = pos(.5, .85); treeAt(x, z, treeKindFor('pradera', rng), .024 + rng()*.01); }
      animal('oveja', 6, .038); animal('vaca', 1, .03);
      { let prev = null; for (let a = .3; a < 2.4; a += .18){ const x = Math.cos(a)*.7, z = Math.sin(a)*.7; if (!inHex(x, z, .95)) { prev = null; continue; } add(mesh(GEO.box, 0x7a5a3a, x, Y(x,z), z, .008, .03, .008, false)); if (prev){ const r = mesh(GEO.box, 0x8a6a48, (x + prev[0])/2, Y(x,z) + .02, (z + prev[1])/2, Math.hypot(x - prev[0], z - prev[1]), .004, .004, false); r.rotation.y = Math.atan2(-(z - prev[1]), x - prev[0]); add(r); } prev = [x, z]; } }
      break;
    case 'campo': {
      for (let i=0;i<3;i++){ const [x,z] = pos(.62, .86); treeAt(x, z, 'alamo', .014 + rng()*.005); }
      for (let i=0;i<4;i++){ const [x,z] = pos(.45,.8); const y = Y(x,z); add(mesh(GEO.cyl, 0xe0bd55, x,y,z, .03,.035,.03)); add(mesh(GEO.cone7, 0xd4ad44, x,y+.035,z, .032,.026,.032)); }
      const [mx, mz] = pos(.55, .7), my = Y(mx, mz), mill = new THREE.Group(); mill.position.set(mx, my, mz); mill.rotation.y = Math.atan2(-mx, -mz); add(mill);
      mill.add(mesh(PGEO.crown, 0xf0ebe0, 0,0,0, .035,.15,.035)); mill.add(mesh(GEO.cone7, 0xa0402e, 0,.15,0, .04,.05,.04));
      const bl = new THREE.Group(); bl.position.set(0, .15, .04); mill.add(bl); for (let k=0;k<4;k++){ const b2 = new THREE.Group(); b2.rotation.z = k*Math.PI/2; b2.add(mesh(GEO.box, 0xd8cdb8, .006, 0, 0, .012, .12, .003, false)); bl.add(b2); }
      anims.push(dt => { bl.rotation.z += dt*1.2; });
      animal('caballo', 1, .025); animal('gallina', 3, .05, .1);
      break; }
    case 'cerro': {
      for (let i=0;i<4;i++){ const [x,z] = pos(.5, .86); treeAt(x, z, treeKindFor('cerro', rng), .016 + rng()*.006); }
      for (let i=0;i<4;i++){ const [x,z] = pos(); rockB(x, z, .8 + rng()*.6, pick([0xb8643a, 0x9c5a3a], rng)); }
      const [kx, kz] = pos(.5, .7), ky = Y(kx, kz);
      add(mesh(GEO.box, 0x8f4a32, kx, ky, kz, .07, .06, .07)); add(mesh(GEO.sphere, 0x8f4a32, kx, ky + .06, kz, .035, .022, .035)); add(mesh(GEO.cyl, 0x6d3624, kx + .02, ky + .06, kz + .02, .01, .06, .01));
      smokeSource(sc, t.x + kx + .02, ky + .13, t.z + kz + .02, anims, .035, 0x9a948c);
      for (let i=0;i<3;i++){ const [x,z] = pos(.45,.8); add(mesh(GEO.box, 0x9c4a2e, x, Y(x,z), z, .05, .025, .03)); }
      { const [x,z] = pos(.5,.75); add(mesh(GEO.cyl14, 0x7a4a30, x, Y(x,z) - .002, z, .07, .006, .06, false)); add(mesh(GEO.cyl14, 0x5f7f96, x, Y(x,z) + .002, z, .03, .004, .025, false)); }
      break; }
    case 'montana':
      for (let i=0;i<4;i++){ const [x,z] = pos(); rockB(x,z,.7 + rng()*.6, 0x8b8f98); }
      for (let i=0;i<12;i++){ const [x,z] = pos(.42,.88); if (tileHeight(t,x,z) < .1) treeAt(x, z, rng() < .6 ? 'abeto' : 'pino', .016 + rng()*.007); }
      animal('cabra', 2, .03, .18);
      { const [x,z] = pos(.55,.72); add(mesh(GEO.box, 0x15120f, x, Y(x,z), z, .04, .04, .01, false)); }
      break;
    case 'desierto': {
      for (let i=0;i<4;i++){ const [x,z] = pos(); const y = Y(x,z); add(mesh(GEO.cyl, 0x4f8a4a, x,y,z, .022,.12,.022)); add(mesh(GEO.cyl, 0x4f8a4a, x+.03,y+.05,z, .014,.05,.014)); }
      for (let i=0;i<3;i++){ const [x,z] = pos(); rockB(x, z, .7, 0xc9a36a); }
      const tw = mesh(GEO.blobs[1], 0xa08050, 0, 0, 0, .025, .025, .025, true); add(tw);
      const a0 = rng()*6.28, ph = rng()*10;
      anims.push((dt, tt) => { const k = ((tt*.06 + ph) % 1)*1.4 - .7, x = Math.cos(a0)*k + Math.sin(a0)*.45, z = Math.sin(a0)*k - Math.cos(a0)*.45; tw.position.set(x, Y(x, z) + .025 + Math.abs(Math.sin(tt*6))*.01, z); tw.rotation.z -= dt*6; tw.visible = inHex(x, z, .92); });
      break; }
  }
}
function boardHouse(color, city){
  const g = new THREE.Group();
  if (!city){
    g.add(mesh(GEO.box, color, 0,0,0, .2,.14,.2));
    const roof = mesh(GEO.cone4, color, 0,.14,0, .17,.13,.17); roof.rotation.y = Math.PI/4; g.add(roof);
  } else {
    g.add(mesh(GEO.box, color, .06,0,0, .3,.15,.2));
    const r1 = mesh(GEO.cone4, color, .1,.15,0, .14,.1,.14); r1.rotation.y = Math.PI/4; g.add(r1);
    g.add(mesh(GEO.box, color, -.09,0,0, .14,.32,.14));
    const r2 = mesh(GEO.cone4, color, -.09,.32,0, .11,.13,.11); r2.rotation.y = Math.PI/4; g.add(r2);
  }
  return g;
}
