// ================= TROPHIES: largest army and longest road, standing beside the dice button =================
function trophyMat(dark){
  const key = 'troph2' + (dark ? 'd' : ''); if (RUST.has(key)) return RUST.get(key);
  if (dark){ const m = plankMat(3, 0x5e3c22); RUST.set(key, m); return m; }
  // bright, slightly worn gold: same pixel-noise recipe as the other models, with a few highlights
  const B = new THREE.Color(0xe6b04a), t = pxTex(16, 16, c => { for (let y=0;y<16;y++) for (let x=0;x<16;x++){ const n = hash2(x, y, 23); let k = .86 + n*.26; if (n > .93) k = 1.32; if (hash2(x >> 1, y >> 1, 41) > .9) k *= .8; c.fillStyle = '#' + B.clone().multiplyScalar(k).getHexString(); c.fillRect(x, y, 1, 1); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; const m = keepMat(new THREE.MeshStandardMaterial({ map: t, metalness: .55, roughness: .38, flatShading: true, emissive: 0x3a2408, emissiveIntensity: .35 })); RUST.set(key, m); return m;
}
function trophyModel(kind){
  const g = new THREE.Group(), gold = trophyMat(), base = trophyMat(true);
  g.add(mesh(GEO.box, base, 0, 0, 0, .7, .22, .5)); g.add(mesh(GEO.box, gold, 0, .07, .255, .42, .1, .01)); g.add(mesh(GEO.box, base, 0, .22, 0, .5, .08, .36));
  if (kind === 'army'){
    // a shield with two crossed swords behind it
    [-1, 1].forEach(sd => { const sw = new THREE.Group(); sw.position.set(0, .62, -.04); sw.rotation.z = sd*.62; g.add(sw);
      sw.add(mesh(GEO.box, gold, 0, -.02, 0, .07, .78, .03)); sw.add(mesh(GEO.cone4, gold, 0, .76, 0, .05, .12, .02)); sw.add(mesh(GEO.box, base, 0, -.12, 0, .26, .05, .06)); sw.add(mesh(GEO.box, base, 0, -.3, 0, .05, .18, .05)); });
    const sh = new THREE.Mesh(sg(new THREE.CylinderGeometry(.27, .27, .07, 8)), gold); sh.rotation.x = Math.PI/2; sh.scale.set(1, 1, 1.25); sh.position.set(0, .66, .06); g.add(sh);
    g.add(mesh(GEO.box, base, 0, .5, .11, .05, .34, .02)); g.add(mesh(GEO.box, base, 0, .64, .11, .3, .05, .02));
  } else {
    // a winding road climbing a little hill up to a milestone
    const hill = new THREE.Mesh(sg(new THREE.CylinderGeometry(.12, .3, .34, 8)), gold); hill.position.y = .43; g.add(hill);
    for (let i=0;i<5;i++){ const a = i*1.25, r = .27 - i*.035, seg = mesh(GEO.box, base, Math.cos(a)*r, .27 + i*.075, Math.sin(a)*r, .16, .03, .09); seg.rotation.y = -a; g.add(seg); }
    g.add(mesh(GEO.box, gold, 0, .6, 0, .1, .3, .08)); const cap = new THREE.Mesh(sg(new THREE.CylinderGeometry(.05, .05, .08, 8, 1, false, 0, Math.PI)), gold); cap.rotation.z = Math.PI/2; cap.rotation.y = Math.PI/2; cap.position.y = .9; g.add(cap);
    g.add(mesh(GEO.box, base, 0, .78, .045, .06, .02, .01));
  }
  return g;
}
