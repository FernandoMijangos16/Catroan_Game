// ================= PROPS (village & travel) =================
let GH = () => 0;
let CUR_COLL = null, CUR_ANIMS = null, CUR_ANIMALS = null, CUR_LIGHTS = null, CUR_POI = null;
const addColl = (x, z, r) => { if (CUR_COLL) CUR_COLL.push({ x, z, r }); };
const GREENS = [0x3f8f45, 0x4a9b4a, 0x347c3a, 0x2f7438];
const LEAF = [0x5aa847, 0x6dbb4f, 0x4c9a3e, 0x7cc456];
const AUTUMN = [0xe08a3a, 0xd9b23c, 0xc9643a];
const SKIN = [0xf1c9a5, 0xd9a57b, 0xb07a52, 0x8a5a3a, 0xe8b894, 0xc68e63];
const CLOTH = [0xc0392b, 0x2e86c1, 0x27ae60, 0x8e44ad, 0xd35400, 0x16a085, 0x7f8c8d, 0xf1c40f, 0x34495e, 0xe67e22, 0xecf0f1, 0xa0522d];
const FLOWER_COLORS = [0xf4f1ea, 0xf7d046, 0xe85d75, 0xb57fe0, 0x5fa8f0, 0xff9f43, 0xf06a5a];
const hexOf = c => (typeof c === 'number' ? c : c.getHex());
// local -> world on a rotated group
const toWorld = (cx, cz, f, lx, lz) => [cx + lx*Math.cos(f) + lz*Math.sin(f), cz - lx*Math.sin(f) + lz*Math.cos(f)];

// ---- terrain (d = distance from the flat, inhabited area)
function terrainH(type, x, z, d){
  const f = smoothstep(0, 22, d);
  switch (type){
    case 'bosque': return f * fbm(x*.03, z*.03, 1) * 10;
    case 'pradera': return f * fbm(x*.022, z*.022, 2) * 6;
    case 'campo': return f * fbm(x*.018, z*.018, 3) * 2.5;
    case 'cerro': { const n = fbm(x*.024, z*.024, 4); return f * (n*n*30 + 1.5); }
    case 'montana': { const n = fbm(x*.02, z*.02, 5); return f*n*10 + Math.min(110, Math.max(0, d - 25)) * .62 * (.3 + fbm(x*.011 + 9, z*.011, 6)); }
    case 'desierto': return f * ((Math.sin(x*.07 + fbm(x*.02, z*.02, 7)*5)*.5 + .5)*4 + 1);
    case 'mar': return -smoothstep(0, 22, d)*5 + (fbm(x*.05, z*.05, 8) - .5)*.6*(1 - f);
  }
  return 0;
}
function terrainColor(type, x, y, z, r, ny=1){
  const steep = ny < .8;
  switch (type){
    case 'bosque': return steep ? jc(0x6f6a4a, r, .1) : jc(fbm(x*.05, z*.05, 11) > .5 ? 0x3f8f45 : (fbm(x*.11, z*.11, 17) > .7 ? 0x5c8f3a : 0x4f9c48), r, .1);
    case 'pradera': return steep ? jc(0x7f8f4a, r, .1) : jc(fbm(x*.04, z*.04, 12) > .55 ? 0x9bd86a : (fbm(x*.09, z*.09, 16) > .7 ? 0xb5dc6e : 0x86c95a), r, .09);
    case 'campo': { if (steep) return jc(0xa58c4a, r, .08); const u = Math.floor((x + fbm(x*.02, z*.02, 13)*10)/14), v = Math.floor(z/10); return jc([0xf2cc56, 0xe6b23f, 0xd2cf68, 0xf6dc85, 0xa8d062, 0xe9c04a, 0x9a7a48][Math.floor(hash2(u, v, 14)*7)], r, .05); }
    case 'cerro': return steep ? jc(0xa9552f, r, .1) : jc(y > 5 ? (y > 14 ? 0xc9683a : 0xd9804a) : (fbm(x*.04, z*.04, 15) > .52 ? 0xd9804a : 0xa9bf5c), r, .09);
    case 'montana': if (y > 34 && ny > .55) return jc(0xf4f7fb, r, .05); if (y > 29 && ny > .7 && r > .4) return jc(0xf4f7fb, r, .05);
      return jc(steep && y > 4 ? 0x6c7380 : y > 13 ? 0x949aa6 : y > 5 ? 0x7f8794 : 0x8aa465, r, .08);
    case 'desierto': return jc(steep ? 0xd2ad72 : y > 3 ? 0xf2dca4 : 0xe6c98c, r, .06);
    case 'mar': return jc(y > -.5 ? 0xf0dca0 : y > -2 ? 0xd9c48a : 0xbfa974, r, .06);
  }
  return jc(fbm(x*.06, z*.06, 18) > .6 ? 0x8fd062 : 0x7cc456, r, .08);
}

