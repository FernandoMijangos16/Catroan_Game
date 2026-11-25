function coatTex(base, dark, seed){
  return pxTex(32, 32, (c) => {
    const B = new THREE.Color(base), D = new THREE.Color(dark);
    for (let y=0;y<32;y++) for (let x=0;x<32;x++){
      const n = hash2(x, y, seed), streak = hash2(x, y >> 2, seed + 1) > .78 ? .9 : 1, shade = 1.08 - (y/32)*.28;
      const col = B.clone().lerp(D, n*.35 + (hash2(x >> 2, y >> 2, seed + 2) > .82 ? .35 : 0)).multiplyScalar(shade*streak);
      c.fillStyle = '#' + col.getHexString(); c.fillRect(x, y, 1, 1);
    }
  });
}
function maneTex(col){ return pxTex(8, 16, c => { const C = new THREE.Color(col); for (let y=0;y<16;y++) for (let x=0;x<8;x++){ const k = (x % 2 ? .82 : 1)*(.9 + hash2(x, y, 31)*.2); c.fillStyle = '#' + C.clone().multiplyScalar(k).getHexString(); c.fillRect(x, y, 1, 1); } }); }
const RIDE_Y = .7;
function horseModel(rng, tackColor){
  const COATS = [[0x9a6a3e, 0x5a3820, 0x1e140e], [0x6e4a2e, 0x3e2818, 0x15100c], [0xc9a46a, 0x8a6a3a, 0xe8dcc0], [0x3a3634, 0x1c1a1a, 0x101010], [0xa86a38, 0x6a3c1c, 0xe8dcc0], [0xb8b4ac, 0x7a7670, 0x4a4644]];
  const [base, dark, maneC] = pick(COATS, rng);
  const coat = keepMat(new THREE.MeshStandardMaterial({ map: coatTex(base, dark, 7 + Math.floor(rng()*50)), roughness: .85, flatShading: true }));
  const coatD = keepMat(new THREE.MeshStandardMaterial({ map: coatTex(dark, 0x000000, 9), roughness: .85, flatShading: true }));
  const hair = keepMat(new THREE.MeshStandardMaterial({ map: maneTex(maneC), roughness: .95, flatShading: true }));
  const hoofM = mat(0x2a2220), sock = rng() < .5 ? mat(0xe8e0d0) : null;
  const g = new THREE.Group(), legs = [];
  const E = (par, m, x, y, z, sx, sy, sz, rx=0, ry=0, rz=0) => { const o = new THREE.Mesh(PGEO.joint, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx, ry, rz); o.castShadow = true; par.add(o); return o; };
  const T = (par, m, r0, r1, len, x, y, z, rx=0, rz=0) => { const o = new THREE.Mesh(sg(new THREE.CylinderGeometry(1, 1, 1, 6).translate(0, -.5, 0)), m); o.scale.set(r0, len, r1); o.position.set(x, y, z); o.rotation.set(rx, 0, rz); o.castShadow = true; par.add(o); return o; };
  const taper = (rTop, rBot, len, segs = 6) => sg(new THREE.CylinderGeometry(rTop, rBot, len, segs).translate(0, -len/2, 0));
  // tail hair: bulges in the middle, tapers to a soft tip, slight curl backwards
  const taperSoft = (r0, r1, len) => { const pts = []; for (let k=0;k<=7;k++){ const u = k/7, r = (r0 + (r1 - r0)*Math.min(1, u*1.6))*(u > .7 ? 1 - (u - .7)/.36 : 1) + .002; pts.push(new THREE.Vector2(Math.max(.004, r), -u*len)); } const gg = new THREE.LatheGeometry(pts.reverse(), 6), pp = gg.attributes.position; for (let i=0;i<pp.count;i++){ const y = -pp.getY(i)/len; pp.setZ(i, pp.getZ(i) - y*y*.12); } gg.computeVertexNormals(); return sg(gg); };
  // torso: barrel, chest, hindquarters, belly, withers
  E(g, coat, 0, 1.22, 0, .34, .37, .78);
  E(g, coat, 0, 1.26, .55, .32, .4, .36);
  E(g, coat, 0, 1.3, -.55, .36, .4, .4);
  E(g, coat, 0, 1.1, -.02, .28, .24, .56);
  E(g, coat, 0, 1.5, .5, .16, .13, .26);
  [-1, 1].forEach(s => { E(g, coat, s*.15, 1.3, -.68, .2, .27, .27); E(g, coat, s*.16, 1.2, .7, .16, .24, .18); });   // haunch and shoulder muscles
  // neck: tapered, leaning forward
  const neck = new THREE.Group(); neck.position.set(0, 1.42, .76); neck.rotation.x = .62; g.add(neck);
  { const n = new THREE.Mesh(taper(.12, .22, .78, 7), coat); n.rotation.x = Math.PI; n.castShadow = true; neck.add(n); }
  E(neck, coat, 0, .3, -.05, .12, .28, .15);
  // mane along the crest
  for (let k=0;k<7;k++){ const m = new THREE.Mesh(GEO.box, hair); m.scale.set(.05, .15 + (k % 2)*.04, .12); m.position.set(0, .06 + k*.1, -.15 + k*.008); m.rotation.x = .2; m.castShadow = true; neck.add(m); }
  // head
  const head = new THREE.Group(); head.position.set(0, .76, -.02); head.rotation.x = .35; neck.add(head);
  E(head, coat, 0, 0, 0, .14, .16, .19);
  { const mz = new THREE.Mesh(taper(.12, .09, .42, 6), coat); mz.rotation.x = -Math.PI/2 + .0; mz.position.set(0, -.04, .08); mz.castShadow = true; head.add(mz); }
  E(head, coatD, 0, -.06, .5, .1, .085, .08);
  [-1, 1].forEach(s => { E(head, mat(0x120c0a), s*.045, -.03, .55, .02, .02, .015); E(head, mat(0x0e0a08), s*.115, .05, .1, .025, .03, .03);
    const ear = new THREE.Mesh(GEO.cone4, coat); ear.scale.set(.045, .14, .03); ear.position.set(s*.07, .13, -.08); ear.rotation.set(-.3, 0, -s*.18); head.add(ear); });
  if (rng() < .5) E(head, mat(0xe8e0d0), 0, .06, .28, .035, .04, .22, -.1);   // blaze
  const forelock = new THREE.Mesh(GEO.box, hair); forelock.scale.set(.08, .12, .05); forelock.position.set(0, .1, .02); forelock.rotation.x = -.5; head.add(forelock);
  // bridle
  const strap = mat(0x2e1c10), metal = itemAssets().m.metal;
  [[0, -.02, .34, .26, .03, .03], [0, .06, .05, .3, .03, .03]].forEach(([x, y, z, sx, sy, sz]) => head.add(mesh(GEO.box, strap, x, y, z, sx, sy, sz)));
  [-1, 1].forEach(s => { head.add(mesh(GEO.box, strap, s*.13, -.06, .2, .02, .03, .32)); head.add(mesh(GEO.sphere, metal, s*.1, -.08, .46, .025, .025, .025)); });
  // legs: shoulder/hip → upper → knee → cannon → fetlock → hoof
  const leg = (x, z, front) => {
    const top = front ? 1.12 : 1.18, p = new THREE.Group(); p.position.set(x, top, z); g.add(p);
    const up = new THREE.Mesh(taper(front ? .1 : .13, .07, front ? .5 : .55, 6), coat); up.castShadow = true; p.add(up);
    if (!front){ up.rotation.x = .25; }
    const k = new THREE.Group(); k.position.set(0, front ? -.5 : -.51, front ? 0 : -.13); p.add(k);
    E(k, coat, 0, 0, 0, .065, .07, .07);
    const can = new THREE.Mesh(taper(.05, .045, .42, 6), sock && rng() < .7 ? sock : coat); can.castShadow = true; if (!front) can.rotation.x = -.25; k.add(can);
    const fz = front ? 0 : .1;
    E(k, sock || coat, 0, -.44, fz, .055, .05, .06);
    const hf = new THREE.Mesh(taper(.06, .075, .1, 7), hoofM); hf.position.set(0, -.48, fz + .02); hf.castShadow = true; k.add(hf);
    const feath = new THREE.Mesh(taper(.07, .08, .05, 7), hair); feath.position.set(0, -.45, fz + .01); k.add(feath);
    p.knee = k; legs.push(p); return p;
  };
  // order: back-left, back-right, front-left, front-right (same as legs4)
  leg(-.2, -.62, false); leg(.2, -.62, false); leg(-.2, .58, true); leg(.2, .58, true);
  // tail
  const tail = new THREE.Group(); tail.position.set(0, 1.5, -.92); g.add(tail);
  { const dock = new THREE.Mesh(taper(.05, .07, .22, 6), coat); dock.rotation.x = Math.PI - .9; tail.add(dock);
    const fall = new THREE.Group(); fall.position.set(0, .1, -.16); tail.add(fall); tail.userData.fall = fall;
    [[0, 0, .055, .1, .72, 0], [-.035, .02, .04, .085, .64, .12], [.035, -.02, .04, .085, .66, -.12], [0, .03, .035, .07, .58, 0]].forEach(([x, z, r0, r1, len, rz]) => { const h = new THREE.Mesh(taperSoft(r0, r1, len), hair); h.position.set(x, 0, z); h.rotation.set(.18, 0, rz); h.castShadow = true; fall.add(h); }); }
  // tack: blanket in the trader's color with trim, saddle with pommel/cantle, girth, stirrups, saddle bags
  const tc = new THREE.Color(tackColor), trimC = tc.clone().multiplyScalar(.55).getHex();
  g.add(mesh(PGEO.rbox, tackColor, 0, 1.6, -.05, .84, .05, .72)); g.add(mesh(PGEO.rbox, trimC, 0, 1.585, -.05, .87, .03, .75));
  g.add(mesh(PGEO.rbox, 0x5a3820, 0, 1.66, -.05, .44, .1, .52));
  g.add(mesh(PGEO.rbox, 0x4a2c18, 0, 1.73, .2, .26, .1, .1)); g.add(mesh(PGEO.rbox, 0x4a2c18, 0, 1.74, -.3, .36, .12, .08));
  g.add(mesh(GEO.box, 0x3a2414, 0, .82, .1, .82, .06, .1));
  [-1, 1].forEach(s => { const st = new THREE.Group(); st.position.set(s*.44, 1.6, .02); g.add(st); st.add(mesh(GEO.box, 0x3a2414, 0, -.42, 0, .02, .42, .04)); st.add(mesh(GEO.box, metal, 0, -.46, 0, .02, .04, .12)); st.add(mesh(PGEO.rbox, 0x6a4628, s*.06, -.15, -.48, .14, .28, .3)); });
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, legs, head, neck, tail, kindName: 'caballo' };
}
function riderModel(color, rng){
  const horse = horseModel(rng, color), g = new THREE.Group(); g.add(horse.g);
  const rider = makePerson(rng, 'comerciante', 'm', color);
  rider.g.position.set(0, RIDE_Y, -.08); g.add(rider.g);
  rider.legL.rotation.set(-.6, 0, -.55); rider.legR.rotation.set(-.6, 0, .55); rider.kneeL.rotation.x = rider.kneeR.rotation.x = 1.15;
  const cape = mesh(GEO.box, color, 0, .62, -.16, .38, .8, .03); cape.rotation.x = .12; rider.body.add(cape);
  const strap = mesh(GEO.box, 0x6a4a2a, 0, .95, 0, .05, .62, .27); strap.rotation.z = .65; rider.body.add(strap);
  const bag = mesh(PGEO.rbox, 0x7a5432, .2, .92, -.02, .12, .14, .06); rider.body.add(bag);
  const hand = new THREE.Group(); hand.position.set(0, -.36, .04); rider.elbowR.add(hand);
  return { g, horse, rider, hand };
}
function gallop(R, ph, amp){
  const s = Math.sin(ph)*amp;
  R.horse.legs.forEach((l, i) => { const sg = (i % 2 === 0 ? 1 : -1)*(i < 2 ? 1 : -1); l.rotation.x = s*sg; if (l.knee) l.knee.rotation.x = Math.max(0, Math.cos(ph)*sg)*1.2*amp; });
  R.horse.g.position.y = Math.abs(Math.cos(ph))*.11*amp; R.rider.g.position.y = RIDE_Y + Math.abs(Math.cos(ph))*.11*amp + Math.abs(Math.sin(ph))*.05*amp; R.rider.body.rotation.x = .08*amp;
  if (R.horse.head) R.horse.head.rotation.x = Math.sin(ph)*.15*amp; if (R.horse.tail){ R.horse.tail.rotation.x = amp*.55 + Math.sin(ph*.5)*.05; const f = R.horse.tail.userData.fall; if (f) f.children.forEach((h, k) => { h.rotation.z = (k ? (k === 1 ? .12 : -.12) : 0) + Math.sin(ph*.7 + k)*.06; h.rotation.x = .18 + amp*.25 + Math.sin(ph + k)*.05; }); }
}
