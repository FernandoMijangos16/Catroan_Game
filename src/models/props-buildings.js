function roofGeo(w, d, rh, color, rng, wallColor){
  rng = rng || Math.random;
  if (color === undefined) color = 0xa0522d;
  const W = w/2 + .35, L = Math.hypot(W, rh) + .08, a = Math.atan2(rh, W), D = d + .5, rows = Math.max(4, Math.round(L/.45));
  const parts = [];
  [-1, 1].forEach(side => {
    const b = new THREE.BoxGeometry(L, .14, D, rows, 1, 1).toNonIndexed();
    colorize(b, (x,y,z,r) => { const row = Math.floor((x + L/2)/(L/rows)); const c = jc(color, r, .07); if (row % 2) c.offsetHSL(0, 0, -.05); if (y < 0) c.offsetHSL(0, 0, -.12); return c; }, rng);
    const m = new THREE.Matrix4().makeRotationZ(side < 0 ? a : -a);
    m.setPosition(side*W/2 - side*Math.sin(a)*.07, rh/2 + Math.cos(a)*.07, 0);
    b.applyMatrix4(m); parts.push(b);
  });
  const ridge = new THREE.BoxGeometry(.32, .2, D + .06).toNonIndexed().translate(0, rh + .1, 0);
  colorize(ridge, (x,y,z,r) => jc(color, r, .05).offsetHSL(0, 0, -.12), rng); parts.push(ridge);
  [-1, 1].forEach(side => {
    const sh = new THREE.Shape(); sh.moveTo(-w/2, 0); sh.lineTo(w/2, 0); sh.lineTo(0, rh*(w/2)/W); sh.closePath();
    const gg = new THREE.ShapeGeometry(sh).toNonIndexed();
    if (side < 0) gg.rotateY(Math.PI);
    gg.translate(0, 0, side*(d/2 + .005));
    colorize(gg, (x,y,z,r) => jc(wallColor ?? color, r, .05).offsetHSL(0, 0, wallColor ? -.04 : -.18), rng); parts.push(gg);
  });
  parts.forEach(p => { if (p.attributes.uv) p.deleteAttribute('uv'); });
  const g = mergeGeometries(parts); parts.forEach(p => p.dispose());
  return g;
}
// walls slightly darker at the base (fake ambient occlusion)
GEO.boxGrad = sg((() => { const b = new THREE.BoxGeometry(1,1,1,1,3,1).translate(0,.5,0); const p = b.attributes.position, c = []; for (let i=0;i<p.count;i++){ const v = .74 + .26*Math.pow(p.getY(i), .6); c.push(v, v, v); } b.setAttribute('color', new THREE.Float32BufferAttribute(c, 3)); return b; })());
const WIN_MAT = new THREE.MeshStandardMaterial({ color: 0x2c4a63, roughness: .3, metalness: .1, flatShading: true, emissive: 0xffc070, emissiveIntensity: 0 }); CACHED_MATS.add(WIN_MAT);
const LAMP_MAT = new THREE.MeshStandardMaterial({ color: 0xffe0a0, roughness: .6, emissive: 0xffb54a, emissiveIntensity: .7 }); CACHED_MATS.add(LAMP_MAT);
function foliageMat(color){ return mat(color, { tex: 'leaf', wind: true }); }
const SMOKE_MAT = new THREE.MeshStandardMaterial({ color: 0xe9e6e1, roughness: 1, flatShading: true, transparent: true, opacity: .62, depthWrite: false });
CACHED_MATS.add(SMOKE_MAT);
function smokeSource(sc, x, y, z, anims, scale=1, color){
  const m0 = color ? mat(color, { transparent: true, opacity: .55, depthWrite: false }) : SMOKE_MAT;
  const puffs = [];
  for (let i=0;i<5;i++){ const m = mesh(GEO.blobs[i % 3], m0, x, y, z, .1, .1, .1, false); m.receiveShadow = false; sc.add(m); puffs.push({ m, t: i/5 }); }
  const ph = Math.random()*10;
  anims.push(dt => {
    puffs.forEach(p => {
      p.t += dt*.17; if (p.t > 1) p.t -= 1;
      const k = p.t;
      p.m.position.set(x + Math.sin(k*4 + ph)*.6*k + k*1.6*scale, y + k*6*scale, z + Math.cos(k*3 + ph)*.4*k);
      const s = (.3 + k*1.3)*scale*(k < .15 ? k/.15 : 1)*(k > .8 ? (1 - k)/.2 : 1);
      p.m.scale.set(s, s*.85, s); p.m.rotation.y = k*2;
    });
  });
}
function house(sc, x, z, w, d, h, wall, roof, face, rng=Math.random, o={}){
  const g = new THREE.Group(); g.position.set(x, GH(x,z), z); g.rotation.y = face;
  const wallTex = o.wallTex || (rng() < .75 ? 'plaster' : 'wood'), roofKind = o.roofKind || (rng() < .22 ? 'thatch' : 'tile');
  const timber = o.timber ?? (wallTex === 'plaster' && rng() < .55);
  g.add(mesh(GEO.box, 0x8a8174, 0,-.3,0, w + .3, .5, d + .3));
  g.add(mesh(GEO.boxGrad, mat(wall, { vertexColors: true, tex: wallTex }), 0,0,0, w,h,d));
  const rh = Math.min(w*.55, 2.2)*(roofKind === 'thatch' ? 1.15 : 1);
  const roofMat = roofKind === 'thatch' ? LP_THATCH : LP_ROOF;
  const r = new THREE.Mesh(roofGeo(w + (roofKind === 'thatch' ? .3 : 0), d + (roofKind === 'thatch' ? .2 : 0), rh, roofKind === 'thatch' ? 0xc9a35a : roof, rng, wall), roofMat);
  r.position.y = h; r.castShadow = true; r.receiveShadow = true; g.add(r);
  const beam = 0x5a3b26;
  if (timber){
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz]) => g.add(mesh(GEO.box, beam, sx*(w/2 - .05), 0, sz*(d/2 - .05), .2, h, .2, false)));
    g.add(mesh(GEO.box, beam, 0, h*.52, d/2 + .03, w, .16, .06, false));
    g.add(mesh(GEO.box, beam, 0, h - .1, d/2 + .03, w, .14, .06, false));
    [-1,1].forEach(sx => { const b = mesh(GEO.box, beam, sx*w*.32, h*.52, d/2 + .03, .12, h*.5, .05, false); b.rotation.z = sx*.5; g.add(b); });
  }
  // door with frame and step
  g.add(mesh(GEO.box, 0x4a3020, 0,0,d/2 + .02, 1.1,1.95,.06, false));
  // the leaf hangs on a hinge (left edge) so villagers can open it (doorKick)
  { const door = new THREE.Group(); door.position.set(-.45, 0, d/2 + .05); door.userData = { open: 0, until: 0 };
    door.add(mesh(GEO.box, 0x6b4a2f, .45,0,0, .9,1.8,.06, false));
    door.add(mesh(GEO.sphere, 0xd9b44a, .75, .95, .05, .05, .05, .05, false));
    g.add(door); g.userData.door = door; }
  g.add(mesh(GEO.box, 0x9a948a, 0,-.2,d/2 + .45, 1.4,.32,.7));
  const shut = pick([0x2e6b8a, 0x3f7a45, 0x8a3a2a, 0x5a4a8a, 0x2f2f2f, 0x9a6a2a], rng);
  const win = (lx, ly, lz, rotY) => {
    const wg = new THREE.Group(); wg.position.set(lx, ly, lz); wg.rotation.y = rotY;
    wg.add(mesh(GEO.box, 0xe8e0cc, 0,-.42,0, .86,.86,.05, false));
    wg.add(mesh(GEO.box, WIN_MAT, 0,-.35,.02, .66,.7,.05, false));
    wg.add(mesh(GEO.box, 0xe8e0cc, 0,-.35,.05, .05,.7,.03, false)); wg.add(mesh(GEO.box, 0xe8e0cc, 0,-.03,.05, .66,.05,.03, false));
    [-1,1].forEach(s => wg.add(mesh(GEO.box, shut, s*.55, -.4, .03, .3,.8,.05, false)));
    if (rng() < .55){ wg.add(mesh(GEO.box, 0x7a5232, 0,-.6,.18, .8,.18,.3, false)); [-.25, 0, .25].forEach(q => wg.add(mesh(GEO.sphere, pick(FLOWER_COLORS, rng), q, -.38, .18, .1, .1, .1, false))); }
    g.add(wg);
  };
  if (w > 3.2) [-1,1].forEach(sx => win(sx*w*.3, Math.min(h, 3)*.5 + .45, d/2 + .02, 0));
  [-1,1].forEach(sx => { if (d > 3.6 && rng() < .5){ win(sx*(w/2 + .02), Math.min(h, 3)*.5 + .45, -d*.22, sx*Math.PI/2); win(sx*(w/2 + .02), Math.min(h, 3)*.5 + .45, d*.22, sx*Math.PI/2); } else win(sx*(w/2 + .02), Math.min(h, 3)*.5 + .45, 0, sx*Math.PI/2); });
  if (h > 4){
    [-1,0,1].forEach(q => { if (q === 0 && w < 4.2) return; win(q*w*.3, h*.78 + .45, d/2 + .02, 0); });
    g.add(mesh(GEO.box, beam, 0, h*.56, d/2 + .1, w + .1, .18, .2, false));
    if (o.balcony || rng() < .35){ g.add(mesh(GEO.box, 0x7a5a3a, 0, h*.56, d/2 + .5, w*.6, .12, .9)); for (let k=0;k<7;k++) g.add(mesh(GEO.box, 0x7a5a3a, -w*.3 + k*w*.1, h*.56, d/2 + .92, .06, .55, .06, false)); g.add(mesh(GEO.box, 0x7a5a3a, 0, h*.56 + .55, d/2 + .92, w*.6, .07, .07, false)); }
  }
  if (o.porch || (rng() < .3 && h < 4)){
    [-1,1].forEach(sx => g.add(mesh(GEO.box, 0x6b4a2f, sx*1.15, 0, d/2 + 1.3, .14, 2.3, .14)));
    const pr = mesh(GEO.box, 0x7a5a3a, 0, 2.25, d/2 + .75, 2.7, .1, 1.5); pr.rotation.x = .18; g.add(pr);
    if (rng() < .6){ const bn = mesh(GEO.box, 0x8a6a48, -w*.3 + .2, .4, d/2 + .5, .9, .1, .35); g.add(bn); }
  }
  if (o.sign){
    const sg = new THREE.Group(); sg.position.set(w*.35, 2.5, d/2 + .1); g.add(sg);
    sg.add(mesh(GEO.box, 0x3a3632, 0,0,0, .05,.05,.75, false));
    const board = new THREE.Group(); board.position.set(0, 0, .65); sg.add(board);
    board.add(mesh(GEO.box, 0x8a6a48, 0,-.75,0, .06,.7,.6)); board.add(mesh(o.sign.geo || GEO.sphere, o.sign.color, .05, -.42, 0, .04, .2, .2, false));
    if (CUR_ANIMS){ const ph = rng()*6; CUR_ANIMS.push((dt,t) => { board.rotation.x = Math.sin(t*1.7 + ph)*.08; }); }
  }
  if (o.chimney ?? rng() < .7){
    const cx = w*.25, cz = -d*.15, ch = rh + .8;
    g.add(mesh(GEO.box, 0x7d6e63, cx, h, cz, .55, ch, .55));
    g.add(mesh(GEO.box, 0x5e534b, cx, h + ch, cz, .7, .15, .7));
    if (CUR_ANIMS){ const [wx, wz] = toWorld(x, z, face, cx, cz); smokeSource(sc, wx, g.position.y + h + ch + .2, wz, CUR_ANIMS, .6); }
  }
  sc.add(g); return g;
}
function clouds(sc, anims, rng, cx, cz, spread){
  const cm = mat(0xffffff, { roughness: 1, emissive: 0xfff6ec, emissiveIntensity: .55 });
  for (let i=0;i<14;i++){
    const g = new THREE.Group(); const n = 3 + Math.floor(rng()*3);
    for (let j=0;j<n;j++){ const m = mesh(pick(GEO.blobs, rng), cm, j*4 - n*2, rng()*1.5, rng()*3, 4 + rng()*3, 2.4 + rng()*1.5, 3.5 + rng()*2, false); m.rotation.y = rng()*6; g.add(m); }
    g.position.set(cx + (rng() - .5)*spread, 55 + rng()*25, cz + (rng() - .5)*spread); g.userData.cloud = cm; sc.add(g);
    anims.push(dt => { g.position.x += dt*1.3; });
  }
}
function boat(sc, x, z, angle, anims, baseY){
  const g = new THREE.Group(); g.position.set(x, baseY, z); g.rotation.y = angle;
  g.add(mesh(GEO.box, 0x7a5232, 0,-.3,0, 1.8,1,4.5));
  g.add(mesh(GEO.box, 0xe8e0cc, 0,.65,0, 1.85,.12,4.55));
  g.add(mesh(GEO.cyl, 0x5a3b26, 0,.7,0, .1,5,.1));
  const sh = new THREE.Shape(); sh.moveTo(0,0); sh.lineTo(0,4); sh.lineTo(2.6,0); sh.closePath();
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshStandardMaterial({ color:0xf5f0e4, side:THREE.DoubleSide, roughness:1, flatShading:true }));
  sail.position.set(0, 1.3, 0); sail.rotation.y = Math.PI/2; g.add(sail);
  sc.add(g);
  anims.push((dt,t) => { g.position.y = baseY + Math.sin(t*1.3 + x)*.15; g.rotation.z = Math.sin(t*1.1 + z)*.05; });
}
function stripGeo(pts, width){
  const pos = [], idx = [];
  for (let i=0;i<pts.length;i++){
    const a = pts[Math.max(0, i-1)], b = pts[Math.min(pts.length-1, i+1)];
    let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx,tz) || 1; tx /= l; tz /= l;
    const nx = -tz, nz = tx, p = pts[i];
    pos.push(p.x + nx*width/2, 0, p.z + nz*width/2, p.x - nx*width/2, 0, p.z - nz*width/2);
    if (i < pts.length-1){ const k = i*2; idx.push(k, k+2, k+1, k+1, k+2, k+3); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const ng = g.toNonIndexed(); g.dispose();
  return colorize(ng, (x,y,z,r) => jc(0xb38b5d, r, .1), mulberry32(Math.round(pts[0].x*7 + pts[0].z*13)));
}
const roadMat = () => mat(0xffffff, { side: THREE.DoubleSide, vertexColors: true, tex: 'dirt' });
function flag(sc, x, z, color, anims, h=6){
  const y = GH(x,z);
  sc.add(mesh(GEO.cyl, 0x6b4a2f, x,y,z, .08,h,.08));
  const pivot = new THREE.Group(); pivot.position.set(x, y + h - .7, z);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(2,1.2).translate(1,0,0), new THREE.MeshStandardMaterial({ color, side:THREE.DoubleSide, roughness:.9, flatShading:true }));
  f.castShadow = true; pivot.add(f); sc.add(pivot);
  anims.push((dt,t) => { pivot.rotation.y = Math.sin(t*2.1 + x)*.35; });
  addColl(x, z, .3);
}
// ---- village details
function lantern(sc, x, z){
  const y = GH(x,z);
  sc.add(mesh(GEO.cyl, 0x3a3632, x,y,z, .09, 2.8, .09));
  sc.add(mesh(GEO.box, 0x3a3632, x,y+2.75,z, .4,.08,.4));
  sc.add(mesh(GEO.box, LAMP_MAT, x, y + 2.35, z, .28, .4, .28, false));
  if (CUR_LIGHTS) CUR_LIGHTS.push([x, y + 2.3, z]);
  sc.add(mesh(GEO.cone4, 0x3a3632, x, y + 2.83, z, .3, .25, .3));
  addColl(x, z, .25);
}
function bench(sc, x, z, rot){
  const g = new THREE.Group(); g.position.set(x, GH(x,z), z); g.rotation.y = rot;
  g.add(mesh(GEO.box, 0x8a6a48, 0,.45,0, 1.8,.1,.5)); g.add(mesh(GEO.box, 0x8a6a48, 0,.55,-.22, 1.8,.5,.08));
  if (CUR_POI) CUR_POI.seats.push({ pos: toWorld(x, z, rot, 0, .1), front: toWorld(x, z, rot, 0, .95), rot, occ: null });
  [-.75,.75].forEach(o => g.add(mesh(GEO.box, 0x4a3a2a, o,0,0, .1,.45,.45)));
  sc.add(g); addColl(x, z, .8);
}
function barrel(sc, x, z, rng){
  const y = GH(x,z), c = pick([0x8a5a32, 0x7a4e2c], rng);
  sc.add(mesh(GEO.cyl, c, x,y,z, .4,.95,.4));
  [.15, .8].forEach(o => sc.add(mesh(GEO.cyl, 0x3a3632, x,y+o,z, .42,.06,.42, false)));
  addColl(x, z, .45);
}
function crate(sc, x, z, s, rng){ const m = mesh(GEO.box, pick([0xa0784a, 0x8f6a3e], rng), x, GH(x,z), z, s, s, s); m.rotation.y = rng()*1.5; sc.add(m); addColl(x, z, s*.7); }
function laundry(sc, x1, z1, x2, z2, rng, anims){
  const y1 = GH(x1,z1), y2 = GH(x2,z2);
  sc.add(mesh(GEO.cyl, 0x6b4a2f, x1,y1,z1, .07,2.2,.07)); sc.add(mesh(GEO.cyl, 0x6b4a2f, x2,y2,z2, .07,2.2,.07));
  const L = Math.hypot(x2 - x1, z2 - z1), a = Math.atan2(-(z2 - z1), x2 - x1);
  const rope = mesh(GEO.box, 0xe8e0cc, (x1 + x2)/2, (y1 + y2)/2 + 2.1, (z1 + z2)/2, L, .03, .03, false); rope.rotation.y = a; sc.add(rope);
  const n = Math.max(2, Math.floor(L/1.1));
  for (let i=1;i<n;i++){
    const t = i/n, px = x1 + (x2 - x1)*t, pz = z1 + (z2 - z1)*t, py = y1 + (y2 - y1)*t + 2.08;
    const piv = new THREE.Group(); piv.position.set(px, py, pz); piv.rotation.y = a;
    const cw = .6 + rng()*.3, chh = .7 + rng()*.4;
    const cl = new THREE.Mesh(new THREE.PlaneGeometry(cw, chh).translate(0, -chh/2, 0), mat(pick(CLOTH, rng), { side: THREE.DoubleSide }));
    cl.castShadow = true; piv.add(cl); sc.add(piv);
    const ph = rng()*6; anims.push((dt,tt) => { piv.rotation.x = Math.sin(tt*2 + ph)*.25; });
  }
  addColl(x1, z1, .2); addColl(x2, z2, .2);
}
function garden(sc, x, z, rot, rng){
  if (CUR_POI) CUR_POI.gardens.push({ x, z, ap: toWorld(x, z, rot, 0, 2.5) });
  const g = new THREE.Group(); g.position.set(x, GH(x,z), z); g.rotation.y = rot;
  g.add(mesh(GEO.box, 0x6b4a30, 0,0,0, 3.4,.18,2.4, false));
  for (let row=0; row<3; row++) for (let i=0;i<5;i++){
    const kind = (row + Math.floor(rng()*2)) % 3;
    const px = -1.3 + i*.65, pz = -.75 + row*.75;
    if (kind === 0) g.add(mesh(GEO.blobs[i % 3], 0x5fae48, px, .3, pz, .25, .2, .25, false));
    else if (kind === 1) { g.add(mesh(GEO.blobs[i % 3], 0xe8892a, px, .3, pz, .22, .18, .22, false)); g.add(mesh(GEO.box, 0x4f8f3a, px, .44, pz, .04, .1, .04, false)); }
    else g.add(mesh(GEO.cone7, 0x4c9a3e, px, .18, pz, .12, .45, .12, false));
  }
  for (let i=0;i<10;i++){ const t = i/9; [[-1.85 + t*3.7, -1.35], [-1.85 + t*3.7, 1.35]].forEach(([px,pz]) => g.add(mesh(GEO.box, 0x8a6a48, px, 0, pz, .08, .6, .08, false))); }
  g.add(mesh(GEO.box, 0x8a6a48, 0,.45,-1.35, 3.8,.06,.05, false)); g.add(mesh(GEO.box, 0x8a6a48, 0,.45,1.35, 3.8,.06,.05, false));
  sc.add(g); addColl(x, z, 1.9);
}
function cart(sc, x, z, rot, rng, load){
  const g = new THREE.Group(); g.position.set(x, GH(x,z), z); g.rotation.y = rot;
  g.add(mesh(GEO.box, 0x8a6a48, 0,.6,0, 1.5,.5,2.4));
  [-1,1].forEach(s => { const wh = new THREE.Mesh(new THREE.CylinderGeometry(.55,.55,.12,10).rotateZ(Math.PI/2), mat(0x5a3b26)); wh.position.set(s*.82, .55, 0); wh.castShadow = true; g.add(wh); g.add(mesh(GEO.cyl14, 0x3a2a20, s*.82, .55, 0, .12, .16, .12, false).rotateZ(Math.PI/2)); });
  { const ax = mesh(GEO.cyl, 0x3a2a20, .9, .55, 0, .06, 1.8, .06, false); ax.rotation.z = Math.PI/2; g.add(ax); }
  g.add(mesh(GEO.box, 0x6b4a2f, 0, .55, 2.65, .9, .08, .08));
  [-.4,.4].forEach(s => g.add(mesh(GEO.box, 0x6b4a2f, s, .55, 1.9, .08,.08,1.6)));
  if (load) g.add(mesh(GEO.blobs[1], load, 0, 1.05, 0, .65, .35, 1));
  sc.add(g); addColl(x, z, 1.4); return g;
}
function woodPile(sc, x, z, rot){
  const g = new THREE.Group(); g.position.set(x, GH(x,z), z); g.rotation.y = rot;
  for (let r=0;r<3;r++) for (let i=0;i<3-r;i++){ const l = new THREE.Mesh(GEO.cyl, mat(0x7a5232)); l.scale.set(.22, 1.6, .22); l.rotation.z = Math.PI/2; l.position.set(.8, .22 + r*.4, -.45 + i*.45 + r*.22); l.castShadow = true; g.add(l); }
  sc.add(g); addColl(x, z, .9);
}

