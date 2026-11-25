// ================= THICK, DIRTY 3D PARCHMENT that unrolls sideways (rolls on the left and right) =================
let PARCH_TEX = null;
function parchTex(){
  if (PARCH_TEX) return PARCH_TEX;
  const R = mulberry32(57), n = 64;
  PARCH_TEX = pxTex(n, n, c => {
    c.fillStyle = '#dcc596'; c.fillRect(0, 0, n, n);
    for (let i=0;i<700;i++){ c.fillStyle = pick(['#d2b884', '#e4cfa2', '#c9ad78', '#e8d6ae', '#cfb27c'], R); c.fillRect(Math.floor(R()*n), Math.floor(R()*n), 1 + Math.floor(R()*3), 1); }
    for (let i=0;i<9;i++){ c.fillStyle = `rgba(${110 + R()*30},${70 + R()*20},${30},${.06 + R()*.08})`; c.beginPath(); c.ellipse(R()*n, R()*n, 3 + R()*12, 2 + R()*8, R()*3, 0, 7); c.fill(); }
    for (let i=0;i<25;i++){ c.fillStyle = 'rgba(70,45,20,.25)'; c.fillRect(Math.floor(R()*n), Math.floor(R()*n), 1, 1); }
    for (let i=0;i<4;i++){ c.strokeStyle = 'rgba(120,85,45,.18)'; c.lineWidth = 1; c.beginPath(); let x = R()*n, y = R()*n; c.moveTo(x, y); for (let k=0;k<6;k++){ x += (R() - .5)*12; y += (R() - .5)*12; c.lineTo(x, y); } c.stroke(); }
    // creases: a dark fold line with a light ridge beside it, wandering across the sheet
    for (let i=0;i<7;i++){ let x = R()*n, y = R()*n; const a = R()*Math.PI, len = 18 + R()*30;
      for (let k=0;k<len;k++){ x += Math.cos(a) + (R() - .5)*.8; y += Math.sin(a) + (R() - .5)*.8; const X = ((Math.floor(x) % n) + n) % n, Y = ((Math.floor(y) % n) + n) % n;
        c.fillStyle = 'rgba(105,70,35,.28)'; c.fillRect(X, Y, 1, 1); c.fillStyle = 'rgba(255,240,205,.35)'; c.fillRect((X + 1) % n, Y, 1, 1); } }
  });
  PARCH_TEX.wrapS = PARCH_TEX.wrapT = THREE.RepeatWrapping;
  return PARCH_TEX;
}
// W: open width (px), H: height, opts.th thickness
function parchment3D(W, H, opts = {}){
  const th = opts.th || 4, NX = 150, NY = 12, L = W + 2*(opts.wound || 210), seed = opts.seed || 3;
  const tex = parchTex().clone(); tex.needsUpdate = true; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(L/120, H/120);
  // torn top/bottom edges per column
  const tear = [], tearB = []; for (let j=0;j<=NX;j++){ tear.push(hash2(j, 1, seed)*5 + (hash2(Math.floor(j/4), 3, seed) > .7 ? 4 : 0)); tearB.push(hash2(j, 2, seed)*5 + (hash2(Math.floor(j/5), 4, seed) > .75 ? 5 : 0)); }
  const rows = NY + 1, cols = NX + 1, NV = rows*cols;
  const mk = () => new Float32Array(NV*3);
  const F = mk(), B = mk(), colF = new Float32Array(NV*3), uv = new Float32Array(NV*2);
  for (let j=0;j<cols;j++) for (let i=0;i<rows;i++){ const k = j*rows + i; uv[k*2] = j/NX; uv[k*2 + 1] = i/NY; }
  const quadIdx = []; for (let j=0;j<NX;j++) for (let i=0;i<NY;i++){ const a = j*rows + i, b = a + 1, c = a + rows, d = c + 1; quadIdx.push(a, c, b, b, c, d); }
  const front = new THREE.BufferGeometry(); front.setAttribute('position', new THREE.BufferAttribute(F, 3)); front.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); front.setAttribute('color', new THREE.BufferAttribute(colF, 3)); front.setIndex(quadIdx);
  const back = new THREE.BufferGeometry(); back.setAttribute('position', new THREE.BufferAttribute(B, 3)); back.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); back.setAttribute('color', new THREE.BufferAttribute(colF, 3)); back.setIndex(quadIdx.map((v, n) => quadIdx[n - n % 3 + (2 - n % 3)]));
  // edges: top and bottom strips joining front and back
  const E = new Float32Array(cols*4*3), eIdx = [];
  for (let j=0;j<NX;j++){ const t0 = j*4, t1 = (j + 1)*4; eIdx.push(t0, t1, t0 + 1, t0 + 1, t1, t1 + 1, t0 + 2, t0 + 3, t1 + 2, t0 + 3, t1 + 3, t1 + 2); }
  const edge = new THREE.BufferGeometry(); edge.setAttribute('position', new THREE.BufferAttribute(E, 3)); edge.setIndex(eIdx);
  const pm = keepMat(new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, roughness: 1, flatShading: true }));
  const bm = keepMat(new THREE.MeshStandardMaterial({ map: tex, vertexColors: true, color: 0xc8b088, roughness: 1, flatShading: true }));
  const em = keepMat(new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 1, flatShading: true, side: THREE.DoubleSide }));
  const g = new THREE.Group(); g.add(new THREE.Mesh(front, pm), new THREE.Mesh(back, bm), new THREE.Mesh(edge, em));
  const rMin = 8, b = th + 1.4;
  const rollR = e => Math.sqrt(rMin*rMin + b*Math.max(0, e)/Math.PI);
  const phiAt = (R, e) => (R - Math.sqrt(Math.max(0, R*R - b*e/Math.PI)))*2*Math.PI/b;
  const p = new THREE.Vector3(), n = new THREE.Vector3();
  g.userData.update = (k) => {
    const Wv = Math.max(0, Math.min(W, W*k)), e = (L - Wv)/2, R = rollR(e);
    for (let j=0;j<cols;j++){
      const s = -L/2 + L*j/NX;
      if (Math.abs(s) <= Wv/2){ const u = Wv > 1 ? s/(Wv/2) : 0; p.set(s, 0, 1.2*Math.sin(s*.045 + 1) + .8*Math.cos(s*.09) + (1 - u*u)*Math.min(14, W*.05)); n.set(-u*.12, 0, 1).normalize(); }
      else { const ew = Math.abs(s) - Wv/2, phi = phiAt(R, ew), r = R - b*phi/(2*Math.PI), sg2 = s > 0 ? 1 : -1; p.set(sg2*(Wv/2 + r*Math.sin(phi)), 0, R - r*Math.cos(phi)); n.set(-sg2*Math.sin(phi), 0, Math.cos(phi)); }
      const top = H/2 - tear[j], bot = -H/2 + tearB[j], edgeDist = Math.abs(s) <= Wv/2 ? 1 : 0;
      for (let i=0;i<rows;i++){
        const k2 = j*rows + i, y = bot + (top - bot)*i/NY, wr = (hash2(Math.floor(s/26), Math.floor(y/22), seed + 3) - .5)*2.6 + Math.sin(s*.11 + y*.07 + seed)*.9 + Math.sin(y*.21 - s*.03)*.6, wob = Math.sin(y*.08 + s*.02)*.7 + (Math.abs(s) <= Wv/2 ? wr : 0);
        F[k2*3] = p.x + n.x*wob; F[k2*3 + 1] = y; F[k2*3 + 2] = p.z + n.z*wob;
        B[k2*3] = F[k2*3] - n.x*th; B[k2*3 + 1] = y; B[k2*3 + 2] = F[k2*3 + 2] - n.z*th;
        const edgeY = Math.min(i, NY - i)/NY, dirt = .72 + .28*Math.min(1, edgeY*3.2) - (hash2(j, i, seed + 9) < .06 ? .12 : 0);
        const endD = Math.min(1, (L/2 - Math.abs(s))/60), inRoll = Math.abs(s) > Wv/2 ? .8 : 1; const c = dirt*(.82 + .18*endD)*inRoll;
        colF[k2*3] = c; colF[k2*3 + 1] = c*.97; colF[k2*3 + 2] = c*.92;
      }
      const tk = j*rows + NY, bk = j*rows, o = j*4*3;
      E.set([F[tk*3], F[tk*3 + 1], F[tk*3 + 2], B[tk*3], B[tk*3 + 1], B[tk*3 + 2], F[bk*3], F[bk*3 + 1], F[bk*3 + 2], B[bk*3], B[bk*3 + 1], B[bk*3 + 2]], o);
    }
    [front, back, edge].forEach(G2 => { G2.attributes.position.needsUpdate = true; G2.computeVertexNormals(); });
    front.attributes.color.needsUpdate = true;
    g.userData.R = R; g.userData.Wv = Wv;
  };
  g.userData.update(0);
  return g;
}
// a parchment drawn behind an HTML panel: canvas + content box, slow smooth unroll
function parchPanel(el, W, H, onTick){
  if (!miniInit()) return null;
  let cv = el.querySelector('canvas.pp3'); if (!cv){ cv = document.createElement('canvas'); cv.className = 'pp3'; el.prepend(cv); }
  const v = miniView(cv, { w: W + 70, h: H + 30, ortho: true, res: 1, fps: 60, tick: (dt, t) => { st.k = clamp(st.k + st.dir*dt/(st.dir > 0 ? 1.1 : .7), 0, 1); const e = st.k < .5 ? 4*st.k*st.k*st.k : 1 - Math.pow(-2*st.k + 2, 3)/2; P.userData.update(e); el.style.setProperty('--open', e); onTick && onTick(e, dt, t); } });
  const P = parchment3D(W, H, { seed: (W + H) % 13 }); P.rotation.x = -.12; v.sc.add(P);
  const st = { k: 0, dir: 1 }; v.st = st; v.P = P;
  return v;
}

function ensureParchPanel(panel){
  const W = Math.min(400, innerWidth - 90), H = Math.round(Math.min(440, innerHeight*.62));
  if (!panel.querySelector('.pcontent') || panel.dataset.w != W || panel.dataset.h != H){
    panel.innerHTML = '<canvas class="pp3"></canvas><div class="pcontent"></div>'; panel.dataset.w = W; panel.dataset.h = H;
    panel.style.width = (W + 70) + 'px'; panel.style.height = (H + 30) + 'px'; panel._v = null;
  }
  if (!panel._v){ panel._v = parchPanel(panel, W, H); }
  return panel.querySelector('.pcontent');
}
function openParchPanel(panel){ ensureParchPanel(panel); panel.classList.add('show'); if (panel._v){ panel._v.st.k = 0; panel._v.st.dir = 1; } SFX.scroll?.(); }
function closeParchPanel(panel){ if (!panel.classList.contains('show') || panel.dataset.closing) return; panel.dataset.closing = 1; if (panel._v) panel._v.st.dir = -1; setTimeout(() => { panel.classList.remove('show'); delete panel.dataset.closing; }, 720); }
