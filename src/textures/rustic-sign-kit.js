// ================= RUSTIC SIGN KIT: weathered planks, rusty iron, letters burnt into the wood =================
const RUST = new Map();
function plankTex(seed, base = 0x5e3c22){
  const key = 'pk2' + seed + base; if (RUST.has(key)) return RUST.get(key);
  // CloverPit-like: chunky pixels, a palette of many dark browns, dithered grain
  const B = new THREE.Color(base), W = 64, H = 16, tones = [.62, .72, .8, .88, .96, 1.05, 1.14].map(k => B.clone().multiplyScalar(k)), cool = new THREE.Color(0x4a3a2c);
  const t = pxTex(W, H, c => {
    const kx = 10 + hash2(seed, 1, 5)*42, ky = 4 + hash2(seed, 2, 5)*8, tone = .9 + hash2(seed, 3, 5)*.2;
    for (let y=0;y<H;y++) for (let x=0;x<W;x++){
      const wob = Math.sin(x*.11 + seed*1.7)*1.8 + Math.sin(x*.37 + seed)*.6, line = Math.abs(Math.sin((y + wob)*1.15 + seed));
      let v = (line < .2 ? 1 : line < .45 ? 2.6 : 4)*tone + (hash2(x, y, seed + 11) - .5)*2.2;          // grain + dither
      const dk = Math.hypot((x - kx)*.5, y - ky); if (dk < 3.4) v = dk < 1.2 ? 0 : (Math.floor(dk*2) % 2 ? 1.4 : 3);
      if (hash2(x >> 3, y, seed + 21) > .92 && x % 8 < 6) v -= 2;                                        // cracks
      if (y === 0) v += 1.4; if (y === H - 1) v = 0; if (y === H - 2) v -= 1.3;
      if (x < 3 || x > W - 4) v -= 1.2;
      const col = tones[Math.max(0, Math.min(6, Math.round(v)))].clone().lerp(cool, hash2(x >> 2, y >> 2, seed + 4)*.14);
      c.fillStyle = '#' + col.getHexString(); c.fillRect(x, y, 1, 1);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; RUST.set(key, t); return t;
}
function plankMat(seed, base){ const key = 'pm' + seed + base; if (RUST.has(key)) return RUST.get(key); const m = keepMat(new THREE.MeshStandardMaterial({ map: plankTex(seed, base), roughness: .95, flatShading: true })); RUST.set(key, m); return m; }
function endGrainMat(){ return RUST.get('eg') || (RUST.set('eg', keepMat(new THREE.MeshStandardMaterial({ map: pxTex(8, 8, c => { for (let y=0;y<8;y++) for (let x=0;x<8;x++){ const r = Math.hypot(x - 3.5, y - 3.5); c.fillStyle = '#' + new THREE.Color(0x4a3220).multiplyScalar((Math.floor(r) % 2 ? .8 : 1)*(.9 + hash2(x, y, 77)*.2)).getHexString(); c.fillRect(x, y, 1, 1); } }), roughness: 1 }))), RUST.get('eg')); }
function ironMat(warm){
  const key = 'iron' + (warm ? 'w' : ''); if (RUST.has(key)) return RUST.get(key);
  const t = pxTex(8, 8, c => { for (let y=0;y<8;y++) for (let x=0;x<8;x++){ const n = hash2(x, y, 91), col = n > .8 ? new THREE.Color(0x8a4a22) : n > .62 ? new THREE.Color(0x5a3a28) : new THREE.Color(0x3a3634).multiplyScalar(.85 + n*.3); c.fillStyle = '#' + col.getHexString(); c.fillRect(x, y, 1, 1); } });
  const m = keepMat(new THREE.MeshStandardMaterial({ map: t, metalness: .55, roughness: .7, flatShading: true, color: warm ? 0xffd890 : 0xffffff, emissive: warm ? 0x3a2408 : 0 })); RUST.set(key, m); return m;
}
// letters burnt into the wood: pixel-low resolution, scorched halo
function burntTex(text, w, h, size, opts = {}){
  const key = 'bt' + text + w + 'x' + h + size + (opts.num ? 'N' : ''); if (RUST.has(key)) return RUST.get(key);
  const k = 2, cv = document.createElement('canvas'); cv.width = w*k; cv.height = h*k; const c = cv.getContext('2d');
  c.font = opts.num ? `900 ${size*k}px Verdana, 'DejaVu Sans', Arial, sans-serif` : `700 ${size*k}px 'Pixelify Sans', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
  let fs = size*k; while (c.measureText(text).width > w*k*.94 && fs > 6){ fs -= 1; c.font = c.font.replace(/\d+px/, fs + 'px'); }
  const x = w*k/2, y = h*k/2 + k*.5;
  c.shadowColor = 'rgba(30,10,2,.95)'; c.shadowBlur = 3*k; c.fillStyle = 'rgba(30,12,4,.8)'; c.fillText(text, x, y); c.fillText(text, x, y);
  c.shadowBlur = 0; c.fillStyle = '#0e0501'; c.fillText(text, x, y);
  c.fillStyle = 'rgba(255,214,160,.34)'; c.fillText(text, x, y + k);                 // the lower lip catches some light
  c.fillStyle = '#080300'; c.fillText(text, x, y - k*.5);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter;
  RUST.set(key, t); return t;
}
function burntPlane(text, w, h, size, opts){ const m = new THREE.Mesh(sg(new THREE.PlaneGeometry(1, 1)), new THREE.MeshStandardMaterial({ map: burntTex(text, w, h, size, opts), transparent: true, roughness: 1, depthWrite: false })); m.scale.set(w, h, 1); return m; }
// a board of loose planks with iron corner brackets; top edge at y = 0, centred on x
function rusticBoard(W, H, seed = 1, o = {}){
  const g = new THREE.Group(), R = mulberry32(seed*13 + 7), n = Math.max(1, Math.round(H/(o.ph || 25))), ph = H/n, eg = endGrainMat(), iron = o.iron || ironMat();
  g.add(mesh(GEO.box, 0x1e140c, 0, -H, -3, W - 6, H, 3));                            // dark backing seen through the gaps
  g.planks = [];
  for (let i=0;i<n;i++){ const pm = plankMat((seed*5 + i) % 7, o.base || 0x5e3c22);
    const pk = new THREE.Mesh(GEO.box, [eg, eg, pm, eg, pm, eg]); pk.scale.set(W + (R() - .5)*5, ph - 1.3, 6); pk.position.set((R() - .5)*2.2, -(i + 1)*ph + .65 + (R() - .5)*.8, 0); pk.rotation.z = (R() - .5)*.014; g.add(pk); g.planks.push(pk);
    [-1, 1].forEach(sd => g.add(mesh(GEO.sphere, iron, sd*(W/2 - 6), -(i + .5)*ph, 3.4, 1.1, 1.1, .8))); }
  if (o.brackets !== false){ const L = Math.min(16, H*.35), T = 3.4;
    [[-W/2, 0], [W/2, 0], [-W/2, -H], [W/2, -H]].forEach(([cx, cy]) => { const ix = cx < 0 ? 1 : -1, iy = cy === 0 ? -1 : 1;
      g.add(mesh(GEO.box, iron, cx + ix*L/2, cy + iy*T/2 - T/2, 3.6, L, T, 1.4));
      g.add(mesh(GEO.box, iron, cx + ix*T/2, cy + iy*L/2 - L/2, 3.6, T, L, 1.4));
      [[cx + ix*(L - 3), cy + iy*T/2], [cx + ix*T/2, cy + iy*(L - 3)], [cx + ix*T/2, cy + iy*T/2]].forEach(([rx, ry]) => g.add(mesh(GEO.sphere, iron, rx, ry, 4.5, 1.15, 1.15, .9))); }); }
  return g;
}
function ironRing(mat, x, y, r = 4){ const m = new THREE.Mesh(new THREE.TorusGeometry(r, r*.28, 4, 8), mat); m.position.set(x, y, 2); return m; }