// ---- wind-swayed instanced vegetation
const WIND = { value: 0 };
function windMat(strength){
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true });
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = WIND;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec2 ip = vec2(instanceMatrix[3].x, instanceMatrix[3].z);
      #else
        vec2 ip = vec2(0.0);
      #endif
      float sw = sin(uTime*1.7 + ip.x*.25 + ip.y*.18) + .5*sin(uTime*3.1 + ip.y*.4 + ip.x*.1);
      transformed.x += sw * ${strength.toFixed(3)} * max(0.0, position.y);
      transformed.z += sw * ${(strength*.5).toFixed(3)} * max(0.0, position.y);`);
  };
  m.customProgramCacheKey = () => 'wind' + strength;
  CACHED_MATS.add(m); return m;
}
function tuftGeo(){
  const parts = [];
  for (let i=0;i<5;i++){
    const h = .5 + (i % 3)*.16;
    const g = new THREE.ConeGeometry(.06, h, 3).translate(0, h/2, 0);
    g.rotateZ((i - 2)*.24); g.rotateY(i*1.3); g.translate((i - 2)*.05, 0, ((i*7) % 5 - 2)*.04);
    parts.push(g);
  }
  return mergeGeometries(parts);
}
function wheatGeo(){
  const parts = [];
  for (let i=0;i<3;i++){
    const ox = (i - 1)*.12, oz = ((i*5) % 3 - 1)*.1, h = 1 + (i % 2)*.15;
    parts.push(new THREE.BoxGeometry(.03, h, .03).translate(ox, h/2, oz));
    parts.push(new THREE.BoxGeometry(.07, .26, .07).translate(ox, h + .1, oz));
  }
  return mergeGeometries(parts);
}
const WIND_GRASS = windMat(.2), WIND_WHEAT = windMat(.1);
const SCATTER_DEFS = {
  tuft: { geo: sg(tuftGeo()), mat: WIND_GRASS },
  stem: { geo: sg(new THREE.CylinderGeometry(.012, .018, .44, 3).translate(0, .22, 0)), mat: WIND_GRASS },
  head: { geo: sg(new THREE.IcosahedronGeometry(.085, 0).translate(0, .46, 0)), mat: WIND_GRASS },
  wheat: { geo: sg(wheatGeo()), mat: WIND_WHEAT },
  pebble: { geo: GEO.rocks[0], mat: mat(0xffffff) },
  capM: { geo: sg(new THREE.SphereGeometry(.15, 6, 3, 0, Math.PI*2, 0, Math.PI/2).translate(0, .16, 0)), mat: mat(0xffffff) },
  stemM: { geo: sg(new THREE.CylinderGeometry(.04, .05, .17, 5).translate(0, .085, 0)), mat: mat(0xffffff) },
  brick: { geo: GEO.box, mat: mat(0xffffff) },
};
class Scatter {
  constructor(){ this.lists = {}; }
  add(kind, x, y, z, s, ry, color, sy){ if (kind === 'tuft' && s > .3){ s *= .62; if (sy) sy *= .62; } (this.lists[kind] ||= []).push([x, y, z, s, ry, hexOf(color), sy ?? s]); }
  flower(x, y, z, s, color, ry){ if (s > .3) s *= .75; this.add('stem', x, y, z, s, ry, 0x4f8f3a); this.add('head', x, y, z, s, ry, color); }
  build(sc){
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s3 = new THREE.Vector3(), c = new THREE.Color();
    for (const [kind, arr] of Object.entries(this.lists)){
      const def = SCATTER_DEFS[kind];
      const im = new THREE.InstancedMesh(def.geo, def.mat, arr.length);
      arr.forEach((a, i) => { e.set(0, a[4], 0); q.setFromEuler(e); m4.compose(v.set(a[0], a[1], a[2]), q, s3.set(a[3], a[6], a[3])); im.setMatrixAt(i, m4); im.setColorAt(i, c.setHex(a[5])); });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.castShadow = kind === 'wheat'; im.receiveShadow = true; im.frustumCulled = false; sc.add(im);
    }
  }
}
// one patch of ground cover at (x,z) for a biome
function groundCover(S, type, x, z, rng, y){
  const ry = rng()*6.28, r = rng();
  switch (type){
    case 'pradera': S.add('tuft', x, y, z, .9 + rng()*.8, ry, jc(r < .5 ? 0x7cc456 : 0x9bd86a, rng(), .15)); if (r < .3) S.flower(x + .3, y, z, .9 + rng()*.6, pick(FLOWER_COLORS, rng), ry); break;
    case 'bosque': S.add('tuft', x, y, z, 1 + rng()*1.2, ry, jc(r < .5 ? 0x2f7a38 : 0x4a8f3e, rng(), .15), 1.2 + rng()); if (r < .06) { S.add('stemM', x, y, z, 1, 0, 0xf2ead8); S.add('capM', x, y, z, 1, 0, rng() < .6 ? 0xd94a3a : 0xc9a46a); } else if (r < .12) S.flower(x, y, z, .8, pick([0xf4f1ea, 0xb57fe0], rng), ry); break;
    case 'campo': S.add('tuft', x, y, z, .8 + rng()*.7, ry, jc(r < .5 ? 0xc9b85a : 0xa8c45a, rng(), .12)); if (r < .14) S.flower(x, y, z, .9, rng() < .6 ? 0xe2453a : 0x5f8ff0, ry); break;
    case 'cerro': if (r < .35) S.add('pebble', x, y, z, .12 + rng()*.2, ry, jc(0xa4705a, rng(), .15)); else S.add('tuft', x, y, z, .7 + rng()*.6, ry, jc(0x9cb85a, rng(), .15)); break;
    case 'montana': if (r < .45) S.add('pebble', x, y, z, .15 + rng()*.3, ry, jc(0x8b8f98, rng(), .15)); else S.add('tuft', x, y, z, .7 + rng()*.5, ry, jc(0x7a9a55, rng(), .15)); if (r > .94) S.flower(x, y, z, .7, 0xb57fe0, ry); break;
    case 'desierto': if (r < .35) S.add('tuft', x, y, z, .6 + rng()*.6, ry, jc(0xc9b06a, rng(), .12)); else if (r < .55) S.add('pebble', x, y, z, .12 + rng()*.2, ry, jc(0xc9a36a, rng(), .12)); break;
    case 'mar': if (y > -.4) S.add('tuft', x, y, z, .8 + rng()*.9, ry, jc(0x9aa860, rng(), .12), 1.3); break;
    default: S.add('tuft', x, y, z, .8 + rng()*.7, ry, jc(r < .5 ? 0x6fb84a : 0x8fd062, rng(), .14)); if (r < .16) S.flower(x + .2, y, z, .8 + rng()*.5, pick(FLOWER_COLORS, rng), ry);
  }
}

// ---- trees, rocks & small props
function pineMesh(sc, x, z, s, rng){
  const y = GH(x,z), c = pick(GREENS, rng), th = .9*s;
  sc.add(mesh(GEO.trunk, mat(0x6b4a2f, { tex: 'bark' }), x,y,z, .3*s, th + .4*s, .3*s));
  const fm = foliageMat(c);
  const t1 = mesh(GEO.pineTier, fm, x, y + th*.7, z, 1.7*s, 2.6*s, 1.7*s); t1.rotation.y = rng()*3; sc.add(t1);
  const t2 = mesh(GEO.pineTier, fm, x, y + th*.7 + 1.5*s, z, 1.25*s, 2.2*s, 1.25*s); t2.rotation.y = rng()*3; sc.add(t2);
  sc.add(mesh(GEO.pineTier, fm, x, y + th*.7 + 2.8*s, z, .8*s, 1.7*s, .8*s));
  addColl(x, z, .3*s + .15);
}
function leafTreeMesh(sc, x, z, s, rng){
  const y = GH(x,z), th = 1.6*s;
  sc.add(mesh(GEO.trunk, mat(0x7a5232, { tex: 'bark' }), x,y,z, .28*s, th + .6*s, .28*s));
  const c = rng() < .12 ? pick(AUTUMN, rng) : pick(LEAF, rng);
  const fm = foliageMat(c);
  const f = mesh(pick(GEO.blobs, rng), fm, x, y + th + 1.1*s, z, 1.5*s, 1.35*s, 1.5*s); f.rotation.y = rng()*6; sc.add(f);
  if (rng() < .5){ const f2 = mesh(pick(GEO.blobs, rng), fm, x + .7*s, y + th + .5*s, z + .3*s, .9*s, .8*s, .9*s); f2.rotation.y = rng()*6; sc.add(f2); }
  if (rng() < .25){ const fc = pick([0xd9402a, 0xf2b630], rng); for (let k=0;k<4;k++){ const az = rng()*6.28, el = (rng() - .3)*1.1; sc.add(mesh(GEO.sphere, fc, x + Math.cos(az)*Math.cos(el)*1.38*s, y + th + 1.1*s + Math.sin(el)*1.2*s, z + Math.sin(az)*Math.cos(el)*1.38*s, .12*s, .12*s, .12*s, false)); } }
  addColl(x, z, .28*s + .15);
}
function bush(sc, x, z, s, rng){
  const m = mesh(pick(GEO.blobs, rng), foliageMat(pick(LEAF, rng)), x, GH(x,z) + .3*s, z, .9*s, .6*s, .9*s); m.rotation.y = rng()*6; sc.add(m);
  if (rng() < .35) [0,1,2].forEach(k => sc.add(mesh(GEO.sphere, pick([0xe85d75, 0xf4f1ea, 0xf7d046], rng), x + Math.cos(k*2.1)*.6*s, GH(x,z) + .7*s, z + Math.sin(k*2.1)*.6*s, .1, .1, .1, false)));
}
function rock(sc, x, z, s, rng, color){ const m = mesh(pick(GEO.rocks, rng), color || pick([0x8b8f98, 0x9a978e, 0x7f838c], rng), x, GH(x,z) + s*.2, z, s, s*.7, s*.9); m.rotation.y = rng()*6; sc.add(m); if (s > .9) addColl(x, z, s*.8); }
function haystack(sc, x, z){ const y = GH(x,z); sc.add(mesh(GEO.cyl, 0xe0bd55, x,y,z, 1,1.2,1)); sc.add(mesh(GEO.cone7, 0xd4ad44, x,y+1.2,z, 1.05,.8,1.05)); addColl(x, z, 1.1); }
function windmill(sc, x, z, rot, anims){
  const g = new THREE.Group(); g.position.set(x, GH(x,z), z); g.rotation.y = rot;
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.8,7,8).translate(0,3.5,0), mat(0xf0ebe0)); tower.castShadow = true; g.add(tower);
  g.add(mesh(GEO.cone7, 0xa0402e, 0,7,0, 1.5,2,1.5));
  g.add(mesh(GEO.box, 0x5a3b26, 0,0,1.6, .9,1.8,.2));
  const blades = new THREE.Group(); blades.position.set(0, 7, 1.8);
  for (let i=0;i<4;i++){ const b = new THREE.Group(); b.rotation.z = i*Math.PI/2; b.add(mesh(GEO.box, 0xd8cdb8, .45,0,0, .9,6,.08)); blades.add(b); }
  g.add(blades); sc.add(g);
  anims.push(dt => { blades.rotation.z += dt*.9; });
  addColl(x, z, 2);
}
function kiln(sc, x, z, anims){
  const y = GH(x,z);
  sc.add(mesh(GEO.box, 0x8f4a32, x,y,z, 3,2.5,3));
  const dome = mesh(GEO.sphere, 0x8f4a32, x, y + 2.5, z, 1.5, .9, 1.5); sc.add(dome);
  sc.add(mesh(GEO.cyl, 0x6d3624, x+.8, y+2.5, z+.8, .4, 3, .4));
  sc.add(mesh(GEO.box, 0x2a1d17, x, y, z+1.52, 1, 1.2, .05));
  sc.add(mesh(GEO.box, 0xff8a2a, x, y + .1, z + 1.55, .7, .5, .04, false));
  if (anims) smokeSource(sc, x + .8, y + 5.6, z + .8, anims, 1.4, 0x9a948c);
  addColl(x, z, 2.2);
}
function cactus(sc, x, z, s){
  const y = GH(x,z);
  sc.add(mesh(GEO.cyl, 0x4f8a4a, x,y,z, .3*s, 2.6*s, .3*s));
  sc.add(mesh(GEO.cyl, 0x4f8a4a, x+.5*s, y+1*s, z, .2*s, 1.1*s, .2*s));
  sc.add(mesh(GEO.box, 0x4f8a4a, x+.15*s, y+1*s, z, .5*s, .25*s, .25*s));
  if (s > .9) sc.add(mesh(GEO.sphere, 0xe85d75, x, y + 2.6*s, z, .15, .12, .15, false));
  addColl(x, z, .4*s);
}
// gabled roof made of two tiled slabs, a ridge cap and gable ends (all connected)
