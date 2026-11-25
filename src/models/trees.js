// ================= BIG TREES (instanced templates, connected trunks/branches/crowns) =================
function treePart(geo, mtx, color, r, out, amt=.1){
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  g.applyMatrix4(mtx);
  if (g.attributes.uv) g.deleteAttribute('uv');
  colorize(g, (x,y,z,rr) => jc(Array.isArray(color) ? color[Math.floor(rr*color.length) % color.length] : color, r(), amt), r);
  out.push(g);
}
const M4 = (x=0, y=0, z=0, rx=0, ry=0, rz=0, sx=1, sy=1, sz=1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(sx, sy, sz));
function branchTip(len, rz, ry, y0){ const v = new THREE.Vector3(0, len, 0).applyEuler(new THREE.Euler(0, ry, rz, 'YXZ')); return [v.x, v.y + y0, v.z]; }
const BARK = 0x6b4a2f, BIRCH = 0xe6e0d2;
function makeTreeTemplate(kind, seed){
  const r = mulberry32(seed*131 + kind.length*977), trunk = [], fol = [];
  const blob = () => jitterGeo(new THREE.IcosahedronGeometry(1, 1), .28, Math.floor(r()*1000));
  const cyl = (rt, rb, h, seg=7) => new THREE.CylinderGeometry(rt, rb, h, seg).translate(0, h/2, 0);
  switch (kind){
    case 'roble': {
      const H = 4.2 + r()*1.2;
      treePart(cyl(.3, .48, H), M4(), BARK, r, trunk);
      treePart(cyl(.48, .8, .6), M4(), BARK, r, trunk);
      const greens = [0x3f7a35, 0x4a8a3a, 0x356b2e, 0x5a9a40, 0x447f36];
      const tips = [];
      const nb = 4 + Math.floor(r()*2);
      for (let i=0;i<nb;i++){
        const ry = i/nb*Math.PI*2 + r()*.6, rz = .55 + r()*.45, len = 2.2 + r()*1.2, y0 = H*.7 + r()*.8;
        treePart(cyl(.1, .2, len, 5), M4(0, y0, 0, 0, ry, rz), BARK, r, trunk);
        tips.push(branchTip(len, rz, ry, y0));
      }
      tips.forEach(([x, y, z]) => { const s = 1.5 + r()*.7; treePart(blob(), M4(x, y + .4, z, 0, r()*6, 0, s, s*.82, s), greens, r, fol); });
      for (let i=0;i<4;i++){ const a = r()*6.28, d = r()*1.4, s = 1.7 + r()*.6; treePart(blob(), M4(Math.cos(a)*d, H + 1.8 + r()*1.4, Math.sin(a)*d, 0, r()*6, 0, s, s*.85, s), greens, r, fol); }
      return { trunk, fol, h: H + 4 };
    }
    case 'abeto': {
      const H = 10 + r()*3;
      treePart(cyl(.1, .34, H, 6), M4(), BARK, r, trunk);
      const greens = [0x2a5a32, 0x2f6638, 0x24502c, 0x31683a];
      const n = 7;
      for (let i=0;i<n;i++){
        const t = i/(n - 1), R = 2.7*(1 - t*.82), h = 3.1 - t*1.3, y = 1.6 + t*(H - 3);
        treePart(jitterGeo(new THREE.ConeGeometry(R, h, 9).translate(0, h/2, 0), .18, Math.floor(r()*999)), M4(0, y, 0, 0, r()*6), greens, r, fol);
      }
      return { trunk, fol, h: H + 1 };
    }
    case 'pino': {
      const H = 7 + r()*2;
      treePart(cyl(.16, .32, H, 6), M4(), 0x7a5232, r, trunk);
      const greens = [0x3f7a40, 0x356b38, 0x467f44];
      [[H - 2.6, 2.4, 2.6], [H - 1.4, 1.8, 2.2], [H - .3, 1.15, 1.8]].forEach(([y, R, h], i) => treePart(jitterGeo(new THREE.ConeGeometry(R, h, 8).translate(0, h/2, 0), .2, Math.floor(r()*999)), M4(0, y, 0, 0, r()*6), greens, r, fol));
      for (let i=0;i<3;i++){ const ry = r()*6.28, rz = .9, len = 1.4, y0 = H - 3.4 + i*.4; treePart(cyl(.05, .1, len, 4), M4(0, y0, 0, 0, ry, rz), 0x7a5232, r, trunk); }
      return { trunk, fol, h: H + 1.6 };
    }
    case 'abedul': {
      const H = 6 + r()*2;
      treePart(cyl(.12, .22, H, 6), M4(), BIRCH, r, trunk, .04);
      const greens = [0x8fb64a, 0x9ec455, 0x7da843, 0xa8c85a];
      const tips = [];
      for (let i=0;i<3;i++){ const ry = r()*6.28, rz = .45 + r()*.3, len = 1.6 + r()*.6, y0 = H*.6 + i*.5; treePart(cyl(.05, .1, len, 5), M4(0, y0, 0, 0, ry, rz), BIRCH, r, trunk, .04); tips.push(branchTip(len, rz, ry, y0)); }
      tips.forEach(([x, y, z]) => { const s = .9 + r()*.4; treePart(blob(), M4(x, y + .3, z, 0, r()*6, 0, s, s*1.35, s), greens, r, fol); });
      for (let i=0;i<3;i++){ const s = 1 + r()*.3; treePart(blob(), M4((r() - .5)*1.2, H + .3 + i*.9, (r() - .5)*1.2, 0, r()*6, 0, s, s*1.4, s), greens, r, fol); }
      return { trunk, fol, h: H + 3 };
    }
    case 'mangle': {
      const H = 2.2 + r()*.7, RC = 0x9a8670, greens = [0x2f5a2c, 0x3a6a32, 0x2a4f28, 0x44743a];
      const nr = 7 + Math.floor(r()*3);
      for (let i=0;i<nr;i++){
        const a = i/nr*6.28 + r()*.4, R = 1.1 + r()*.7, y0 = .9 + r()*.5;
        const cv = new THREE.QuadraticBezierCurve3(new THREE.Vector3(Math.cos(a)*.12, y0, Math.sin(a)*.12), new THREE.Vector3(Math.cos(a)*R*.75, y0 + .45, Math.sin(a)*R*.75), new THREE.Vector3(Math.cos(a)*R, -.3, Math.sin(a)*R));
        treePart(new THREE.TubeGeometry(cv, 6, .085, 4), M4(), RC, r, trunk);
      }
      treePart(cyl(.11, .19, H), M4(0, .8, 0), RC, r, trunk);
      const tips = [];
      for (let i=0;i<3;i++){ const ry = i*2.1 + r()*.5, rz = .7 + r()*.3, len = 1 + r()*.4, y0 = .8 + H*.75; treePart(cyl(.05, .09, len, 5), M4(0, y0, 0, 0, ry, rz), RC, r, trunk); tips.push(branchTip(len, rz, ry, y0)); }
      tips.forEach(([x, y, z]) => { const s = 1 + r()*.35; treePart(blob(), M4(x, y + .2, z, 0, r()*6, 0, s*1.2, s*.6, s*1.2), greens, r, fol); });
      for (let i=0;i<2;i++){ const s = 1.1 + r()*.3; treePart(blob(), M4((r() - .5)*.6, .8 + H + .3 + i*.3, (r() - .5)*.6, 0, r()*6, 0, s*1.3, s*.6, s*1.3), greens, r, fol); }
      return { trunk, fol, h: H + 2 };
    }
    case 'palma': {
      const H = 5 + r()*1.5, seg = 7, lean = .05 + r()*.05; let px = 0, py = 0;
      for (let i=0;i<seg;i++){ const h = H/seg, rz = i*lean, rt = .17 - i*.008; treePart(cyl(rt, rt + .03, h + .05, 7), M4(px, py, 0, 0, 0, -rz), i % 2 ? 0x8a7258 : 0x7a644c, r, trunk, .05); px += Math.sin(rz)*h; py += Math.cos(rz)*h; }
      const greens = [0x4a8a3a, 0x3f7a32, 0x5a9a44];
      const leaf = new THREE.BoxGeometry(.5, 1.5, .06).translate(0, .75, 0), leaf2 = new THREE.BoxGeometry(.38, 1.3, .05).translate(0, .65, 0);
      for (let i=0;i<8;i++){
        const ry = i/8*6.28 + r()*.3, rz = 1.05 + r()*.25, [tx, ty, tz] = branchTip(1.5, rz, ry, py);
        treePart(leaf, M4(px, py, 0, 0, ry, rz), greens, r, fol);
        treePart(leaf2, M4(px + tx, ty, tz, 0, ry, rz + .7), greens, r, fol);
      }
      for (let i=0;i<3;i++){ const a = i*2.1; treePart(new THREE.IcosahedronGeometry(.17, 0), M4(px + Math.cos(a)*.2, py - .15, Math.sin(a)*.2), 0x6a4a2a, r, trunk); }
      return { trunk, fol, h: H + 1.5 };
    }
    case 'alamo': {
      const H = 3.4;
      treePart(cyl(.2, .34, H + 1, 6), M4(), BARK, r, trunk);
      const greens = [0x4f8a3a, 0x5c9a40, 0x47803a];
      const n = 5;
      for (let i=0;i<n;i++){ const t = i/(n - 1), s = 1.35 - t*.55; treePart(blob(), M4((r() - .5)*.4, H + .8 + t*6.6, (r() - .5)*.4, 0, r()*6, 0, s, s*1.6, s), greens, r, fol); }
      return { trunk, fol, h: H + 9 };
    }
  }
}
const TREE_TPL = {};
function treeTpl(kind, v){
  const key = kind + v;
  if (!TREE_TPL[key]){
    const t = makeTreeTemplate(kind, v + 1);
    TREE_TPL[key] = { trunk: sg(mergeGeometries(t.trunk)), fol: sg(mergeGeometries(t.fol)), h: t.h };
    t.trunk.concat(t.fol).forEach(g => g.dispose());
  }
  return TREE_TPL[key];
}
const TRUNK_MAT = (() => { const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }); texturize(m, 'bark'); CACHED_MATS.add(m); return m; })();
const FOL_MATS = {};
function folMat(amp){ if (!FOL_MATS[amp]){ const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: .9 }); texturize(m, 'leaf', undefined, amp); CACHED_MATS.add(m); FOL_MATS[amp] = m; } return FOL_MATS[amp]; }
class TreeBatch {
  constructor(amp = .012){ this.amp = amp; this.items = {}; }
  add(kind, x, y, z, s, ry, tint = 0xffffff){ const v = Math.floor(Math.random()*3); (this.items[kind + '|' + v] ||= []).push([x, y, z, s, ry, tint]); }
  build(sc){
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s3 = new THREE.Vector3(), c = new THREE.Color();
    for (const [key, arr] of Object.entries(this.items)){
      const [kind, v] = key.split('|'), tpl = treeTpl(kind, +v);
      const tr = new THREE.InstancedMesh(tpl.trunk, TRUNK_MAT, arr.length), fo = new THREE.InstancedMesh(tpl.fol, folMat(this.amp), arr.length);
      arr.forEach((a, i) => { e.set(0, a[4], 0); q.setFromEuler(e); m4.compose(p.set(a[0], a[1], a[2]), q, s3.set(a[3], a[3]*(.92 + (i % 5)*.04), a[3])); tr.setMatrixAt(i, m4); fo.setMatrixAt(i, m4); fo.setColorAt(i, c.setHex(a[5])); });
      [tr, fo].forEach(im => { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; im.castShadow = true; im.receiveShadow = true; im.computeBoundingSphere(); sc.add(im); });
    }
  }
}
let CUR_TREES = null;
function treeKindFor(biome, rng){
  switch (biome){
    case 'bosque': return weighted([['abeto', 35], ['pino', 25], ['roble', 20], ['abedul', 20]]);
    case 'montana': return weighted([['abeto', 65], ['pino', 35]]);
    case 'pradera': return weighted([['roble', 60], ['alamo', 22], ['abedul', 18]]);
    case 'campo': return weighted([['alamo', 50], ['roble', 50]]);
    case 'cerro': return weighted([['roble', 45], ['pino', 35], ['alamo', 20]]);
    default: return weighted([['roble', 60], ['abedul', 20], ['alamo', 20]]);
  }
}
function treeTint(kind, rng){
  if ((kind === 'roble' || kind === 'abedul') && rng() < .09) return pick([0xffb070, 0xffd070, 0xff9a60], rng);
  const l = .88 + rng()*.24; return new THREE.Color(l, l, l*.96).getHex();
}
function bigTree(sc, x, z, kind, s, rng){
  if (!CUR_TREES){ if (kind === 'abeto' || kind === 'pino') pineMesh(sc, x, z, s*1.3, rng); else leafTreeMesh(sc, x, z, s*1.3, rng); return; }
  CUR_TREES.add(kind, x, GH(x, z) - .1, z, s, rng()*6.28, treeTint(kind, rng));
  addColl(x, z, (kind === 'roble' ? .5 : .3)*s + .15);
}
function tree(sc, x, z, s, rng, biome='bosque'){ bigTree(sc, x, z, treeKindFor(biome, rng), s*.78, rng); }
function pine(sc, x, z, s, rng){ bigTree(sc, x, z, rng() < .6 ? 'abeto' : 'pino', s*.78, rng); }
function leafTree(sc, x, z, s, rng){ bigTree(sc, x, z, weighted([['roble', 60], ['abedul', 20], ['alamo', 20]]), s*.85, rng); }

// ---- animals (legs and heads overlap the body so nothing floats)
