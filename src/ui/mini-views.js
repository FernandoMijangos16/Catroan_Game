// ================= MINI 3D VIEWS (one shared renderer draws every small HUD scene, pixelated like CloverPit) =================
const MINI = { r: null, views: [], S: 640 };
function miniInit(){
  if (MINI.r) return true;
  try { MINI.r = new THREE.WebGLRenderer({ antialias: false, alpha: true }); MINI.r.setPixelRatio(1); MINI.r.setSize(MINI.S, MINI.S); MINI.r.outputColorSpace = THREE.SRGBColorSpace; MINI.r.setClearColor(0, 0); } catch { return false; }
  return true;
}
function miniView(canvas, o){
  const v = { canvas, ctx: canvas.getContext('2d'), sc: new THREE.Scene(), res: o.res || .5, fps: o.fps || 30, acc: 1, t: 0, tick: o.tick || (() => {}), ortho: !!o.ortho, alive: true };
  v.sc.add(new THREE.HemisphereLight(0xfff4e0, 0x4a3a2a, 2.1));
  const dl = new THREE.DirectionalLight(0xfff0d8, 2.4); dl.position.set(-1.5, 2.5, 3); v.sc.add(dl);
  v.resize = (w, h) => {
    v.w = w; v.h = h; const iw = Math.min(MINI.S, Math.max(8, Math.round(w*v.res))), ih = Math.min(MINI.S, Math.max(8, Math.round(h*v.res)));
    canvas.width = iw; canvas.height = ih; canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    if (v.ortho){ v.cam = v.cam || new THREE.OrthographicCamera(); Object.assign(v.cam, { left: -w/2, right: w/2, top: h/2, bottom: -h/2, near: -2000, far: 2000 }); v.cam.position.set(0, 0, 500); v.cam.updateProjectionMatrix(); }
    else { v.cam = v.cam || new THREE.PerspectiveCamera(o.fov || 30, 1, .05, 80); v.cam.aspect = w/h; v.cam.updateProjectionMatrix(); }
  };
  v.resize(o.w, o.h);
  MINI.views.push(v); return v;
}
function stepMini(dt){
  if (!MINI.r) return;
  const r = MINI.r;
  for (let i = MINI.views.length - 1; i >= 0; i--){
    const v = MINI.views[i];
    if (!v.alive || !v.canvas.isConnected){ MINI.views.splice(i, 1); continue; }
    if (v.canvas.offsetParent === null) continue;
    v.t += dt; v.acc += dt; if (v.acc < 1/v.fps) continue; const step = v.acc; v.acc = 0;
    v.tick(step, v.t);
    const w = v.canvas.width, h = v.canvas.height;
    r.setViewport(0, 0, w, h); r.setScissor(0, 0, w, h); r.setScissorTest(true); r.clear(); r.render(v.sc, v.cam); r.setScissorTest(false);
    v.ctx.clearRect(0, 0, w, h); v.ctx.drawImage(r.domElement, 0, MINI.S - h, w, h, 0, 0, w, h);
  }
}
// ---------- shared low-poly assets ----------
const M3 = {};
function m3(){
  if (M3.ready) return M3;
  itemAssets();
  const P = (c, col, x, y, w=1, h=1) => { c.fillStyle = col; c.fillRect(x, y, w, h); }, R = mulberry32(41);
  M3.paperTex = pxTex(32, 32, c => { P(c, '#e6d3a8', 0, 0, 32, 32); for (let i=0;i<160;i++) P(c, pick(['#dcc596', '#efdfba', '#d2bb8a', '#e9d8b0'], R), Math.floor(R()*32), Math.floor(R()*32), 1 + Math.floor(R()*2), 1); for (let i=0;i<3;i++){ c.fillStyle = 'rgba(140,100,50,.08)'; c.beginPath(); c.arc(R()*32, R()*32, 3 + R()*6, 0, 7); c.fill(); } });
  M3.paperTex.wrapS = M3.paperTex.wrapT = THREE.RepeatWrapping;
  M3.rollEnd = pxTex(16, 16, c => { P(c, '#8a6a3a', 0, 0, 16, 16); for (let y=0;y<16;y++) for (let x=0;x<16;x++){ const d = Math.hypot(x + .5 - 8, y + .5 - 8), a = Math.atan2(y - 8, x - 8); if (d > 8) continue; P(c, ((d - a*.35) % 2.2) < 1 ? '#b89a68' : '#efe0bc', x, y); } });
  M3.featherTex = pxTex(16, 32, c => { P(c, '#efe8dc', 0, 0, 16, 32); for (let y=0;y<32;y+=2){ P(c, '#c9c0b0', 0, y, 7, 1); P(c, '#d8d0c2', 9, y + 1, 7, 1); } P(c, '#a89a86', 7, 0, 2, 32); P(c, '#ffffff', 2, 3, 3, 1); });
  const std = o => keepMat(new THREE.MeshStandardMaterial({ roughness: .95, flatShading: true, ...o }));
  M3.paperSide = std({ map: M3.paperTex, color: 0xd8c49a, flatShading: false });
  M3.rollEndM = std({ map: M3.rollEnd });
  M3.feather = std({ map: M3.featherTex, side: THREE.DoubleSide });
  M3.ink = std({ color: 0x1a1410, roughness: .3 });
  M3.ready = true; return M3;
}
function waxSeal3D(color, ribbon = true){
  const g = new THREE.Group(), c = new THREE.Color(color);
  const wax = keepMat(new THREE.MeshStandardMaterial({ color: c, roughness: .32, metalness: .05, flatShading: true }));
  const waxD = keepMat(new THREE.MeshStandardMaterial({ color: c.clone().multiplyScalar(.6), roughness: .4, flatShading: true }));
  if (ribbon) [[-.3, .3], [.3, -.3]].forEach(([x, r], i) => { const rb = new THREE.Mesh(GEO.box, i ? wax : waxD); rb.scale.set(.32, 1.25, .04); rb.position.set(x*.6, -1.25, -.1); rb.rotation.z = r; g.add(rb); });
  const blob = new THREE.Mesh(sg(jitterGeo(new THREE.IcosahedronGeometry(1, 1), .14, 5)), wax); blob.scale.set(1, 1, .3); g.add(blob);
  [[-.55, -.8, .13], [.6, -.75, .1], [.1, -.98, .09]].forEach(([x, y, s]) => { const d = new THREE.Mesh(GEO.sphere, wax); d.scale.set(s, s*1.6, s); d.position.set(x, y, 0); g.add(d); });
  const ring = new THREE.Mesh(sg(new THREE.TorusGeometry(.62, .07, 4, 14)), waxD); ring.position.z = .26; g.add(ring);
  const em = new THREE.Mesh(sg(new THREE.CylinderGeometry(.3, .3, .12, 6).rotateX(Math.PI/2)), waxD); em.position.z = .27; g.add(em);
  return outlineItem(g);
}
function quill3D(){
  const A = m3(), g = new THREE.Group();
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(.22, .25, .2, .75, .02, 1.05); sh.bezierCurveTo(-.12, .8, -.16, .3, 0, 0);
  const vg = new THREE.ShapeGeometry(sh, 6), vp = vg.attributes.position, uv = vg.attributes.uv;
  for (let i=0;i<vp.count;i++){ const x = vp.getX(i), y = vp.getY(i); uv.setXY(i, x*2 + .5, y); vp.setZ(i, x*x*.8 + Math.sin(y*3)*.03); }
  vg.computeVertexNormals();
  const vane = new THREE.Mesh(vg, A.feather); vane.position.y = .25; g.add(vane);
  const shaft = new THREE.Mesh(GEO.cyl, keepMat(new THREE.MeshStandardMaterial({ color: 0xd8ccb4, flatShading: true }))); shaft.scale.set(.018, 1.3, .018); shaft.position.y = -.05; g.add(shaft);
  const nib = new THREE.Mesh(GEO.cone6, A.ink); nib.scale.set(.03, .14, .03); nib.rotation.z = Math.PI; nib.position.y = -.05; g.add(nib);
  return outlineItem(g);
}
function modelObj(kind, p){
  const P = p ?? 0;
  switch (kind){
    case 'pueblo': return outlineItem(boardVillage(P, false, 2, 5));
    case 'ciudad': return outlineItem(boardVillage(P, true, 3, 9));
    case 'camino': { const g = new THREE.Group(), r = fencedRoad(P, { x: -.5, z: 0 }, { x: .5, z: 0 }); r.position.set(0, 0, 0); g.add(r); return outlineItem(g); }
    case 'dados': { const g = new THREE.Group(); [[-.6, 0, .3], [.6, .1, -.4]].forEach(([x, y, r]) => { const d = makeDie(); d.position.set(x, y, 0); d.rotation.set(r, r*2, .3); g.add(d); }); return g; }
    case 'ladron': return robberModel();
    case 'carta': return cardMesh();
    case 'comercio': return cardModel('mercader');
    default: return CARD_DEFS[kind] ? cardModel(kind) : null;
  }
}
// fit an object into a box of px size inside an ortho mini view, wrapped in a pivot that spins tilted
function spinner(obj, size){
  const box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3());
  obj.position.sub(c); const pv = new THREE.Group(), inner = new THREE.Group(); inner.add(obj); pv.add(inner);
  const k = size/Math.max(sz.x, sz.y, sz.z, .001); pv.scale.setScalar(k); pv.userData.inner = inner; pv.rotation.x = .35; return pv;
}

