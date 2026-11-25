// ================= 3D TRADE OFFER: parchment, quill, spinning items, ink choices and a wax stamp =================
// a rival's offer: the letter lies in front of you with two stamps beside it; the room behind dims (no office scene)
function offerLetterCanvas(P, give, want){
  const W = 230, H = 296, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'), R = mulberry32(P.name.length*31 + 7);
  c.fillStyle = '#e8d6ae'; c.fillRect(0, 0, W, H);
  for (let i=0;i<900;i++){ c.fillStyle = pick(['#dcc596', '#efdfba', '#d2bb8a', '#e9d8b0', '#c9ae7c'], R); c.fillRect(Math.floor(R()*W), Math.floor(R()*H), 1 + Math.floor(R()*3), 1); }
  for (let i=0;i<5;i++){ c.fillStyle = 'rgba(120,80,30,.07)'; c.beginPath(); c.arc(R()*W, R()*H, 10 + R()*30, 0, 7); c.fill(); }
  c.fillStyle = 'rgba(90,60,25,.35)'; c.fillRect(0, 0, W, 2); c.fillRect(0, H - 2, W, 2); c.fillRect(0, 0, 2, H); c.fillRect(W - 2, 0, 2, H);
  c.fillStyle = '#2a180a'; c.font = "700 13px 'Pixelify Sans', monospace"; c.textBaseline = 'middle';
  c.fillText(`Estimado ${mayorName()}:`, 14, 22); c.font = "600 12px 'Pixelify Sans', monospace";
  c.fillText('Le ofrezco:', 14, 46); c.fillText('A cambio de:', 14, 136);
  const box = (y, list) => list.forEach(([k, n], i) => { const x = 40 + i*52; c.strokeStyle = 'rgba(60,36,16,.5)'; c.setLineDash([3, 2]); c.strokeRect(x - 20, y - 22, 40, 40); c.setLineDash([]); c.fillStyle = '#2a180a'; c.font = "900 12px Verdana, sans-serif"; c.textAlign = 'center'; c.fillText(n > 1 ? '×' + n : '', x + 14, y + 22); c.textAlign = 'left'; });
  box(84, give); box(174, want);
  c.font = "600 12px 'Pixelify Sans', monospace"; c.fillStyle = '#2a180a'; c.fillText('Atentamente,', 14, 232);
  c.font = "italic 700 17px 'Pixelify Sans', monospace"; c.fillStyle = '#' + new THREE.Color(P.color).multiplyScalar(.6).getHexString(); c.fillText(P.name, 26, 258);
  return cv;
}
function offerToHuman(q, botGives, botWants){
  return new Promise(res => {
    const P = G.players[q], ov = $('#offer');
    const can = [...RES, ...SPK].every(r => (botWants[r] || 0) <= haveOf(0, r));
    const gl = Object.entries(botGives).filter(([, n]) => n > 0), wl = Object.entries(botWants).filter(([, n]) => n > 0);
    ov.innerHTML = `<div class="obox2"><canvas></canvas><div class="ohint">Sella con <b>SÍ</b> para aceptar o con <b>NO</b> para rechazar${can ? '' : '<br><span>No tienes lo que te pide: solo puedes rechazar</span>'}</div></div>`;
    ov.classList.add('show'); SFX.scroll?.(); SFX.ding?.();
    const cvs = ov.querySelector('canvas'), W = 620, H = 420;
    const finish = ok => { setTimeout(() => { ov.classList.remove('show'); ov.onclick = null; ov.onpointermove = null; if (v) v.alive = false; res(ok); }, 700); };
    if (!miniInit()){ ov.onclick = () => { ov.classList.remove('show'); res(false); }; return; }
    const S = { t: 0, pick: null, pt: 0, hover: null };
    const v = miniView(cvs, { w: W, h: H, res: 1, fov: 38, fps: 60, tick: (dt, t) => step(dt, t) });
    v.cam.position.set(0, .9, .62); v.cam.lookAt(0, 0, .03);
    const prevOL = OUTLINE_OFF; OUTLINE_OFF = true;
    const L = { W: .46, H: .593 }, tex = new THREE.CanvasTexture(offerLetterCanvas(P, gl, wl)); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
    const desk = new THREE.Mesh(sg(new THREE.PlaneGeometry(3, 3)), keepMat(new THREE.MeshStandardMaterial({ color: 0x1a120c, transparent: true, opacity: 0 }))); desk.rotation.x = -Math.PI/2; v.sc.add(desk);
    const paper = new THREE.Mesh(sg(new THREE.BoxGeometry(L.W, .004, L.H)), [m3().paperSide, m3().paperSide, keepMat(new THREE.MeshStandardMaterial({ map: tex, roughness: 1 })), m3().paperSide, m3().paperSide, m3().paperSide]);
    const letter = new THREE.Group(); letter.add(paper); letter.position.set(0, 0, .02); letter.rotation.y = .03; v.sc.add(letter);
    const at = (px, py) => new THREE.Vector3((px/230 - .5)*L.W, .028, (py/296 - .5)*L.H);
    const items = [];
    gl.forEach(([k], i) => { const sp = spinner(itemOf(k), .07); sp.position.copy(at(40 + i*52, 84)); letter.add(sp); items.push(sp); });
    wl.forEach(([k], i) => { const sp = spinner(itemOf(k), .07); sp.position.copy(at(40 + i*52, 174)); letter.add(sp); items.push(sp); });
    const seal = waxSeal3D(P.color, false), sb = new THREE.Box3().setFromObject(seal).getSize(new THREE.Vector3()); seal.scale.setScalar(.06/Math.max(sb.x, sb.y, .0001)); seal.rotation.x = -Math.PI/2; seal.position.copy(at(188, 256)); seal.position.y = .006; letter.add(seal);
    // the two stamps and their ink pads
    const stamps = [[true, 0x2a7a3a, 'SÍ', .37], [false, 0xa82a2a, 'NO', -.37]].map(([ok, col, lab, x]) => {
      const off = ok && !can, home = new THREE.Vector3(x, .02, .04), pad = inkPadModel(off ? 0x5a5a5a : col); pad.position.set(x, 0, .04); v.sc.add(pad);
      const st = stampModel(off ? 0x6a6a6a : col, lab); st.scale.setScalar(1.15); st.position.copy(home); v.sc.add(st); st.traverse(m => { if (m.isMesh) m.userData.ok = ok; });
      return { ok, st, home, off, col }; });
    OUTLINE_OFF = prevOL;
    // the mark is the same one the office leaves on your own letters
    const decal = ok => { const cv2 = document.createElement('canvas'); cv2.width = 128; cv2.height = 48; stampMark(cv2.getContext('2d'), 64, 24, ok); const t2 = new THREE.CanvasTexture(cv2); t2.colorSpace = THREE.SRGBColorSpace; t2.magFilter = THREE.NearestFilter;
      const m = new THREE.Mesh(sg(new THREE.PlaneGeometry(1, 1)), keepMat(new THREE.MeshBasicMaterial({ map: t2, transparent: true, opacity: 0, depthWrite: false }))); m.rotation.x = -Math.PI/2; m.scale.set(.25, .094, 1); m.position.copy(at(158, 222)); m.position.y = .0045; letter.add(m); return m; };
    const target = () => { const p2 = at(150, 222).clone(); letter.localToWorld(p2); return p2; };
    function step(dt, t){
      S.t += dt; items.forEach(it => { it.userData.inner.rotation.y += dt*1.3; });
      stamps.forEach(s => { if (S.pick === s) return; const up = s === S.hover && !s.off ? .025 + Math.abs(Math.sin(t*5))*.008 : 0; s.st.position.y += (s.home.y + up - s.st.position.y)*Math.min(1, dt*10); });
      if (!S.pick) return;
      const s = S.pick, T = target(); S.pt += dt; const k = x => Math.min(1, Math.max(0, x)), e = x => x*x*(3 - 2*x);
      const above = T.clone().setY(.16), down = T.clone().setY(.008), k1 = e(k(S.pt/.4)), k2 = k((S.pt - .4)/.25), k3 = e(k((S.pt - .8)/.4));
      if (k3 <= 0){ s.st.position.lerpVectors(s.home, above, k1); if (k2 > 0) s.st.position.lerpVectors(above, down, Math.sin(Math.PI*k2)); s.st.rotation.z = -.2*k1; }
      else { s.st.position.lerpVectors(above, s.home, k3); s.st.rotation.z = -.2*(1 - k3); }
      if (k2 > .5 && !S.hit){ S.hit = true; S.mark.material.opacity = 1; SFX.stamp?.(); }
      if (S.pt > 1.25 && !S.done){ S.done = true; s.st.position.copy(s.home); s.st.rotation.z = 0; finish(s.ok); }
    }
    const ray3 = new THREE.Raycaster(), v3 = new THREE.Vector2();
    const pickAt = e => { const rc = cvs.getBoundingClientRect(); v3.set((e.clientX - rc.left)/rc.width*2 - 1, -(e.clientY - rc.top)/rc.height*2 + 1); ray3.setFromCamera(v3, v.cam); const h = ray3.intersectObjects(stamps.map(s => s.st), true)[0]; return h ? stamps.find(s => s.ok === h.object.userData.ok) : null; };
    ov.onpointermove = e => { if (S.pick) return; const s = pickAt(e); S.hover = s; cvs.style.cursor = s && !s.off ? 'pointer' : ''; };
    ov.onclick = e => { if (S.pick) return; const s = pickAt(e); if (!s) return; if (s.off){ SFX.click?.(); return; } S.pick = s; S.pt = 0; S.mark = decal(s.ok); SFX.click?.(); };
  });
}
