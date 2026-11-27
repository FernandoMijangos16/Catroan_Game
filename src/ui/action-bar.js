// ================= ACTION BAR: connected 3D hexagonal tokens =================
const HB = { tokens: [], hover: null, t: 0, tradeI: 0, tradeT: 0 };
const CARD_COST = { lana: 1, trigo: 1, mineral: 1 };
function pipTex(n){
  const s = 16, spots = { 1: [[8, 8]], 2: [[4, 4], [12, 12]], 3: [[4, 4], [8, 8], [12, 12]], 4: [[4, 4], [12, 4], [4, 12], [12, 12]], 5: [[4, 4], [12, 4], [8, 8], [4, 12], [12, 12]], 6: [[4, 4], [12, 4], [4, 8], [12, 8], [4, 12], [12, 12]] }[n];
  return pxTex(s, s, c => {
    c.fillStyle = '#f2ead8'; c.fillRect(0, 0, s, s); c.fillStyle = '#ffffff'; c.fillRect(0, 0, s, 1); c.fillRect(0, 0, 1, s); c.fillStyle = '#c9bea6'; c.fillRect(0, s - 1, s, 1); c.fillRect(s - 1, 0, 1, s);
    spots.forEach(([x, y]) => { c.fillStyle = n === 1 ? '#b8322a' : '#1d1814'; c.fillRect(x - 2, y - 1, 3, 3); c.fillRect(x - 1, y - 2, 1, 5); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x - 2, y - 1, 1, 1); });
  });
}
let DIE_MATS = null;
// box face order +x,-x,+y,-y,+z,-z  →  3,4,1,6,2,5 (opposites add up to 7)
const DIE_FACE = [3, 4, 1, 6, 2, 5], DIE_NORMAL = { 1: [0, 1, 0], 6: [0, -1, 0], 3: [1, 0, 0], 4: [-1, 0, 0], 2: [0, 0, 1], 5: [0, 0, -1] };
function makeDie(){
  itemAssets();
  if (!DIE_MATS) DIE_MATS = DIE_FACE.map(n => keepMat(new THREE.MeshStandardMaterial({ map: pipTex(n), roughness: .6 })));
  const m = new THREE.Mesh(PGEO.rbox, DIE_MATS); m.castShadow = true; m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m); outlineItem(g); return g;
}
function textSprite(txt, size = 64, col = '#f6e7c1'){
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64; const c = cv.getContext('2d');
  c.font = `700 ${size*.7}px 'Pixelify Sans', Inter, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 8; c.strokeStyle = '#1a0f06'; c.strokeText(txt, 64, 34); c.fillStyle = col; c.fillText(txt, 64, 34);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); sp.scale.set(.8, .4, 1); return sp;
}
function initHexbar(){
  const wrap = document.createElement('div'); wrap.id = 'hexbar';
  wrap.innerHTML = '<div id="hb-status"><b></b><span></span></div><canvas></canvas><div id="hb-tip" class="panel"></div>';
  document.body.appendChild(wrap);
  const end = document.createElement('button'); end.id = 'b-endturn';
  end.innerHTML = '<svg viewBox="0 0 12 16" width="18" height="24" shape-rendering="crispEdges"><path fill="#2a1a0c" d="M1 0h10v2H1zM1 14h10v2H1z"/><path fill="#e9c46a" d="M2 2h8v1H2zM3 3h6v2H3zM4 5h4v2H4zM5 7h2v2H5zM4 9h4v2H4zM3 11h6v2H3zM2 13h8v1H2z"/><path fill="#f6e7c1" d="M4 3h4v1H4zM5 10h2v1H5zM4 11h4v2H4z"/></svg><span>Terminar turno</span>';
  document.body.appendChild(end);
  end.onclick = () => { if (!tutAllow('fin')) return; if (G && G.current === 0 && G.phase === 'main'){ SFX.click?.(); endTurn(); } };
  HB.end = end;
  const cv = wrap.querySelector('canvas');
  let r; try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch { return; }
  r.setPixelRatio(Math.min(devicePixelRatio, 2)); r.outputColorSpace = THREE.SRGBColorSpace; r.shadowMap.enabled = true;
  const sc = new THREE.Scene();
  sc.add(new THREE.HemisphereLight(0xfff4e0, 0x3a2a1a, 1.7));
  const dl = new THREE.DirectionalLight(0xfff0d8, 2.4); dl.position.set(-3, 8, 5); dl.castShadow = true; dl.shadow.mapSize.set(1024, 1024); Object.assign(dl.shadow.camera, { left: -7, right: 7, top: 4, bottom: -4 }); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(24, 4, .1, 80);
  Object.assign(HB, { r, sc, cam, cv, wrap, end });
  const brassTex = pxTex(32, 32, (c, w) => { c.fillStyle = '#a8823a'; c.fillRect(0, 0, w, w); const R = mulberry32(9); for (let i=0;i<120;i++){ c.fillStyle = pick(['#8e6a2c', '#bf9a4a', '#7a5a24', '#d8b860', '#6e7a4a'], R); c.fillRect(Math.floor(R()*w), Math.floor(R()*w), 1 + Math.floor(R()*2), 1); } c.fillStyle = '#e8cc78'; c.fillRect(0, 0, w, 1); });
  const brass = keepMat(new THREE.MeshStandardMaterial({ map: brassTex, metalness: .55, roughness: .45, flatShading: true, envMap: IT.env, envMapIntensity: .7 }));
  const groove = keepMat(new THREE.MeshStandardMaterial({ color: 0x3e2a10, roughness: .8, flatShading: true }));
  const plates = { dados: '#6e2230', construir: '#d8c8a2', carta: '#4a3560', comercio: '#4f5e34' };
  const LABEL = { dados: 'Dados', pueblo: 'Pueblo', camino: 'Camino', ciudad: 'Ciudad', carta: 'Carta', comercio: 'Comerciar' };
  const defs = [
    { k: 'dados', R: 1.15, plate: 'dados' }, { k: 'pueblo', R: .8, plate: 'construir' }, { k: 'camino', R: .8, plate: 'construir' },
    { k: 'ciudad', R: .8, plate: 'construir' }, { k: 'carta', R: .8, plate: 'carta' }, { k: 'comercio', R: .8, plate: 'comercio' },
  ];
  let x = 0; const gap = .04;
  defs.forEach((d, i) => { if (i) x += (defs[i - 1].R + d.R)*SQ3/2 + gap; d.x = x; });
  const mid = (defs[0].x - defs[0].R*SQ3/2 + defs[defs.length - 1].x + defs[defs.length - 1].R*SQ3/2)/2;
  HB.width = defs[defs.length - 1].x + defs[defs.length - 1].R*SQ3/2 - (defs[0].x - defs[0].R*SQ3/2);
  HB.redraw = [];
  defs.forEach(d => {
    const g = new THREE.Group(); g.position.set(d.x - mid, 0, 0); sc.add(g);
    const body = new THREE.Mesh(sg(new THREE.CylinderGeometry(d.R, d.R, .12, 6)), brass); body.position.y = .06; body.castShadow = true; body.receiveShadow = true; g.add(body);
    const gr = new THREE.Mesh(sg(new THREE.CylinderGeometry(d.R*.885, d.R*.885, .006, 6)), groove); gr.position.y = .123; g.add(gr);
    // plate: hexagon with cloth/parchment pixel texture and the name engraved near the front edge
    const cvp = document.createElement('canvas'); cvp.width = cvp.height = 96;
    const tex = new THREE.CanvasTexture(cvp); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearMipmapLinearFilter;
    const draw = () => {
      const c = cvp.getContext('2d'), base = new THREE.Color(plates[d.plate]), light = d.plate === 'construir', R = mulberry32(d.k.length*13);
      c.fillStyle = plates[d.plate]; c.fillRect(0, 0, 96, 96);
      for (let y=0;y<96;y+=2){ c.fillStyle = '#' + base.clone().multiplyScalar(light ? .97 : 1.08).getHexString(); c.fillRect(0, y, 96, 1); }
      for (let i=0;i<260;i++){ c.fillStyle = '#' + base.clone().multiplyScalar(.82 + R()*.36).getHexString(); c.fillRect(Math.floor(R()*96), Math.floor(R()*96), 1 + Math.floor(R()*2), 1); }
      if (light) for (let i=0;i<6;i++){ c.fillStyle = 'rgba(120,80,30,.08)'; c.beginPath(); c.arc(R()*96, R()*96, 6 + R()*14, 0, 7); c.fill(); }
      c.strokeStyle = light ? 'rgba(90,60,30,.55)' : 'rgba(232,200,120,.55)'; c.lineWidth = 2; c.setLineDash([3, 2]); c.beginPath();
      for (let k=0;k<6;k++){ const th = k*Math.PI/3, px = 48 + Math.sin(th)*40, py = 48 + Math.cos(th)*44; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.stroke(); c.setLineDash([]);
      c.font = `700 ${LABEL[d.k].length > 7 ? 11 : 13}px 'Pixelify Sans', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (light){ c.fillStyle = '#fff3d8'; c.fillText(LABEL[d.k], 48, 79); c.fillStyle = '#4a2e18'; c.fillText(LABEL[d.k], 48, 78); }
      else { c.fillStyle = '#1a0f06'; c.fillText(LABEL[d.k], 48, 79); c.fillStyle = '#e8c878'; c.fillText(LABEL[d.k], 48, 78); }
      tex.needsUpdate = true;
    };
    draw(); HB.redraw.push(draw);
    const shape = new THREE.Shape(); for (let k=0;k<6;k++){ const th = k*Math.PI/3, px = Math.sin(th)*d.R*.86, py = -Math.cos(th)*d.R*.86; k ? shape.lineTo(px, py) : shape.moveTo(px, py); }
    const pg = new THREE.ShapeGeometry(shape), pp = pg.attributes.position, uv = pg.attributes.uv;
    for (let i=0;i<pp.count;i++) uv.setXY(i, pp.getX(i)/(2*d.R*.86) + .5, pp.getY(i)/(2*d.R*.86) + .5);
    pg.rotateX(-Math.PI/2);
    const pm = keepMat(new THREE.MeshStandardMaterial({ map: tex, roughness: .95 }));
    const plate = new THREE.Mesh(pg, pm); plate.position.y = .127; plate.receiveShadow = true; g.add(plate);
    outlineItem(body);
    const model = new THREE.Group(); model.position.set(0, .13, -d.R*.12); g.add(model);
    const T = { ...d, g, model, plate, pm, body, lift: 0, enabled: true, items: [] };
    buildTokenModel(T);
    T.mats = []; g.traverse(o => { if (o.isMesh && !o.userData.outline && o.material && !Array.isArray(o.material) && o.material.color){ o.material = o.material.clone(); T.mats.push([o.material, o.material.color.clone()]); } else if (o.isMesh && Array.isArray(o.material)){ o.material = o.material.map(m => m.clone()); o.material.forEach(m => m.color && T.mats.push([m, m.color.clone()])); } });
    T.brass = body.material;
    g.traverse(o => { if (o.isMesh) o.userData.tok = d.k; });
    HB.tokens.push(T);
  });
  (document.fonts?.ready || Promise.resolve()).then(() => HB.redraw.forEach(f => f()));
  const resize = () => {
    const w = Math.min(innerWidth - 24, 700), h = Math.round(w*.3);
    cv.style.width = w + 'px'; cv.style.height = h + 'px'; r.setSize(w, h, false); document.documentElement.style.setProperty('--hbh', (h + 30) + 'px');
    cam.aspect = w/h; const fit = (HB.width + .7)/(2*Math.tan(THREE.MathUtils.degToRad(cam.fov/2))*cam.aspect);
    cam.position.set(0, fit*.955, fit*.3); cam.lookAt(0, 0, -.05); cam.updateProjectionMatrix();
  };
  resize(); addEventListener('resize', resize);
  const ray2 = new THREE.Raycaster(), v2 = new THREE.Vector2();
  const pickTok = e => { const rc = cv.getBoundingClientRect(); v2.set((e.clientX - rc.left)/rc.width*2 - 1, -(e.clientY - rc.top)/rc.height*2 + 1); ray2.setFromCamera(v2, cam); const hit = ray2.intersectObjects(HB.tokens.map(t => t.g), true)[0]; return hit ? HB.tokens.find(t => t.k === hit.object.userData.tok) : null; };
  cv.addEventListener('pointermove', e => { const t = pickTok(e); if (t !== HB.hover){ HB.hover = t; hbTip(t, e); } else if (t) hbTipPos(e); cv.style.cursor = t && t.enabled ? 'pointer' : 'default'; });
  cv.addEventListener('pointerleave', () => { HB.hover = null; hbTip(null); });
  cv.addEventListener('click', e => { const t = pickTok(e); if (!t || !t.enabled) { if (t) SFX.click?.(); return; } t.press = 1; SFX.click?.(); hbAction(t.k); });
}
function fitModel(o, size){ o.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(o), sz = b.getSize(new THREE.Vector3()), k = size/Math.max(sz.x, sz.z, .001); o.scale.multiplyScalar(k); }
function buildTokenModel(T){
  const m = T.model;
  switch (T.k){
    case 'dados': { [[-.34, 3], [.34, 5]].forEach(([x, n], i) => { const d = makeDie(); d.scale.setScalar(.42); d.position.set(x, .32, 0); d.userData.spin = i; m.add(d); T.items.push(d); }); break; }
    case 'pueblo': { const v = boardVillage(0, false, 2, 5); outlineItem(v); fitModel(v, T.R*1.3); m.add(v); break; }
    case 'ciudad': { const v = boardVillage(0, true, 2, 9); outlineItem(v); fitModel(v, T.R*1.3); m.add(v); break; }
    case 'camino': { const rd = fencedRoad(0, { x: -.5, z: 0 }, { x: .5, z: 0 }); rd.position.set(0, 0, 0); rd.rotation.y = .5; const w = new THREE.Group(); w.add(rd); outlineItem(w); fitModel(w, T.R*1.15); m.add(w); break; }
    case 'carta': { [[-.15, -.22], [.15, .22]].forEach(([x, r], j) => { const c = cardMesh(); c.position.set(x, .3, j*.04 - .02); c.scale.setScalar(.72); c.userData.r = r; m.add(c); T.items.push(c); }); break; }
    case 'comercio': {
      T.left = RES.map(k => { const it = makeResourceItem(k); it.scale.setScalar(.9); it.position.set(-.34, .05, .05); it.visible = false; m.add(it); return it; });
      T.right = RES.map(k => { const it = makeResourceItem(k); it.scale.setScalar(.9); it.position.set(.36, .05, .05); it.visible = false; m.add(it); return it; });
      const x4 = textSprite('x4'); x4.position.set(-.34, .62, -.25); x4.scale.set(.6, .3, 1); m.add(x4);
      const eq = textSprite('='); eq.position.set(.01, .3, 0); eq.scale.set(.6, .3, 1); m.add(eq);
      break; }
  }
}
function hbAction(k){
  if (!G || !tutAllow(k)) return;
  switch (k){
    case 'dados': if (G.current === 0 && G.phase === 'roll') rollDice(); break;
    case 'camino': enterBuild('camino'); break;
    case 'pueblo': enterBuild('pueblo'); break;
    case 'ciudad': enterBuild('ciudad'); break;
    case 'carta': buyCard(0); break;
    case 'comercio': if (G.current !== 0) tradeLetter(G.current); else if (!scenesOn()) openTrade('banco'); else enterMarket('trade'); break;
  }
}
const HB_INFO = {
  dados: ['Tirar dados', 'Lanza los dados al tablero para producir recursos.', null],
  camino: ['Camino', 'Une tus pueblos: los pueblos conectados crecen.', COST.camino],
  pueblo: ['Pueblo', '1 punto de victoria. Produce de los terrenos que toca.', COST.pueblo],
  ciudad: ['Ciudad', 'Mejora un pueblo: 2 puntos y produce el doble.', COST.ciudad],
  carta: ['Carta de desarrollo', 'Compra una carta al azar del mazo.', CARD_COST],
  comercio: ['Comerciar', 'Cambia 4 iguales por 1 en el comercio (mejor en tus puertos). Para cambiar con jugadores toca su letrero.', null],
};
function hbTip(t, e){
  const tip = $('#hb-tip');
  if (!t){ tip.style.display = 'none'; INV.setNeeds?.(null); return; }
  const [name, desc, cost0] = HB_INFO[t.k], cost = COST[t.k] ? costFor(0, t.k) : cost0;
  let extra = '';
  if (t.k === 'carta' && G) extra = `<div class="muted" style="margin-top:4px">Quedan ${G.deck.length} cartas en el mazo</div>`;
  tip.innerHTML = `<b>${name}</b><div class="muted">${desc}</div>${cost ? `<div class="hb-cost">${Object.entries(cost).map(([r, n]) => `<span class="${invShown(r) >= n ? 'ok' : 'no'}">${resImg(r)}×${n}</span>`).join('')}</div>` : ''}${extra}${!t.enabled ? `<div class="hb-why">${hbWhy(t.k)}</div>` : ''}`;
  tip.style.display = 'block'; hbTipPos(e);
  INV.setNeeds?.(cost);
}
function hbTipPos(e){ const tip = $('#hb-tip'), w = tip.offsetWidth; tip.style.left = clamp(e.clientX - w/2, 8, innerWidth - w - 8) + 'px'; tip.style.bottom = (innerHeight - HB.cv.getBoundingClientRect().top + 8) + 'px'; }
function hbWhy(k){
  if (!G || G.over) return 'La partida terminó';
  if (G.current !== 0) return 'Espera tu turno';
  if (G.phase === 'rolling') return 'Los dados están rodando…';
  if (k === 'dados') return 'Ya tiraste los dados este turno';
  if (G.phase === 'roll') return 'Primero tira los dados';
  if (G.phase === 'robber') return 'Primero mueve al ladrón';
  if (k === 'carta' && !G.deck.length) return 'Ya no quedan cartas';
  return 'Te faltan recursos o no hay lugar disponible';
}
function updateHexbar(){
  updateTrophies();
  if (!G) return;
  const my = G.current === 0 && !G.over, main = my && G.phase === 'main';
  // "Terminar turno" also works from the village, where the hex tokens may not be built yet
  if (HB.end){ HB.end.disabled = !main; HB.end.classList.toggle('ready', main); }
  if (!HB.tokens.length) return;
  const en = {
    dados: my && G.phase === 'roll',
    camino: !$('#b-road').disabled || (main && G.freeRoads > 0), pueblo: !$('#b-set').disabled, ciudad: !$('#b-city').disabled,
    carta: main && afford(0, CARD_COST) && G.deck.length > 0, comercio: !$('#b-trade').disabled || (G.current !== 0 && !G.over && G.tradeOpen === G.turnId),
  };
  HB.tokens.forEach(T => {
    T.enabled = en[T.k]; T.active = G.buildMode === T.k;
    T.mats.forEach(([m, c]) => m.color.copy(c).multiplyScalar(T.enabled ? 1 : .42));
  });
  const st = $('#hb-status');
  st.querySelector('b').textContent = $('#turn-label').textContent;
  st.querySelector('span').textContent = G.phase === 'robber' && my ? 'Toca un terreno para mandar al ladrón' : G.buildMode ? 'Toca un lugar marcado en el tablero · Esc para cancelar' : '';
  if (HB.hover) hbTip(HB.hover, { clientX: parseFloat($('#hb-tip').style.left || 0) + $('#hb-tip').offsetWidth/2 });
}
function stepHexbar(dt){
  if (!HB.r || mode !== 'board' || !G) return;
  HB.t += dt;
  HB.tokens.forEach((T, i) => {
    const shine = TUT.glow === T.k;   // the tutorial points at this token
    const want = (shine ? .08 + Math.sin(HB.t*6)*.05 : 0) + (T === HB.hover && T.enabled ? .09 : 0) + (T.active ? .07 : 0) + (T.press > 0 ? -.05*Math.sin(T.press*Math.PI) : 0);
    T.lift += (want - T.lift)*Math.min(1, dt*10); T.press = Math.max(0, (T.press || 0) - dt*3);
    T.g.position.y = T.lift; if (T.brass) T.brass.emissive.setHex(shine ? (Math.sin(HB.t*6) > 0 ? 0x6a4810 : 0x3a2808) : T === HB.hover && T.enabled || T.active ? 0x3a2808 : 0);
    const sp = T.enabled ? 1 : .35;
    if (T.k === 'dados') T.items.forEach((d, j) => { d.rotation.x += dt*(.5 + j*.15)*sp; d.rotation.y += dt*(.7 - j*.2)*sp; d.rotation.z = .42; d.position.y = .32 + Math.sin(HB.t*1.6 + j*2)*.04; });
    else if (T.k === 'carta') T.items.forEach((c, j) => { c.rotation.set(-1.1, Math.sin(HB.t*.9*sp + j*2)*.35, c.userData.r + Math.sin(HB.t*1.1 + j)*.08); c.position.y = .3 + Math.sin(HB.t*1.4 + j*1.5)*.04; });
    else if (T.k === 'comercio'){
      HB.tradeT += dt; if (HB.tradeT > 1.3){ HB.tradeT = 0; HB.tradeI = (HB.tradeI + 1) % RES.length; }
      const li = HB.tradeI, ri = (HB.tradeI + 2) % RES.length;
      T.left.forEach((it, j) => { it.visible = j === li; it.rotation.y += dt*1.2*sp; it.rotation.z = .4; }); T.right.forEach((it, j) => { it.visible = j === ri; it.rotation.y -= dt*1.2*sp; it.rotation.z = -.4; });
      const pop = Math.min(1, HB.tradeT/.25); T.left[li].scale.setScalar(.9*(.6 + .4*pop)); T.right[ri].scale.setScalar(.9*(.6 + .4*pop));
    } else T.model.rotation.y = Math.sin(HB.t*.6 + i)*.35 + (T === HB.hover ? HB.t*1.5 % 6.28 : 0)*0;
  });
  HB.r.render(HB.sc, HB.cam);
}
// ---------- 3D dice thrown onto the board ----------
const DICE3D = [];
function boardSurfaceH(x, z){ let best = null, bd = 9; for (const t of G.tiles){ const d = Math.hypot(x - t.x, z - t.z); if (d < bd){ bd = d; best = t; } } return bd < 1 ? .2 + tileHeight(best, x - best.x, z - best.z) : .2; }
function throwDice(d1, d2, done){
  DICE3D.forEach(o => boardScene.remove(o.g)); DICE3D.length = 0;
  const tgt = controls.target, cdir = new THREE.Vector3().subVectors(camera.position, tgt).setY(0).normalize(), side = new THREE.Vector3(-cdir.z, 0, cdir.x);
  const land = tgt.clone().addScaledVector(cdir, .6);
  [d1, d2].forEach((v, i) => {
    const g = makeDie(); g.scale.setScalar(.36); boardScene.add(g);
    const ex = land.x + side.x*(i ? .28 : -.28) + (Math.random() - .5)*.1, ez = land.z + side.z*(i ? .28 : -.28) + (Math.random() - .5)*.1;
    const sx = ex + cdir.x*2.4 + side.x*(i ? .4 : -.4), sz = ez + cdir.z*2.4 + side.z*(i ? .4 : -.4);
    const n = DIE_NORMAL[v], qf = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(...n), new THREE.Vector3(0, 1, 0));
    qf.premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random()*6.28));
    const ax = new THREE.Vector3(Math.random() - .5, Math.random() - .5, Math.random() - .5).normalize();
    DICE3D.push({ g, sx, sz, ex, ez, h: boardSurfaceH(ex, ez) + .18, qf, ax, w: 16 + Math.random()*8, t: -i*.06, bounced: 0, v });
  });
  SFX.dice();
  DICE3D.done = done; DICE3D.landed = false; DICE3D.hold = 0;
}
function stepDice(dt){
  if (!DICE3D.length) return;
  const T = 1.9; let all = true;
  DICE3D.forEach(d => {
    d.t += dt; const k = clamp(d.t/T, 0, 1); if (k < 1) all = false;
    const e = 1 - Math.pow(1 - k, 2.2);
    const x = d.sx + (d.ex - d.sx)*e, z = d.sz + (d.ez - d.sz)*e;
    const bounce = Math.abs(Math.cos(k*Math.PI*2.6))*1.3*Math.pow(1 - k, 1.8);
    d.g.position.set(x, d.h + bounce, z);
    const nb = Math.floor(k*2.6 + .5); if (nb > d.bounced && k < .95){ d.bounced = nb; SFX.clack?.(1 - k); }
    const spinQ = new THREE.Quaternion().setFromAxisAngle(d.ax, d.w*(1 - Math.pow(1 - k, 2))*.9);
    d.g.quaternion.copy(spinQ).slerp(d.qf, smoothstep(.62, 1, k));
  });
  if (all && !DICE3D.landed){
    DICE3D.landed = true; DICE3D.hold = 0;
    const sum = DICE3D[0].v + DICE3D[1].v, lbl = textSprite(String(sum), 64, sum === 7 ? '#ff6a5a' : '#f6e7c1');
    const c = DICE3D[0].g.position.clone().add(DICE3D[1].g.position).multiplyScalar(.5); lbl.position.set(c.x, c.y + .42, c.z); lbl.scale.set(.6, .3, 1); boardScene.add(lbl); DICE3D.label = lbl;
    const f = DICE3D.done; DICE3D.done = null; f && f();
  }
  if (DICE3D.landed){
    DICE3D.hold += dt;
    if (DICE3D.label) DICE3D.label.position.y += dt*.05;
    if (DICE3D.hold > 3.4){ const s = Math.max(0, 1 - (DICE3D.hold - 3.4)/.4); DICE3D.forEach(d => d.g.scale.setScalar(.36*s + .0001)); if (DICE3D.label) DICE3D.label.material.opacity = s;
      if (s <= 0){ DICE3D.forEach(d => boardScene.remove(d.g)); if (DICE3D.label){ boardScene.remove(DICE3D.label); DICE3D.label = null; } DICE3D.length = 0; } }
  }
}

