// ================= MAIN MENU (Buckshot-Roulette-like): still of a village behind 70 % dark, falling models, the title in a biome =================
const MENU = { el: null, view: 'main', fall: null, title: null, night: null, shots: {}, modeViews: [], sel: 'catroan', fp: true, online: false, np: 4, btnViews: [] };
const isNightNow = () => { const h = new Date().getHours() + new Date().getMinutes()/60; return h < 6.5 || h >= 19.5; };
// a still of a village (black owner, nobody on the streets) seen from the plaza, by day or by night
function menuBackdrop(night){
  const key = night ? 'n' : 'd'; if (MENU.shots[key]) return MENU.shots[key];
  if (!G) return '';
  const v = G.verts.filter(x => !x.building && x.tiles.length >= 3).sort((a, b) => a.id - b.id)[3] || G.verts.find(x => !x.building); if (!v) return '';
  const P = G.players[0], keep = { color: P.color, b: v.building, t: DAY.t, fov: camera.fov, near: camera.near, far: camera.far, pos: camera.position.clone(), q: camera.quaternion.clone() };
  let url = '';
  try {
    P.color = '#151515'; v.building = { p: 0, type: 'pueblo' };
    const ctx = buildVillage(v.id);
    ctx.people.forEach(p => p.g.visible = false); (ctx.animals || []).forEach(a => a.g && (a.g.visible = false));
    if (ctx.brujo && ctx.brujo.w) ctx.brujo.w.g.visible = false;
    DAY.t = night ? .95 : .4; if (ctx.sc.userData.env) applyEnv(ctx.sc.userData.env, 0, 0);
    const a = Math.atan2(ctx.start.z, ctx.start.x) + .5, r = 6.2, cx = Math.cos(a)*r, cz = Math.sin(a)*r;
    camera.fov = 62; camera.near = .05; camera.far = 900; camera.updateProjectionMatrix();
    camera.position.set(cx, (ctx.gh ? ctx.gh(cx, cz) : 0) + 1.75, cz); camera.lookAt(-cx*.6, 1.9, -cz*.6);
    if (ctx.sc.userData.sky) ctx.sc.userData.sky.position.copy(camera.position);
    renderScene(ctx.sc); url = renderer.domElement.toDataURL('image/jpeg', .9);
    disposeScene(ctx.sc);
  } catch (e) { url = ''; }
  P.color = keep.color; v.building = keep.b; DAY.t = keep.t; camera.fov = keep.fov; camera.near = keep.near; camera.far = keep.far; camera.updateProjectionMatrix(); camera.position.copy(keep.pos); camera.quaternion.copy(keep.q);
  MENU.shots[key] = url; return url;
}
function menuSetNight(n){ MENU.night = n; const el = MENU.el; if (!el) return; el.classList.toggle('night', n); const u = menuBackdrop(n); el.querySelector('.mbg').style.backgroundImage = u ? `url(${u})` : 'none'; el.querySelector('.mdaynight').innerHTML = ic(n ? 'luna' : 'sol'); el.querySelector('.mdaynight').title = n ? 'Noche · toca para ver el día' : 'Día · toca para ver la noche'; }
function openMainMenu(){
  let el = MENU.el;
  if (!el){ el = MENU.el = document.createElement('div'); el.id = 'menu'; document.body.appendChild(el);
    el.innerHTML = `<div class="mbg"></div><div class="mdark"></div><div class="mfall"><canvas></canvas></div><div class="mdark2"></div>
      <div class="mview" data-v="main"><div class="mtitle"><canvas></canvas></div><nav class="mopts"><a data-go="play">Jugar</a><a data-go="mp">Multijugador</a><a data-go="how">Cómo jugar</a><a data-go="exit">Salir</a></nav></div>
      <div class="mview" data-v="play"><h2>Elige el modo</h2><div class="mmodes"></div>
        <div class="mrow"><button class="mtoggle" data-fp="1"></button></div>
        <div class="mrow mnp"><span>Jugadores</span>${[2, 3, 4].map(n => `<button class="mnpb" data-np="${n}">${n}</button>`).join('')}</div>
        <div class="mcomp"><h3>Complementos</h3><div class="mhexes">${[0, 1, 2].map(() => '<div class="mhx"><b>?</b><span>Próximamente</span></div>').join('')}</div></div>
        <div class="mrow"><button data-go="back">◀ Volver</button><button class="primary" data-go="start">Comenzar ▶</button></div></div>
      <div class="mview" data-v="mp"><h2>Multijugador</h2><div class="mbig"><button class="primary" data-go="create">Crear partida</button><button data-go="join">Unirse con clave</button></div><p class="mnote"></p><div class="mrow"><button data-go="main">◀ Volver</button></div></div>
      <div class="mview" data-v="create"><h2>Nueva partida</h2><div class="mcardwrap"><canvas class="mcard"></canvas></div>
        <label class="mfield">Nombre de la partida<input class="mname" maxlength="24"></label>
        <div class="m3btns"><div class="m3b" data-act="copy"><canvas></canvas><span>Copiar clave</span></div><div class="m3b" data-act="next"><canvas></canvas><span>Siguiente</span></div></div>
        <div class="mrow"><button data-go="mp">◀ Volver</button></div></div>
      <div class="mview" data-v="join"><h2>Unirse a una partida</h2><label class="mfield">Clave de la partida<input class="mkey" maxlength="7" placeholder="K7M-2QX" autocomplete="off"></label><p class="mnote jnote"></p><div class="mrow"><button data-go="mp">◀ Volver</button><button class="primary" data-go="dojoin">Unirse ▶</button></div></div>
      <div class="mview" data-v="how"><h2>Cómo jugar</h2><p class="msoon">Próximamente</p><div class="mrow"><button data-go="main">◀ Volver</button></div></div>
      <div class="mview" data-v="exit"><h2>¿Salir de Catroan?</h2><div class="mrow"><button data-go="main">No</button><button class="primary" data-go="bye">Sí, salir</button></div></div>
      <div class="mview" data-v="bye"><h2>Gracias por jugar Catroan</h2><p class="mnote">Ya puedes cerrar esta pestaña.</p><div class="mrow"><button data-go="main">Volver al menú</button></div></div>
      <button class="mdaynight"></button><div class="mver">Catroan · v0.2</div>`;
    el.addEventListener('click', menuClick);
    el.querySelector('.mdaynight').onclick = e => { e.stopPropagation(); SFX.click?.(); menuSetNight(!MENU.night); };
    el.querySelector('.mname').addEventListener('input', () => { MENU.match = el.querySelector('.mname').value.trim() || 'Partida'; drawMatchCards(); });
    el.querySelector('.mkey').addEventListener('input', e => { const i = e.target; i.value = cleanKey(i.value); });
    addEventListener('resize', () => { if (MENU.fall) MENU.fall.fit(); });
  }
  mode = 'menu'; document.body.classList.add('inmenu'); el.classList.add('show');
  if (miniInit() && !MENU.fall) MENU.fall = fallingView(el.querySelector('.mfall canvas'));
  menuSetNight(MENU.night === null ? isNightNow() : MENU.night);
  menuGo('main');
}
function closeMainMenu(){ if (!MENU.el) return; MENU.el.classList.remove('show'); document.body.classList.remove('inmenu'); }
function menuGo(v){
  MENU.view = v; const el = MENU.el; el.dataset.view = v;
  el.querySelectorAll('.mview').forEach(x => x.classList.toggle('on', x.dataset.v === v));
  el.classList.toggle('plain', v !== 'main');                    // other views: only the falling models, darker
  if (v === 'main') buildMenuTitle();
  if (v === 'play'){ buildModeHexes(); el.querySelector('.mnp').style.display = MENU.online ? '' : 'none'; updNp(); el.querySelector('[data-v=play] [data-go=start]').textContent = MENU.online ? 'Abrir la partida ▶' : 'Comenzar ▶'; }
  if (v === 'mp') el.querySelector('[data-v=mp] .mnote').textContent = '';
  if (v === 'create'){ if (!MENU.key) MENU.key = newKey(); const n = el.querySelector('.mname'); if (!n.value) n.value = MENU.match = `Partida de ${myName()}`; drawMatchCards(); build3DButtons(el.querySelector('[data-v=create]')); }
  if (v === 'join') setTimeout(() => el.querySelector('.mkey').focus(), 50);
}
const myName = () => { try { return localStorage.getItem('hexterra-name') || 'Alcalde'; } catch { return 'Alcalde'; } };
function buildMenuTitle(){
  const cv = MENU.el.querySelector('.mtitle canvas'); if (!miniInit()) return;
  if (MENU.title) MENU.title.alive = false;
  // the letters only line up from this view: drag to turn the hexagon and see them scatter; let go and it settles back
  const D = { rx: 0, ry: 0, drag: null }, T = randomTitleHex();
  const v = miniView(cv, { w: TITLE_CAM.w, h: TITLE_CAM.h, res: .8, fov: TITLE_CAM.fov, fps: 30, tick: dt => { if (!D.drag){ const k = Math.min(1, dt*4); D.rx -= D.rx*k; D.ry -= D.ry*k; } T.g.rotation.set(D.rx, D.ry, 0); } });
  v.cam.position.set(...TITLE_CAM.pos); v.cam.lookAt(...TITLE_CAM.look); v.sc.add(T.g); MENU.title = v;
  cv.onpointerdown = e => { D.drag = { x: e.clientX, y: e.clientY, rx: D.rx, ry: D.ry }; cv.setPointerCapture(e.pointerId); cv.classList.add('grab'); };
  cv.onpointermove = e => { if (!D.drag) return; D.ry = D.drag.ry + (e.clientX - D.drag.x)*.012; D.rx = Math.max(-1.3, Math.min(1.3, D.drag.rx + (e.clientY - D.drag.y)*.012)); };
  cv.onpointerup = cv.onpointercancel = () => { D.drag = null; cv.classList.remove('grab'); };
  MENU.el.querySelector('.mtitle').dataset.biome = T.biome + ' · ' + T.variant;
}
// ---------- Jugar: each mode is a little board (seven tiles of the real board), tilted, with its models spinning in place around it ----------
const MINI_LAYOUT = [[0, 0], ...[0, 1, 2, 3, 4, 5].map(k => [Math.cos(k*Math.PI/3)*TILE_IN*2, Math.sin(k*Math.PI/3)*TILE_IN*2])];
function modeHexModel(kind){
  const g = new THREE.Group(), rnd = mulberry32(kind === 'clasico' ? 7 : Math.floor(Math.random()*1e5)), classic = kind === 'clasico';
  const types = classic ? ['desierto', 'bosque', 'pradera', 'campo', 'cerro', 'montana', 'pradera'] : ['pradera', 'bosque', 'campo', 'montana', 'cerro', 'pradera', 'bosque'];
  // the frame under the tiles: sea and a wooden (classic) or brass (Catroan) rim
  const rim = new THREE.Mesh(sg(new THREE.CylinderGeometry(3.05, 3.2, .3, 6)), icm(classic ? 0x6a4428 : 0xa8823a, classic ? {} : { m: .55, r: .45 })); rim.position.y = .02; g.add(rim);
  const sea = new THREE.Mesh(sg(new THREE.CylinderGeometry(2.9, 2.9, .06, 6)), icm(0x2a6a8a)); sea.position.y = .17; g.add(sea);
  const trees = new TreeBatch(.012);
  MINI_LAYOUT.forEach(([x, z], i) => { const t = { type: types[i], x, z, i: i*7 + 3 }, m = hexTileMesh(t); m.position.set(x, .2, z); g.add(m);
    const Y = (lx, lz) => .2 + tileHeight(t, lx, lz), n = { bosque: 9, pradera: 2, campo: 1, cerro: 2, montana: 3, desierto: 0 }[t.type];
    for (let k=0;k<n;k++){ const a = rnd()*6.28, d = .4 + rnd()*.45, lx = Math.cos(a)*d, lz = Math.sin(a)*d; trees.add(treeKindFor(t.type, rnd), x + lx, Y(lx, lz) - .004, z + lz, .03 + rnd()*.015, rnd()*6.28, treeTint('roble', rnd)); }
    if (classic){ if (t.type !== 'desierto'){ const tok = numberToken([5, 9, 4, 10, 6, 8][(i - 1 + 6) % 6]); tok.position.set(x, .24, z); g.add(tok); } else { const r = robberModel ? robberModel() : null; if (r){ r.scale.setScalar(.6); r.position.set(x, .2, z); g.add(r); } } }
    else if (i % 2){ const h = boardHouse(pick(COLOR_CHOICES, rnd), i === 3); h.scale.setScalar(.9); h.position.set(x + .2, Y(.2, .1), z + .1); g.add(h); } });
  trees.build(g);
  // the models stand around the board and spin each on its own axis
  const pool = classic ? [...RES.map(k => () => makeResourceItem(k)), () => trophyModel('army')]
    : shuffle([...AMK.map(k => () => amuletModel(k)), ...SPK.map(k => () => makeSpecialItem(k)), ...RES.map(k => () => makeResourceItem(k))]).slice(0, 6);
  g.userData.spin = [];
  pool.forEach((mk, i) => { const sp = spinner(mk(), 1.25), a = i/pool.length*Math.PI*2 + .3; sp.position.set(Math.cos(a)*3.8, .7 + Math.sin(i*1.7)*.15, Math.sin(a)*3.75); sp.rotation.z = (rnd() - .5)*.5; g.add(sp); g.userData.spin.push(sp); });
  return g;
}
function buildModeHexes(){
  const box = MENU.el.querySelector('.mmodes'); MENU.modeViews.forEach(v => v.alive = false); MENU.modeViews = [];
  box.innerHTML = [['clasico', 'Clásico', 'Solo el juego base'], ['catroan', 'Catroan', 'Misiones, brujo, amuletos, objetos y más']].map(([k, n, d]) => `<div class="mmode ${MENU.sel === k ? 'sel' : ''}" data-mode="${k}"><canvas></canvas><b>${n}</b><span>${d}</span></div>`).join('');
  if (miniInit()) box.querySelectorAll('.mmode').forEach(d => { const g = modeHexModel(d.dataset.mode);
    const v = miniView(d.querySelector('canvas'), { w: 300, h: 240, res: .8, fov: 30, fps: 30, tick: (dt, t) => { g.userData.spin.forEach((sp, i) => { sp.userData.inner.rotation.y += dt*(.8 + (i % 3)*.25); sp.position.y += Math.sin(t*1.4 + i)*.0012; }); } });
    v.cam.position.set(0, 4.6, 9.6); v.cam.lookAt(0, -.2, .2); g.rotation.set(.12, -.35, 0); v.sc.add(g); MENU.modeViews.push(v); });
  updFpToggle();
}
const updNp = () => MENU.el.querySelectorAll('.mnpb').forEach(b => b.classList.toggle('on', +b.dataset.np === MENU.np));
function updFpToggle(){ const b = MENU.el.querySelector('.mtoggle'); b.innerHTML = `${ic('ojo')} Vista en primera persona: <b>${MENU.fp ? 'Sí' : 'No'}</b>`; b.classList.toggle('off', !MENU.fp); b.title = MENU.fp ? 'Podrás recorrer tus pueblos y ver las escenas 3D (mercado, despacho, muelle…)' : 'Sin recorridos ni escenas: todo se resuelve con paneles, como el juego de mesa'; }
// ---------- the big card that carries the match name and its key ----------
function matchCardCanvas(){
  const W = 180, H = 252, S = 2, cv = document.createElement('canvas'); cv.width = W*S; cv.height = H*S; const c = cv.getContext('2d'); c.scale(S, S); c.imageSmoothingEnabled = false;
  const gold = 0xc8a040; c.fillStyle = '#0b0705'; c.fillRect(0, 0, W, H); velvet(c, 1, 1, W - 2, H - 2, '#151515', 11);
  c.fillStyle = mineralTone(gold, .6); c.fillRect(8, 8, W - 16, 1); c.fillRect(8, H - 9, W - 16, 1); c.fillRect(8, 8, 1, H - 16); c.fillRect(W - 9, 8, 1, H - 16);
  mineralCorners(c, W, H, gold, 18, 4);
  const txt = (t, y, f, col) => { c.font = f; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#000'; c.fillText(t, W/2, y + 1); c.fillStyle = col; c.fillText(t, W/2, y); };
  txt('CATROAN', 30, "700 15px 'Pixelify Sans', monospace", mineralTone(gold, 1.1));
  txt('PARTIDA', 74, "600 10px 'Pixelify Sans', monospace", '#b8a888');
  let name = MENU.match || 'Partida', fs = 15; c.font = `700 ${fs}px 'Pixelify Sans', monospace`; while (c.measureText(name).width > W - 30 && fs > 8){ fs--; c.font = `700 ${fs}px 'Pixelify Sans', monospace`; }
  txt(name, 94, `700 ${fs}px 'Pixelify Sans', monospace`, '#f2e2c0');
  txt('CLAVE DE ACCESO', 140, "600 10px 'Pixelify Sans', monospace", '#b8a888');
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(24, 150, W - 48, 30); c.fillStyle = mineralTone(gold, .55); c.fillRect(24, 150, W - 48, 1); c.fillRect(24, 179, W - 48, 1);
  txt(MENU.key || '———', 166, "900 20px 'Pixelify Sans', monospace", mineralTone(gold, 1.25));
  const hx = (r, col) => { c.fillStyle = col; c.beginPath(); for (let k=0;k<6;k++){ const a = (60*k - 30)*Math.PI/180; c.lineTo(W/2 + Math.cos(a)*r, 214 + Math.sin(a)*r); } c.fill(); };
  hx(15, '#0b0705'); hx(13, mineralTone(gold, .8)); hx(10, '#151515'); txt('C', 215, 'bold 12px Georgia, serif', mineralTone(gold, 1.1));
  roundCard(c, W, H); return cv;
}
function drawMatchCards(){
  MENU.el.querySelectorAll('canvas.mcard').forEach(cv => { if (!miniInit()) return;
    if (!cv._v){ const g = new THREE.Group(), tex = new THREE.CanvasTexture(matchCardCanvas()); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
      const face = keepMat(new THREE.MeshStandardMaterial({ map: tex, roughness: .85, transparent: true, alphaTest: .5 })), back = keepMat(new THREE.MeshStandardMaterial({ map: cardBackTex('#151515'), roughness: .85, transparent: true, alphaTest: .5 }));
      const m = new THREE.Mesh(sg(new THREE.PlaneGeometry(1.8, 2.52)), face), b = new THREE.Mesh(sg(new THREE.PlaneGeometry(1.8, 2.52)), back); b.rotation.y = Math.PI; b.position.z = -.005; g.add(m, b);
      const small = cv.classList.contains('small'), v = miniView(cv, { w: small ? 200 : 250, h: small ? 280 : 350, res: .9, fov: 30, fps: 30, tick: (dt, t) => { g.rotation.y = Math.sin(t*.6)*.12; g.rotation.x = -.05 + Math.sin(t*.45)*.03; } });
      v.cam.position.set(0, 0, 5.2); v.cam.lookAt(0, 0, 0); v.sc.add(g); cv._v = v; cv._tex = tex; }
    cv._tex.image = matchCardCanvas(); cv._tex.needsUpdate = true; });
}
// ---------- 3D buttons: a brass hex plate with a model on it ----------
function build3DButtons(scope){
  scope.querySelectorAll('.m3b').forEach(b => { const cv = b.querySelector('canvas'); if (cv._v || !miniInit()) return;
    const g = new THREE.Group(), plate = new THREE.Mesh(sg(new THREE.CylinderGeometry(1, 1, .25, 6)), icm(0xa8823a, { m: .55, r: .45 })); plate.rotation.y = Math.PI/6; g.add(plate);
    const felt = new THREE.Mesh(sg(new THREE.CylinderGeometry(.86, .86, .03, 6)), icm(b.dataset.act === 'next' ? 0x4f5e34 : 0x6e2230)); felt.rotation.y = Math.PI/6; felt.position.y = .14; g.add(felt);
    const icon = spinner(b.dataset.act === 'copy' ? iconModel('pergamino') : iconModel('flecha'), 1.25); icon.position.y = .75; icon.rotation.x = .15; g.add(icon);
    const S = { hov: 0, press: 0 };
    const v = miniView(cv, { w: 120, h: 96, res: .9, fov: 30, fps: 30, tick: (dt, t) => { icon.userData.inner.rotation.y += dt*1.4; S.press = Math.max(0, S.press - dt*4); g.position.y = S.hov*.15 - S.press*.15; } });
    v.cam.position.set(0, 3.2, 3.4); v.cam.lookAt(0, .3, 0); v.sc.add(g); cv._v = v;
    b.addEventListener('pointerenter', () => S.hov = 1); b.addEventListener('pointerleave', () => S.hov = 0); b.addEventListener('pointerdown', () => S.press = 1); });
}
async function copyKey(){
  const k = MENU.key || NET.key; let ok = false;
  try { await navigator.clipboard.writeText(k); ok = true; } catch { ok = false; }
  sysNote(ok ? `Clave <b>${k}</b> copiada. Pásasela a tus amigos.` : `Copia la clave a mano: <b>${k}</b>`, { ms: 2600 });
}
// ---------- navigation ----------
async function menuClick(e){
  const el = MENU.el, mm = e.target.closest('.mmode');
  if (mm){ MENU.sel = mm.dataset.mode; el.querySelectorAll('.mmode').forEach(x => x.classList.toggle('sel', x === mm)); SFX.click?.(); return; }
  if (e.target.closest('.mtoggle')){ MENU.fp = !MENU.fp; updFpToggle(); SFX.click?.(); return; }
  const np = e.target.closest('.mnpb'); if (np){ MENU.np = +np.dataset.np; updNp(); SFX.click?.(); return; }
  const b3 = e.target.closest('.m3b'); if (b3){ SFX.click?.(); if (b3.dataset.act === 'copy') copyKey(); else if (b3.dataset.act === 'next'){ MENU.online = true; menuGo('play'); } return; }
  const a = e.target.closest('[data-go]'); if (!a) return; SFX.click?.(); audioInit();
  const go = a.dataset.go;
  if (go === 'play'){ MENU.online = false; menuGo('play'); }
  else if (go === 'back') menuGo(MENU.online ? 'create' : 'main');
  else if (go === 'start'){
    GAME_OPTS.mode = MENU.sel; GAME_OPTS.firstPerson = MENU.fp;
    if (MENU.online){ NET.me.name = myName(); const r = await netJoin(MENU.key, { host: true, match: MENU.match, name: NET.me.name }); if (r.error){ el.querySelector('[data-v=mp] .mnote').textContent = 'No se pudo abrir la sala (' + r.error + ').'; menuGo('mp'); return; } netHostStart(MENU.np); return; }
    closeMainMenu(); applyGameOpts(); newGame(); startRegistration();
  }
  else if (go === 'create'){ MENU.key = newKey(); MENU.match = ''; el.querySelector('.mname').value = ''; menuGo('create'); }
  else if (go === 'dojoin'){ const k = cleanKey(el.querySelector('.mkey').value), note = el.querySelector('.jnote');
    if (k.length !== 7){ note.textContent = 'La clave tiene 6 letras o números, como K7M-2QX.'; return; }
    note.textContent = 'Buscando la sala…'; NET.me.name = myName(); const r = await netJoin(k, { name: NET.me.name });
    if (r.error){ note.textContent = r.error === 'not_permitted' ? 'Este enlace no te deja entrar a salas: pide al anfitrión que te comparta el artifact con permiso para participar.' : 'No se pudo conectar (' + r.error + ').'; return; }
    MENU.key = k; note.textContent = 'Esperando al anfitrión…';
    clearTimeout(NG.joinT); NG.joinT = setTimeout(async () => { if (NG.on) return; note.textContent = 'No hay ninguna partida abierta con esa clave (o ya no acepta jugadores).'; await netLeave(); }, 15000); }
  else if (go === 'exit') menuGo('exit');
  else if (go === 'bye'){ menuGo('bye'); try { window.close(); } catch {} }
  else menuGo(go);
}
