function amuletModel(k){
  const g = new THREE.Group(), cord = mat(0x3a2414), bronze = keepMat(new THREE.MeshStandardMaterial({ color: 0xb08a3a, metalness: .6, roughness: .4, flatShading: true })), gold = keepMat(new THREE.MeshStandardMaterial({ color: 0xe0b040, metalness: .7, roughness: .3, flatShading: true }));
  const base = { escudo: mat(0x7a5232), trebol: keepMat(new THREE.MeshStandardMaterial({ color: 0x3a6a4a, roughness: .5, flatShading: true })), ojo: keepMat(new THREE.MeshStandardMaterial({ color: 0x4a3a6a, roughness: .5, flatShading: true })) }[k] || bronze;
  const loop = new THREE.Mesh(sg(new THREE.TorusGeometry(.16, .025, 4, 10)), cord); loop.position.y = .42; g.add(loop);
  g.add(mesh(GEO.sphere, gold, 0, .3, 0, .05, .05, .05));
  const disc = mesh(GEO.cyl14, base, 0, 0, -.04, .3, .08, .3); disc.rotation.x = Math.PI/2; disc.position.set(0, 0, -.04); g.add(disc);
  const rim = new THREE.Mesh(sg(new THREE.TorusGeometry(.3, .035, 4, 14)), gold); g.add(rim);
  const S = new THREE.Group(); S.position.z = .05; g.add(S);
  const add = (geo, c, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => { const m = mesh(geo, c, x, y, z, sx, sy, sz); m.rotation.set(rx, ry, rz); S.add(m); return m; };
  switch (k){
    case 'ojo': add(GEO.sphere, 0xf2ece0, 0, 0, 0, .19, .11, .05); add(GEO.sphere, 0x6a3aa8, 0, 0, .03, .08, .08, .03); add(GEO.sphere, 0x0a0806, 0, 0, .05, .035, .035, .02); break;
    case 'plaga': add(GEO.cyl, 0x8a7a3a, 0, -.2, 0, .015, .38, .015); [[0, .14], [-.05, .08], [.05, .08], [-.05, .02], [.05, .02]].forEach(([x, y], i) => add(GEO.sphere, i % 2 ? 0x5a4a1a : 0x2a2414, x, y, .01, .035, .05, .03)); break;
    case 'incendio': [[0, -.12, .12, .3, 0xd84a1a], [-.08, -.12, .07, .2, 0xf0902a], [.08, -.12, .07, .22, 0xf0902a], [0, -.1, .05, .16, 0xffe070]].forEach(([x, y, r, h, c]) => add(GEO.cone6, keepMat(new THREE.MeshBasicMaterial({ color: c })), x, y, .01, r, h, .04)); break;
    case 'derrumbe': [[-.08, -.1, .1], [.08, -.08, .08], [0, .06, .09]].forEach(([x, y, r], i) => add(GEO.rocks[i], 0x7a7f88, x, y, 0, r, r, .05)); add(GEO.box, 0x1a1410, -.02, .02, .04, .2, .015, .01, 0, 0, .7); break;
    case 'inundacion': add(GEO.sphere, 0x3a8ac8, 0, -.06, 0, .12, .12, .05); add(GEO.cone7, 0x3a8ac8, 0, .02, 0, .085, .16, .04); add(GEO.sphere, 0xbfe6ff, -.04, -.08, .04, .025, .03, .01); break;
    case 'enfermedad': add(GEO.sphere, 0xe8e4d4, 0, .02, 0, .15, .13, .05); add(GEO.box, 0xe8e4d4, 0, -.14, 0, .1, .1, .05); [-1, 1].forEach(s => add(GEO.sphere, 0x2a1a10, s*.06, .03, .04, .035, .04, .01)); add(GEO.sphere, 0x6a9a3a, .12, .12, .03, .04, .04, .02); break;
    case 'demolicion': add(GEO.box, 0x8a6a40, 0, -.22, 0, .04, .34, .03, 0, 0, .5); add(GEO.box, 0x8a9098, .06, .06, .01, .2, .08, .05, 0, 0, .5); break;
    case 'escudo': add(GEO.cyl14, 0x9a6a3a, 0, 0, 0, .2, .03, .2, Math.PI/2); add(GEO.sphere, 0x5a9a3a, 0, .02, .03, .09, .05, .02); add(GEO.box, 0x3a5a2a, 0, -.08, .03, .01, .1, .01); break;
    case 'trebol': [[0, .08], [0, -.08], [.08, 0], [-.08, 0]].forEach(([x, y]) => add(GEO.sphere, 0x4aa84a, x, y + .02, 0, .075, .075, .03)); add(GEO.box, 0x2a7a2a, .02, -.2, 0, .015, .12, .01, 0, 0, .3); break;
    case 'pluma': { const q = quill3D(); q.scale.setScalar(.3); q.position.set(0, -.16, .01); q.rotation.z = -.5; S.add(q); break; }
  }
  return outlineItem(g);
}
// ---------- state helpers ----------
