// ================= 3D RESOURCE ITEMS =================
function pxTex(w, h, draw, nearest = true){
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d'); draw(c, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  if (nearest){ t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestMipmapLinearFilter; }
  return t;
}
const keepMat = m => (CACHED_MATS.add(m), m);
const hexCss = c => '#' + new THREE.Color(c).getHexString();
const IT = {};
function itemAssets(){
  if (IT.ready) return IT;
  const R = mulberry32(99);
  // painted pixel textures (bold shading baked in, nearest filtering) in the style of chunky PS1 props
  const P = (c, col, x, y, w=1, h=1) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  IT.barkTex = pxTex(32, 32, (c, w, h) => {
    P(c, '#8d6c4a', 0, 0, w, h);
    for (let x = 0; x < w; x += 3 + Math.floor(R()*2)){ let y = 0; while (y < h){ const l = 3 + Math.floor(R()*6); P(c, '#5a4129', x, y, 1, l); P(c, '#a8865e', x + 1, y, 1, Math.max(1, l - 2)); y += l + 1 + Math.floor(R()*3); } }
    for (let i=0;i<40;i++) P(c, pick(['#6f5238', '#9c7a54', '#b8956a'], R), Math.floor(R()*w), Math.floor(R()*h), 1, 1 + Math.floor(R()*2));
    [[9, 12], [23, 24]].forEach(([x, y]) => { P(c, '#4a3422', x - 2, y - 1, 5, 3); P(c, '#6f5238', x - 1, y, 3, 1); P(c, '#c49c6c', x - 2, y - 2, 5, 1); });
  });
  IT.ringTex = pxTex(32, 32, (c, w) => {
    P(c, '#5a4129', 0, 0, w, w);
    const cx = w/2 + .5, cy = w/2 - .5;
    for (let y=0;y<w;y++) for (let x=0;x<w;x++){
      const d = Math.hypot(x + .5 - w/2, y + .5 - w/2); if (d > w/2 - .5) continue;
      if (d > w/2 - 2.5){ P(c, d > w/2 - 1.3 ? '#4a3422' : '#7a5a3a', x, y); continue; }
      const rr = Math.hypot(x + .5 - cx, (y + .5 - cy)*1.06), band = Math.floor(rr/2.3) % 2;
      const lit = (x - y) < -4 ? 1 : (x - y) > 8 ? -1 : 0;
      P(c, band ? (lit > 0 ? '#f4dba8' : lit < 0 ? '#d4b07a' : '#e8c890') : (lit > 0 ? '#dcb57c' : lit < 0 ? '#b48a56' : '#c9a066'), x, y);
    }
    P(c, '#7a5530', cx - 1, cy - 1, 2, 2); for (let k=0;k<8;k++) P(c, '#8a6238', cx + k, cy - k*1.3, 1, 1);
  });
  IT.leafTex = pxTex(16, 16, (c, w) => { P(c, '#4e8a34', 0, 0, w, w); for (let i=0;i<30;i++) P(c, pick(['#6aa844', '#3a6e28', '#82c050'], R), Math.floor(R()*w), Math.floor(R()*w)); P(c, '#a8d870', 0, 0, w, 2); });
  IT.strawTex = pxTex(32, 32, (c, w, h) => {
    P(c, '#d0a646', 0, 0, w, h);
    for (let i=0;i<150;i++){ const y = Math.floor(R()*h), x = Math.floor(R()*w), l = 2 + Math.floor(R()*5); P(c, pick(['#f2d47c', '#e6bf58', '#a8822e', '#bf9438', '#fbe7a0'], R), x, y, l, 1); }
    P(c, '#fbe7a0', 0, 0, w, 1); P(c, '#9a7428', 0, h - 1, w, 1);
  });
  IT.spiralTex = pxTex(32, 32, (c, w) => {
    for (let y=0;y<w;y++) for (let x=0;x<w;x++){
      const dx = x + .5 - w/2, dy = y + .5 - w/2, d = Math.hypot(dx, dy); if (d > w/2) continue;
      const a = Math.atan2(dy, dx), s = (d - a/6.28*2.6) % 2.6;
      P(c, d > w/2 - 1.2 ? '#a07a2e' : s < .9 ? '#9c7628' : (dx - dy) < -6 ? '#f0cf74' : '#d6ad4c', x, y);
    }
  });
  IT.brickTex = pxTex(32, 16, (c, w, h) => {
    P(c, '#b04e36', 0, 0, w, h);
    for (let i=0;i<70;i++) P(c, pick(['#c4644a', '#963e2a', '#cf7556', '#8a3624', '#d88a66'], R), Math.floor(R()*w), Math.floor(R()*h), 1 + Math.floor(R()*2), 1);
    P(c, '#e08e6a', 0, 0, w, 1); P(c, '#d27656', 0, 1, w, 1); P(c, '#7a2e1e', 0, h - 1, w, 1); P(c, '#8e3826', 0, h - 2, w, 1);
    P(c, '#e08e6a', 0, 0, 1, h); P(c, '#7a2e1e', w - 1, 0, 1, h);
    [[6, 6], [20, 9], [27, 4]].forEach(([x, y]) => { P(c, '#7a2e1e', x, y, 2, 1); P(c, '#d88a66', x, y - 1, 2, 1); });
  });
  IT.metalTex = pxTex(32, 16, (c, w, h) => {
    for (let y=0;y<h;y++){ const k = y/h; P(c, `rgb(${Math.round(232 - k*96)},${Math.round(236 - k*92)},${Math.round(242 - k*84)})`, 0, y, w, 1); }
    for (let i=0;i<9;i++){ const x = Math.floor(R()*w), y = Math.floor(R()*h); for (let k=0;k<4;k++) P(c, 'rgba(255,255,255,.75)', x + k, y + k, 1, 1); }
    for (let i=0;i<14;i++) P(c, 'rgba(60,66,76,.45)', Math.floor(R()*w), Math.floor(R()*h), 2, 1);
    P(c, '#ffffff', 0, 0, w, 1); P(c, '#f2f6fa', 0, 0, 1, h); P(c, '#4e5560', 0, h - 1, w, 1); P(c, '#5e6570', w - 1, 0, 1, h);
  });
  IT.woolTex = pxTex(16, 16, (c, w) => { P(c, '#efe9dc', 0, 0, w, w); for (let i=0;i<40;i++){ const x = Math.floor(R()*w), y = Math.floor(R()*w); P(c, '#ffffff', x, y, 2, 1); P(c, '#cfc6b4', x, y + 1, 2, 1); } });
  IT.env = pxTex(64, 32, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#5f7896'); g.addColorStop(.38, '#e8eef5'); g.addColorStop(.47, '#ffffff'); g.addColorStop(.5, '#8a8078'); g.addColorStop(1, '#4e4640');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }, false);
  IT.env.mapping = THREE.EquirectangularReflectionMapping;
  const std = o => keepMat(new THREE.MeshStandardMaterial({ roughness: .9, flatShading: true, ...o }));
  IT.m = {
    bark: std({ map: IT.barkTex }),
    ring: std({ map: IT.ringTex, roughness: .95 }),
    leaf: std({ map: IT.leafTex }),
    straw: std({ map: IT.strawTex }),
    spiral: std({ map: IT.spiralTex }),
    twine: std({ color: 0xb06a30, roughness: 1 }),
    brick: std({ map: IT.brickTex, roughness: .97 }),
    frog: std({ color: 0x8a3a28, roughness: 1 }),
    metal: std({ map: IT.metalTex, metalness: .55, roughness: .35, envMap: IT.env, envMapIntensity: .8 }),
    metalDark: std({ color: 0x6d7580, metalness: .6, roughness: .4, envMap: IT.env }),
    wool: std({ map: IT.woolTex }),
  };
  // inverted-hull outline pushed along view-space normals: chunky dark edge like the CloverPit props
  IT.outline = keepMat(new THREE.ShaderMaterial({
    uniforms: { w: { value: .011 }, col: { value: new THREE.Color(0x120d0a) } }, side: THREE.BackSide,
    vertexShader: 'uniform float w; void main(){ vec3 n = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position, 1.); mv.xyz += n*w*max(1., -mv.z*.35); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform vec3 col; void main(){ gl_FragColor = vec4(col, 1.); }',
  }));
  const lathe = pts => sg(new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 12));
  IT.g = {
    log: sg(jitterGeo(new THREE.CylinderGeometry(.15, .165, .74, 9, 3, true).rotateZ(Math.PI/2), .014, 4)),
    disc: sg(new THREE.CircleGeometry(1, 9)),
    stub: sg(new THREE.CylinderGeometry(.036, .05, .13, 6, 1, true).translate(0, .065, 0)),
    bale: lathe([[.17, -.2], [.205, -.188], [.224, -.15], [.228, 0], [.224, .15], [.205, .188], [.17, .2]]),
    band: sg(new THREE.TorusGeometry(.232, .013, 4, 14)),
    strand: sg(new THREE.BoxGeometry(.008, 1, .008).translate(0, .5, 0)),
    ingot: sg((() => { const b = new THREE.BoxGeometry(1, 1, 1), p = b.attributes.position; for (let i=0;i<p.count;i++) if (p.getY(i) > 0){ p.setX(i, p.getX(i)*.8); p.setZ(i, p.getZ(i)*.7); } b.computeVertexNormals(); return b; })()),
    stamp: sg(new THREE.CylinderGeometry(1, 1, 1, 6)),
    leaf: sg(new THREE.OctahedronGeometry(1, 0)),
  };
  IT.ready = true; return IT;
}
let OUTLINE_OFF = false;
function outlineItem(g){
  if (OUTLINE_OFF) return g;
  const list = []; g.traverse(o => { if (o.isMesh && !o.userData.outline) list.push(o); });
  list.forEach(o => { const h = new THREE.Mesh(o.geometry, IT.outline); h.userData.outline = true; h.castShadow = false; h.raycast = () => {}; o.add(h); });
  return g;
}
function makeResourceItem(kind){
  const A = itemAssets(), g = new THREE.Group();
  const add = (geo, m, x, y, z, sx, sy, sz, rx=0, ry=0, rz=0) => { const o = new THREE.Mesh(geo, m.isMaterial ? m : mat(m)); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
  switch (kind){
    case 'madera': { // one light oak log with a cut branch and a sprig of leaves
      add(A.g.log, A.m.bark, 0, .165, 0, 1, 1, 1);
      add(A.g.disc, A.m.ring, .371, .165, 0, .15, .15, .15, 0, Math.PI/2, 0);
      add(A.g.disc, A.m.ring, -.371, .165, 0, .165, .165, .165, 0, -Math.PI/2, 0);
      const st = add(A.g.stub, A.m.bark, .12, .29, .02, 1, 1, 1, .35, 0, -.5);
      add(A.g.disc, A.m.ring, .12 + Math.sin(.5)*.13, .29 + Math.cos(.5)*.13*.94, .02 + .045, .04, .04, .04, -Math.PI/2 + .35, 0, -.5);
      [[-.16, .31, .07, .4], [-.12, .32, .02, -.3], [-.19, .305, .0, 1.1]].forEach(([x, y, z, r]) => add(A.g.leaf, A.m.leaf, x, y, z, .06, .014, .034, 0, r, 0));
      break; }
    case 'ladrillo': { // a single brick with its frog
      add(PGEO.rbox, A.m.brick, 0, .075, 0, .46, .15, .22);
      add(PGEO.rbox, A.m.frog, 0, .148, 0, .27, .012, .09);
      break; }
    case 'lana': { // a whole sheep
      const sh = makeAnimal('oveja', mulberry32(12)).g;
      sh.updateMatrixWorld(true);
      const b = new THREE.Box3().setFromObject(sh), sz = b.getSize(new THREE.Vector3()), s = .56/Math.max(sz.x, sz.z);
      sh.scale.setScalar(s); sh.position.set(-(b.min.x + b.max.x)/2*s, -b.min.y*s, -(b.min.z + b.max.z)/2*s);
      sh.rotation.y = 0; sh.traverse(o => { if (o.isMesh){ o.castShadow = true; o.receiveShadow = true; if (o.material.color && o.material.color.r > .85 && o.material.color.b > .8) o.material = A.m.wool; } });
      g.add(sh);
      break; }
    case 'trigo': { // round straw bale, tied with twine
      add(A.g.bale, A.m.straw, 0, .226, 0, 1, 1, 1, 0, 0, Math.PI/2);
      [-1, 1].forEach(sd => add(A.g.disc, A.m.spiral, sd*.2005, .226, 0, .172, .172, .172, 0, sd*Math.PI/2, 0));
      [-.12, 0, .12].forEach(x => add(A.g.band, A.m.twine, x, .226, 0, 1, 1, 1, 0, Math.PI/2, 0));
      const r = mulberry32(5);
      for (let i=0;i<9;i++){ const x = (r() - .5)*.34, a = (r() - .5)*.9; add(A.g.strand, A.m.straw, x, .226 + Math.cos(a)*.218, Math.sin(a)*.218, 1, .05 + r()*.05, 1, a + (r() - .5)*.8, 0, (r() - .5)*.8); }
      break; }
    case 'mineral': { // metal ingot
      add(A.g.ingot, A.m.metal, 0, .065, 0, .48, .13, .2);
      add(A.g.stamp, A.m.metalDark, 0, .131, 0, .045, .008, .045);
      break; }
  }
  return outlineItem(g);
}
// small rendered icons of each item for the interface
const RES_IMG = {};
function renderResourceIcons(){
  let r2;
  try { r2 = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch { return; }
  r2.setSize(96, 96); r2.setPixelRatio(1); r2.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xfff4e0, 0x5a4a3a, 2.2));
  const dl = new THREE.DirectionalLight(0xfff0d8, 2.6); dl.position.set(2, 3, 2.5); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(30, 1, .1, 20);
  RES.forEach(k => {
    const it = makeResourceItem(k); it.rotation.set(0, k === 'lana' ? -.5 : .35, .3); sc.add(it);
    const box = new THREE.Box3().setFromObject(it), c = box.getCenter(new THREE.Vector3()), sz = box.getSize(new THREE.Vector3()).length();
    cam.position.set(c.x + sz*.8, c.y + sz*.66, c.z + sz*1.05); cam.lookAt(c);
    r2.render(sc, cam);
    RES_IMG[k] = r2.domElement.toDataURL('image/png');
    sc.remove(it);
  });
  r2.dispose(); r2.forceContextLoss?.();
}
const resImg = (k, cls='ri') => RES_IMG[k] ? `<img class="${cls}" data-k="${k}" src="${RES_IMG[k]}" alt="${RES_NAME[k]}">` : `<span class="m3" data-k="${k}">${RES_ICON[k]}</span>`;

// ---------- production: the item is revealed out of its number token, flies to the village, fireworks ----------
