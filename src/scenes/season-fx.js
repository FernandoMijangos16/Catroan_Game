// ================= SEASON EVENTS, SEEN: the board and the first-person village change while an event lasts =================
// One effect at a time; it fades in (f: 0 → 1) when an event starts and out when it ends. The board's tiles are
// repainted through their vertex colors (snow, dry grass, wet earth), so everything keeps the game's flat pixel look.
const SEASON = { k: null, f: 0, fx: null, vfx: null, vctx: null, lights: null };
const smoothF = f => f*f*(3 - 2*f);
function seasonStep(dt, t){
  const want = G ? curEvent() : null;
  if (want !== SEASON.chip){ SEASON.chip = want; updEventChip(); }
  if (SEASON.k !== want){ SEASON.f = Math.max(0, SEASON.f - dt*.6); if (SEASON.f <= 0){ seasonDrop(); SEASON.k = want; } }
  else if (SEASON.k) SEASON.f = Math.min(1, SEASON.f + dt*.5);
  if (SEASON.k && boardScene && (!SEASON.fx || SEASON.fx.sc !== boardScene)){ if (SEASON.fx) SEASON.fx.drop(); SEASON.fx = seasonBoard(SEASON.k); }
  if (SEASON.k && villageCtx && SEASON.vctx !== villageCtx){ if (SEASON.vfx) SEASON.vfx.drop(); SEASON.vctx = villageCtx; SEASON.vfx = seasonVillage(SEASON.k, villageCtx); }
  if (!villageCtx && SEASON.vfx){ SEASON.vfx.drop(); SEASON.vfx = null; SEASON.vctx = null; }
  const e = smoothF(SEASON.f);
  if (SEASON.fx) SEASON.fx.step(dt, t, e);
  if (SEASON.vfx) SEASON.vfx.step(dt, t, e);
}
function seasonDrop(){ if (SEASON.fx){ SEASON.fx.drop(); SEASON.fx = null; } if (SEASON.vfx){ SEASON.vfx.drop(); SEASON.vfx = null; SEASON.vctx = null; } }
// ---------- shared particles: square pixels (rain streaks are short lines) ----------
function fxPoints(n, size, color, box, opacity = 1){
  const g = new THREE.BufferGeometry(), p = new Float32Array(n*3);
  for (let i=0;i<n;i++){ p[i*3] = (Math.random() - .5)*box[0]; p[i*3+1] = Math.random()*box[1]; p[i*3+2] = (Math.random() - .5)*box[2]; }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({ color, size, transparent: true, opacity: 0, depthWrite: false, sizeAttenuation: true }));
  m.userData.op = opacity; m.frustumCulled = false; return m;
}
function fxRain(n, box, len){
  const g = new THREE.BufferGeometry(), p = new Float32Array(n*6);
  for (let i=0;i<n;i++){ const x = (Math.random() - .5)*box[0], y = Math.random()*box[1], z = (Math.random() - .5)*box[2]; p.set([x, y, z, x - len*.15, y + len, z], i*6); }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const m = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0xa8c4dc, transparent: true, opacity: 0, depthWrite: false }));
  m.userData.op = .55; m.frustumCulled = false; return m;
}
// falling (rain, snow) or drifting (pollen, heat): moves every point and wraps it inside its box
function fxMove(m, dt, t, box, vy, drift = 0){
  const a = m.geometry.attributes.position, seg = m.isLineSegments ? 2 : 1, n = a.count/seg;
  for (let i=0;i<n;i++){
    let y = a.getY(i*seg) + vy*dt, x = a.getX(i*seg) + (drift ? Math.sin(t*.7 + i)*drift*dt : 0), z = a.getZ(i*seg) + (drift ? Math.cos(t*.5 + i*1.3)*drift*dt : 0);
    if (y < 0) y += box[1]; if (y > box[1]) y -= box[1];
    if (x < -box[0]/2) x += box[0]; if (x > box[0]/2) x -= box[0]; if (z < -box[2]/2) z += box[2]; if (z > box[2]/2) z -= box[2];
    a.setXYZ(i*seg, x, y, z); if (seg === 2) a.setXYZ(i*seg + 1, x - .06, y + (a.getY(i*seg + 1) - a.getY(i*seg)), z);
  }
  a.needsUpdate = true;
}
const fxFade = (m, e) => { m.material.opacity = (m.userData.op ?? 1)*e; m.visible = e > .01; };
// a small bee: striped body, two wings that flicker
function beeModel(){
  const g = new THREE.Group();
  g.add(mesh(GEO.sphere, 0xf2c23a, 0, 0, 0, .05, .04, .07)); g.add(mesh(GEO.box, 0x1a1208, 0, -.04, -.012, .1, .08, .025, false)); g.add(mesh(GEO.sphere, 0x1a1208, 0, .005, .065, .03, .03, .03));
  const wm = keepMat(new THREE.MeshBasicMaterial({ color: 0xeaf6ff, transparent: true, opacity: .7, side: THREE.DoubleSide }));
  g.userData.wings = [-1, 1].map(s => { const w = new THREE.Mesh(sg(new THREE.PlaneGeometry(.07, .045)), wm); w.position.set(s*.045, .04, 0); w.rotation.x = -Math.PI/2; g.add(w); return w; });
  return g;
}
// a market wagon of the fair: cart with a striped canvas, wheels, a horse in front and a merchant walking alongside
function fairWagon(rng){
  const g = new THREE.Group(), cart = new THREE.Group(); g.add(cart);
  cart.add(mesh(GEO.box, 0x7a5232, 0, .55, 0, 1.1, .35, 1.9));
  const canvas = keepMat(new THREE.MeshStandardMaterial({ map: stripeTex(pick(['#c0392b', '#2f6b8a', '#d9a520', '#6a3a8a'], rng), '#efe4c8'), roughness: .9, flatShading: true }));
  const cover = new THREE.Mesh(sg(new THREE.CylinderGeometry(.58, .58, 1.8, 8, 1, false, -Math.PI/2, Math.PI).rotateX(-Math.PI/2)), canvas); cover.position.y = .72; cart.add(cover);   // half barrel lying along the cart
  [[-1, -.6], [1, -.6], [-1, .6], [1, .6]].forEach(([sx, sz]) => { const w = mesh(GEO.cyl, 0x4a3020, sx*.58, .3, sz, .3, .08, .3); w.rotation.z = Math.PI/2; cart.add(w); });
  [[.25, 1.2, 0xd9a520], [-.2, 1.15, 0x8a3a2a]].forEach(([x, y, c]) => cart.add(mesh(GEO.box, c, x, y, -.7, .3, .25, .3)));   // crates on the back
  const H = horseModel(rng, 0x8a3a2a); H.g.position.set(0, 0, 1.9); g.add(H.g); g.userData.horse = H;
  const P = makePerson(rng, 'comerciante', rng() < .5 ? 'm' : 'f', '#7a6a5a'); P.g.position.set(.95, 0, .6); P.g.scale.setScalar(1.05); g.add(P.g); g.userData.walker = P;
  return g;
}
// ---------- the board ----------
function seasonBoard(k){
  const sc = boardScene, grp = new THREE.Group(); sc.add(grp);
  const tiles = []; tileGroups.forEach(g => { const t = G.tiles[g.userData.tile]; g.children.forEach(m => { const c = m.isMesh && m.geometry.attributes.color; if (c && m.material === LP_BOARD){ m.userData.baseCol ||= Float32Array.from(c.array); tiles.push({ m, t }); } }); });
  // the repaint: per vertex, from the tile's own color toward the season's
  const C = new THREE.Color(), D = new THREE.Color(), H = new THREE.Color();
  tiles.forEach(({ m, t }) => {
    const base = m.userData.baseCol, pos = m.geometry.attributes.position, out = new Float32Array(base.length);
    for (let i=0;i<pos.count;i++){
      C.setRGB(base[i*3], base[i*3+1], base[i*3+2]); const y = pos.getY(i), wx = t.x + pos.getX(i), wz = t.z + pos.getZ(i), n = hash2(Math.floor(wx*9), Math.floor(wz*9), 77);
      if (k === 'invierno'){ const snowy = t.type === 'montana' ? .55 + y*1.6 : t.type === 'bosque' ? .55 : t.type === 'desierto' ? .25 : .4; D.setHex(n > .5 ? 0xf4f7fb : 0xdde6ef); C.lerp(D, Math.min(.92, snowy*(.75 + n*.4))); }
      else if (k === 'sequia'){ if (t.type !== 'montana'){ const crack = hash2(Math.floor(wx*14), Math.floor(wz*14), 5) > .86; D.setHex(crack ? 0x6a4a28 : n > .5 ? 0xc9a85a : 0xb8964a); C.lerp(D, t.type === 'pradera' || t.type === 'campo' ? .78 : t.type === 'bosque' ? .35 : .5); } }
      else if (k === 'lluvia'){ C.multiplyScalar(.72); H.setHex(0x3a5a6a); C.lerp(H, .12); }
      else if (k === 'polen'){ if (t.type === 'pradera' || t.type === 'campo' || t.type === 'bosque'){ if (n > .9) C.setHex(pick([0xf7d046, 0xe85d75, 0xf2efe4, 0xc77ae8])); else C.lerp(D.setHex(0xa8e070), .25); } }
      out[i*3] = C.r; out[i*3+1] = C.g; out[i*3+2] = C.b;
    }
    m.userData.seasonCol = out;
  });
  const paint = e => tiles.forEach(({ m }) => { const a = m.geometry.attributes.color, b = m.userData.baseCol, s = m.userData.seasonCol; for (let i=0;i<a.array.length;i++) a.array[i] = b[i] + (s[i] - b[i])*e; a.needsUpdate = true; });
  // lights and clouds
  const lights = []; sc.traverse(o => { if (o.isHemisphereLight || o.isDirectionalLight) lights.push({ o, i: o.intensity, c: o.color.clone() }); });
  const clouds = []; sc.traverse(o => { if (o.userData.cloud) clouds.push({ m: o.userData.cloud, c: o.userData.cloud.color.clone(), e: o.userData.cloud.emissive.clone(), g: o }); });
  const LT = { lluvia: [.5, 0x9ab0c8], invierno: [.95, 0xe2ecff], sequia: [1.18, 0xffd48a], polen: [1.05, 0xfff0c0], feria: [1, 0xffffff] }[k];
  const box = [10, 3.2, 9], parts = [], step = [];   // only over the island, below the camera
  if (k === 'lluvia'){
    const r = fxRain(900, box, .1); r.userData.op = .45; grp.add(r); parts.push(r); step.push((dt, t) => fxMove(r, dt, t, box, -5.5));
    for (let i=0;i<16;i++){ const t = pick(G.tiles.filter(q => q.type !== 'montana')), a = Math.random()*6.28, d = Math.random()*.6, x = t.x + Math.cos(a)*d, z = t.z + Math.sin(a)*d;
      const p = new THREE.Mesh(sg(new THREE.CylinderGeometry(.11 + Math.random()*.08, .11, .006, 7)), keepMat(new THREE.MeshStandardMaterial({ color: 0x3a6a8a, roughness: .1, metalness: .3, transparent: true, opacity: 0, flatShading: true })));
      p.position.set(x, .2 + tileHeight(t, x - t.x, z - t.z) + .004, z); p.scale.z = .7; p.userData.op = .75; grp.add(p); parts.push(p); }
  } else if (k === 'invierno'){
    const s = fxPoints(600, .045, 0xffffff, box, .95); grp.add(s); parts.push(s); step.push((dt, t) => fxMove(s, dt, t, box, -.55, .25));
    // the sea freezes along the shore
    const IR = Math.max(...G.tiles.map(q => Math.hypot(q.x, q.z)));
    const ice = new THREE.Mesh(sg(new THREE.RingGeometry(IR + .85, IR + 1.75, 36, 2)),
      keepMat(new THREE.MeshStandardMaterial({ map: pxTex(16, 16, c => { for (let y=0;y<16;y++) for (let x=0;x<16;x++){ const h = hash2(x, y, 6); c.fillStyle = h < .3 ? 'rgba(0,0,0,0)' : hash2(x, y, 3) > .8 ? '#ffffff' : hash2(x, y, 4) > .5 ? '#dcecf4' : '#c8e0ec'; c.fillRect(x, y, 1, 1); } }), transparent: true, opacity: 0, alphaTest: .1, roughness: .3, flatShading: true })));   // broken ice: holes show the sea
    ice.material.map.repeat.set(6, 1); ice.material.map.wrapS = ice.material.map.wrapT = THREE.RepeatWrapping; ice.rotation.x = -Math.PI/2; ice.position.y = .02; ice.userData.op = .7; grp.add(ice); parts.push(ice);
    // chimney smoke over every village and city
    const smoke = fxPoints(1, .09, 0xd8d8d8, [0, 0, 0]); smoke.geometry.dispose(); const sp = []; G.verts.forEach(v => { if (v.building) for (let q=0;q<5;q++) sp.push(v.x + .04, .5 + q*.12, v.z - .03); });
    smoke.geometry = new THREE.BufferGeometry(); smoke.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sp.length ? sp : [0, -9, 0]), 3)); smoke.userData.op = .5; grp.add(smoke); parts.push(smoke);
    step.push((dt, t) => { const a = smoke.geometry.attributes.position; for (let i=0;i<a.count;i++){ let y = a.getY(i) + dt*.18; if (y > 1.1) y = .5; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t + i)*dt*.02); } a.needsUpdate = true; });
  } else if (k === 'sequia'){
    const h = fxPoints(160, .05, 0xffe2a0, box, .35); grp.add(h); parts.push(h); step.push((dt, t) => fxMove(h, dt, t, box, .35, .1));
  } else if (k === 'polen'){
    const p = fxPoints(520, .06, 0xffe86a, box, .95); grp.add(p); parts.push(p); step.push((dt, t) => fxMove(p, dt, t, [box[0], 2.2, box[2]], .08, .35));
    const homes = G.tiles.filter(q => q.type === 'pradera' || q.type === 'bosque' || q.type === 'campo');
    for (let i=0;i<12;i++){ const b = beeModel(), t0 = pick(homes), r = .25 + Math.random()*.35, ph = Math.random()*6.28, sp = (Math.random() < .5 ? 1 : -1)*(1.2 + Math.random()); b.scale.setScalar(1.7); grp.add(b); parts.push(b);
      step.push((dt, t) => { const a = ph + t*sp, x = t0.x + Math.cos(a)*r, z = t0.z + Math.sin(a)*r; b.position.set(x, .2 + tileHeight(t0, x - t0.x, z - t0.z) + .25 + Math.sin(t*3 + ph)*.05, z); b.rotation.y = -a + (sp > 0 ? 0 : Math.PI); b.userData.wings.forEach((w, j) => w.rotation.z = Math.sin(t*60 + j)*.6); }); }
  } else if (k === 'feria'){
    // a caravan going round the whole island, over the outer tiles (and the villages and roads on them)
    const R = Math.max(...G.tiles.map(q => Math.hypot(q.x, q.z)))*.97, rng = mulberry32(G.turnId + 5);
    const hAt = (x, z) => { let best = null, bd = 9; for (const q of G.tiles){ const d = Math.hypot(x - q.x, z - q.z); if (d < bd){ bd = d; best = q; } } return best && bd < TILE_R ? .2 + tileHeight(best, x - best.x, z - best.z) : .05; };
    for (let i=0;i<8;i++){ const w = fairWagon(rng); w.scale.setScalar(.14); grp.add(w); parts.push(w); const a0 = -i*.3;   // one long procession, wagon after wagon
      step.push((dt, t) => { const a = a0 + t*.045, x = Math.cos(a)*R, z = Math.sin(a)*R; w.position.set(x, hAt(x, z), z); w.rotation.y = -a; const ph = t*7 + i;
        const Hh = w.userData.horse; Hh.legs.forEach((l, j) => { l.rotation.x = Math.sin(ph + (j % 2)*Math.PI)*.35; }); const P = w.userData.walker; P.legL.rotation.x = Math.sin(ph)*.4; P.legR.rotation.x = -Math.sin(ph)*.4; P.armL.rotation.x = -Math.sin(ph)*.3; }); }
  }
  grp.traverse(o => { if (o.isMesh && o.material && !o.material.transparent) { o.castShadow = true; } });
  return { sc, drop(){ paint(0); lights.forEach(L => { L.o.intensity = L.i; L.o.color.copy(L.c); }); clouds.forEach(C2 => { C2.m.color.copy(C2.c); C2.m.emissive.copy(C2.e); C2.g.visible = true; }); sc.remove(grp); },
    step(dt, t, e){
      if (Math.abs(e - (this.e ?? -1)) > .004){ this.e = e; paint(e); lights.forEach(L => { L.o.intensity = L.i*(1 + (LT[0] - 1)*e); L.o.color.copy(L.c).lerp(_seasonC.setHex(LT[1]), e*.6); });
        clouds.forEach(C2 => { if (k === 'lluvia'){ C2.m.color.copy(C2.c).lerp(_seasonC.setHex(0x6a7480), e); C2.m.emissive.copy(C2.e).multiplyScalar(1 - .85*e); } if (k === 'sequia') C2.g.visible = e < .5; }); }
      parts.forEach(m => { if (m.material && m.userData.op !== undefined) fxFade(m, e); else m.visible = e > .05; });
      step.forEach(f => f(dt, t)); } };
}
const _seasonC = new THREE.Color();
// ---------- the village in first person: the same weather around you ----------
function seasonVillage(k, ctx){
  const sc = ctx.sc, grp = new THREE.Group(); sc.add(grp); const parts = [], step = [], box = [60, 22, 60];
  const follow = () => grp.position.set(camera.position.x, camera.position.y - 6, camera.position.z);
  if (k === 'lluvia'){ const r = fxRain(1600, box, 1.1); grp.add(r); parts.push(r); step.push((dt, t) => fxMove(r, dt, t, box, -22)); }
  else if (k === 'invierno'){ const s = fxPoints(1500, .16, 0xffffff, box, .95); grp.add(s); parts.push(s); step.push((dt, t) => fxMove(s, dt, t, box, -1.6, .6)); }
  else if (k === 'polen'){ const p = fxPoints(700, .09, 0xffe86a, box, .85); grp.add(p); parts.push(p); step.push((dt, t) => fxMove(p, dt, t, box, .15, .8));
    for (let i=0;i<6;i++){ const b = beeModel(), r = 1.5 + Math.random()*2.5, ph = Math.random()*6.28, sp = 1 + Math.random(); b.scale.setScalar(1.6); sc.add(b); parts.push(b);
      step.push((dt, t) => { const a = ph + t*sp; b.position.set(camera.position.x + Math.cos(a)*r, camera.position.y - .6 + Math.sin(t*2 + ph)*.3, camera.position.z + Math.sin(a)*r); b.rotation.y = -a; b.userData.wings.forEach((w, j) => w.rotation.z = Math.sin(t*60 + j)*.6); }); } }
  else if (k === 'sequia'){ const h = fxPoints(400, .14, 0xffe2a0, box, .3); grp.add(h); parts.push(h); step.push((dt, t) => fxMove(h, dt, t, box, .6, .2)); }
  else if (k === 'feria'){
    // pennant strings across the plaza
    const R = (ctx.V && ctx.V.plazaR) || 9, cols = ['#c0392b', '#d9a520', '#2f6b8a', '#3a8a4a', '#efe4c8'];
    for (let s2=0;s2<5;s2++){ const a = s2/5*Math.PI, x0 = Math.cos(a)*R, z0 = Math.sin(a)*R, line = new THREE.Group();
      for (let q=0;q<=14;q++){ const f = q/14, x = x0 + (-2*x0)*f, z = z0 + (-2*z0)*f, y = 4.2 - Math.sin(f*Math.PI)*1.1 + (ctx.gh ? ctx.gh(x, z) : 0);
        const fl = new THREE.Mesh(sg(new THREE.ConeGeometry(.22, .45, 3)), mat(cols[(q + s2) % cols.length])); fl.position.set(x, y - .25, z); fl.rotation.x = Math.PI; fl.rotation.y = a; line.add(fl); }
      sc.add(line); parts.push(line); }
  }
  // the sky and the light of the season (applied after the day/night cycle each frame)
  const env = sc.userData.env, cl = []; sc.traverse(o => { if (o.userData && o.userData.cloud) cl.push(o); });
  return { drop(){ sc.remove(grp); parts.forEach(m => m.parent && m.parent.remove(m)); cl.forEach(c => c.visible = true); },
    step(dt, t, e){ follow(); parts.forEach(m => { if (m.material && m.userData.op !== undefined) fxFade(m, e); else m.visible = e > .05; }); step.forEach(f => f(dt, t)); },
    envMod(e){
      if (env){ if (k === 'lluvia'){ env.sun.intensity *= 1 - .6*e; env.hemi.intensity *= 1 - .35*e; env.sc.fog.color.lerp(_seasonC.setHex(0x5a6470), .8*e); env.sc.background.copy(env.sc.fog.color); env.sc.fog.far *= 1 - .6*e; env.sc.fog.near *= 1 - .7*e; }
        if (k === 'invierno'){ env.sc.fog.color.lerp(_seasonC.setHex(0xdfe8f0), .5*e); env.sc.background.copy(env.sc.fog.color); env.sc.fog.far *= 1 - .4*e; env.sun.color.lerp(_seasonC.setHex(0xe2ecff), .5*e); }
        if (k === 'sequia'){ env.sc.fog.color.lerp(_seasonC.setHex(0xe8c080), .75*e); env.sc.background.copy(env.sc.fog.color); env.sc.fog.far *= 1 - .45*e; env.sc.fog.near *= 1 - .6*e; env.sun.color.lerp(_seasonC.setHex(0xffc870), .7*e); env.hemi.color.lerp(_seasonC.setHex(0xffe0a0), .5*e); }
        if (k === 'lluvia' || k === 'sequia') cl.forEach(c => c.visible = k === 'lluvia' || e < .5); } } };
}
// called by draw() right after the day/night light, so the season is laid over it every frame
function seasonEnv(sc){ if (SEASON.vfx && SEASON.vctx && SEASON.vctx.sc === sc) SEASON.vfx.envMod(smoothF(SEASON.f)); }
