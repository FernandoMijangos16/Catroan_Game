// ================= NÁNDOR: the tutorial guide's head (Fernando's features in the villagers' style) =================
// Same build as makePerson's head (neck, rounded box with a 16×16 painted face on material 4, small ears, hair on top),
// with his own traits: dark brown curls with a fringe and short faded sides, thick straight brows, grey-blue eyes under
// heavy lids, a marked nose, full pink lips, a thin moustache, a sparse beard along the jaw and his glasses.
// Every expression the villagers have works here too (sonrisa, serio, risa, cansado, duda, triste, sorpresa, guiño, enojo).
const NANDOR = {
  skin: 0xe0b49a, hair: 0x3a2417, hairHi: 0x55361f, hairDk: 0x24160e, brow: 0x2c1b11,
  stub: 0x8a6a4c, eye: 0x6a7f88, lipUp: 0xc0706a, lipLo: 0xd58c86,
  rim: 0x26305a, metal: 0xc9a85a,   // glasses: thin navy hexagonal rims, gold bridge and arms
};
const NANDOR_RIM = sg(new THREE.TorusGeometry(1, .12, 3, 6));
const NANDOR_FACES = new Map();
function nandorFaceMat(expr = 'sonrisa'){
  if (NANDOR_FACES.has(expr)) return NANDOR_FACES.get(expr);
  const N = NANDOR, cv = document.createElement('canvas'); cv.width = cv.height = 16; const c = cv.getContext('2d');
  const hx = n => '#' + new THREE.Color(n).getHexString(), mix = (a, b, t) => hx(new THREE.Color(a).lerp(new THREE.Color(b), t).getHex());
  const P = (x, y, col, w = 1, h = 1) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const sk = new THREE.Color(N.skin), dk = hx(sk.clone().multiplyScalar(.82).getHex()), dk2 = hx(sk.clone().multiplyScalar(.72).getHex());
  const lid = hx(sk.clone().multiplyScalar(.7).getHex()), hr = hx(N.hair), hi = hx(N.hairHi), hd = hx(N.hairDk), br = hx(N.brow);
  const st = hx(N.stub), stL = mix(N.stub, N.skin, .55), eye = hx(N.eye), lu = hx(N.lipUp), ll = hx(N.lipLo), ink = '#2a1d18';
  P(0, 0, hx(N.skin), 16, 16);
  // ---- curly fringe falling on the forehead, short dark sideburns (the fade)
  P(0, 0, hr, 16, 3); [2, 6, 9, 13].forEach(x => P(x, 0, hi)); [4, 11].forEach(x => P(x, 1, hi)); [1, 8, 14].forEach(x => P(x, 2, hd));
  [2, 3, 6, 7, 9, 12, 13].forEach(x => P(x, 3, hr)); [3, 12].forEach(x => P(x, 3, hi)); P(7, 4, hr);   // curl tips
  P(0, 3, hd, 1, 6); P(15, 3, hd, 1, 6); P(1, 3, hd, 1, 2); P(14, 3, hd, 1, 2);
  // ---- brows: thick and straight; they carry the mood
  switch (expr){
    case 'enojo': P(3, 4, br); P(4, 5, br, 2); P(6, 6, br); P(12, 4, br); P(10, 5, br, 2); P(9, 6, br); break;
    case 'serio': P(3, 5, br, 3); P(4, 4, br, 2); P(10, 5, br, 3); P(10, 4, br, 2); P(6, 5, br); P(9, 5, br); break;
    case 'sorpresa': P(3, 4, br, 3); P(10, 4, br, 3); break;
    case 'duda': P(3, 4, br, 3); P(4, 3, br, 2); P(10, 5, br, 3); break;
    case 'triste': P(3, 5, br); P(4, 4, br, 2); P(5, 3, br); P(10, 3, br); P(10, 4, br, 2); P(12, 5, br); break;
    default: P(3, 5, br, 3); P(4, 4, br, 2); P(10, 5, br, 3); P(10, 4, br, 2);
  }
  // ---- eyes: grey-blue under heavy lids (his look); wide open only when surprised
  const eyeAt = (x, how) => {
    const iris = x === 4 ? 5 : 10;
    if (how === 'closed'){ P(x, 7, ink, 2, 1); return; }
    if (how === 'happy'){ P(x, 6, lid, 2, 1); P(x, 7, ink, 2, 1); return; }                   // squeezed shut by the laugh
    if (how === 'open'){ P(x, 6, '#ffffff', 2, 2); P(iris, 6, eye, 1, 2); return; }
    P(x, 6, lid, 2, 1); P(x, 7, '#ffffff', 2, 1); P(iris, 7, eye);
    if (how === 'low'){ P(x, 7, lid, 2, 1); P(iris, 7, eye); }                           // tired: lids nearly down
  };
  const L = expr === 'sorpresa' ? 'open' : expr === 'risa' ? 'happy' : expr === 'cansado' ? 'low' : 'lid';
  eyeAt(4, L); eyeAt(10, expr === 'guiño' ? 'closed' : L);
  if (expr === 'cansado' || expr === 'triste'){ P(4, 8, dk, 2, 1); P(10, 8, dk, 2, 1); }
  // ---- a marked nose: bridge, wide tip and nostrils
  P(7, 7, dk); P(7, 8, dk, 2, 1); P(6, 9, dk, 4, 1); P(6, 9, dk2); P(9, 9, dk2);
  // ---- sparse beard along the jaw and on the chin (stubble: dark and skin-mixed pixels)
  [[0, 9], [0, 10], [0, 11], [0, 12], [1, 12], [1, 13], [2, 14], [3, 14], [3, 15], [4, 15], [5, 15],
   [15, 9], [15, 10], [15, 11], [15, 12], [14, 12], [14, 13], [13, 14], [12, 14], [12, 15], [11, 15], [10, 15]].forEach(([x, y], i) => P(x, y, i % 3 ? stL : st));
  [[6, 14], [9, 14], [7, 15], [8, 15], [6, 15], [9, 15], [7, 14], [8, 14]].forEach(([x, y], i) => P(x, y, i < 4 ? stL : st));
  // ---- thin moustache over the lip corners
  P(5, 10, st); P(6, 10, stL, 4, 1); P(10, 10, st);
  // ---- full lips: pink upper and a fuller, lighter lower one
  switch (expr){
    case 'risa': P(5, 11, lu, 6, 2); P(6, 11, '#f4efe4', 4, 1); P(6, 12, '#3a1410', 4, 1); P(6, 13, ll, 4, 1); break;
    case 'sorpresa': P(7, 11, '#3a1410', 2, 2); P(6, 11, lu); P(9, 11, lu); P(7, 13, ll, 2, 1); break;
    case 'triste': P(6, 11, lu, 4, 1); P(5, 12, lu); P(10, 12, lu); P(6, 12, ll, 4, 1); break;
    case 'enojo': P(5, 11, lu, 6, 1); P(6, 12, ll, 4, 1); P(5, 12, dk2); P(10, 12, dk2); break;
    case 'serio': case 'cansado': P(6, 11, lu, 4, 1); P(6, 12, ll, 4, 1); break;
    case 'duda': P(6, 11, lu, 4, 1); P(6, 12, ll, 3, 1); P(10, 11, lu); break;
    case 'guiño': P(6, 11, lu, 4, 1); P(10, 10, lu); P(6, 12, ll, 4, 1); break;
    default: P(6, 11, lu, 4, 1); P(5, 10, lu); P(10, 10, lu); P(6, 12, ll, 4, 1);   // sonrisa: corners up
  }
  const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: .85 }); CACHED_MATS.add(m);
  NANDOR_FACES.set(expr, m); return m;
}
// Returns { head, face }: `head` is a group laid out like makePerson's head (neck at y 0); `face` works with setFaceExpr.
function nandorHead(expr = 'sonrisa', { glasses = true } = {}){
  const N = NANDOR, head = new THREE.Group();
  const add = (geo, c, x, y, z, sx, sy, sz) => { const m = mesh(geo, c, x, y, z, sx, sy, sz, true); head.add(m); return m; };
  add(PGEO.crown, N.skin, 0, 0, 0, .05, .14, .05);                                                   // neck
  const sm = mat(N.skin), hd = new THREE.Mesh(PGEO.rbox, [sm, sm, sm, sm, nandorFaceMat(expr), sm]);
  hd.position.set(0, .26, 0); hd.scale.set(.245, .29, .25); hd.castShadow = true; head.add(hd);          // a touch wider: round cheeks
  [-1, 1].forEach(s => add(PGEO.joint, N.skin, s*.127, .25, -.01, .026, .046, .03));                     // ears
  const T = .405;
  // short faded sides and nape, then the curly crown on top
  [-1, 1].forEach(s => add(PGEO.rbox, N.hairDk, s*.113, .31, -.04, .03, .12, .21));
  add(PGEO.rbox, N.hairDk, 0, .29, -.12, .225, .17, .035);
  add(PGEO.rbox, N.hair, 0, T - .01, -.015, .262, .135, .27);
  // curls: fixed spots (always the same head), three browns so the volume reads
  const C = [N.hair, N.hairHi, N.hairDk];
  [[-.085, .03, -.07, .05], [0, .035, -.08, .052], [.085, .03, -.07, .05], [-.09, .035, .01, .05], [-.005, .045, 0, .055],
   [.08, .04, .015, .05], [-.05, .035, .07, .048], [.045, .04, .07, .048], [-.105, .01, .085, .04], [.105, .015, .08, .04],
   [0, .01, -.13, .048], [-.11, -.01, -.1, .04], [.11, -.01, -.1, .04]].forEach(([x, y, z, r], i) =>
    add(PGEO.joint, C[i % 3], x, T + y, z, r, r*.75, r));
  // the fringe: curls hanging over the forehead
  [[-.08, -.025, .12, .034], [-.03, -.04, .128, .036], [.025, -.035, .128, .034], [.08, -.025, .118, .032]].forEach(([x, y, z, r], i) =>
    add(PGEO.joint, C[(i + 1) % 3], x, T + y, z, r, r, r*.8));
  // glasses in 3D, in front of the face, so every expression shows through them
  if (glasses){
    const EY = .277, EZ = .146, EX = .047, R = .036;
    [-1, 1].forEach(s => {
      const ring = add(NANDOR_RIM, N.rim, s*EX, EY, EZ, R, R, R*1.4);
      ring.rotation.y = s*.12;                                                                 // follows the round face
      const hinge = add(GEO.box, N.metal, s*.097, EY + .004, EZ - .02, .042, .006, .006);          // bends back from the rim...
      hinge.rotation.y = s*.78;
      add(GEO.box, N.metal, s*.117, EY + .002, EZ - .1, .005, .007, .15);                     // ...and runs along the head to the ear
    });
    add(GEO.box, N.metal, 0, EY + .012, EZ + .004, .024, .006, .006);                          // bridge
  }
  return { head, face: { mesh: hd, expr, make: nandorFaceMat, skin: N.skin, hair: N.hair, f: false, kid: false, old: false, beard: true, must: true, eye: N.eye } };
}
// Puts Nándor's head on a person made with makePerson (e.g. the tutorial guide). Whatever was on the old head
// (hair, hat) goes away; the body, animations and setFaceExpr keep working.
function useNandorHead(p, expr = 'sonrisa'){
  const N = nandorHead(expr);
  p.head.clear(); N.head.children.slice().forEach(c => p.head.add(c));
  p.face = N.face; p.name = 'Nándor';
  return p;
}
