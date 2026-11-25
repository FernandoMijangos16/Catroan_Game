// ================= GAME START: registration on the player's sign, dice for turn order, manual first placement =================
// ================= GAME START: everything is filled in on the hanging sign itself =================
const COLOR_CHOICES = ['#e0473b', '#3b82f6', '#f2efe4', '#f59e0b', '#2f9e5a', '#9a5ad0', '#e86aa8', '#3ac0c0'];
// detailed low-res materials for every sign: vertical planks with grain, nails and knots; a twisted rope
function signWoodMat(dark){ const k = dark ? 'sgWd2' : 'sgW2'; return hmat(k, () => { const m = woodTex(dark ? 0x5a3c22 : 0xa87a4c, dark ? 21 : 19, { plank: 8 }).clone(); m.map = m.map.clone(); m.map.center.set(.5, .5); m.map.rotation = Math.PI/2; m.map.repeat.set(2, 2); m.map.needsUpdate = true; return m; }); }
const ROPE_MATS = new Map();
function ropeMat(color){
  const key = String(color); if (ROPE_MATS.has(key)) return ROPE_MATS.get(key);
  const C = new THREE.Color(color), tex = pxTex(8, 16, c => { for (let y=0;y<16;y++) for (let x=0;x<8;x++){ const strand = ((x + y) % 8) < 4, fib = hash2(x, y, 33)*.12; c.fillStyle = '#' + C.clone().multiplyScalar((strand ? 1.05 : .72) + fib - ((x + y) % 4 === 0 ? .18 : 0)).getHexString(); c.fillRect(x, y, 1, 1); } });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 10);
  const m = keepMat(new THREE.MeshStandardMaterial({ map: tex, roughness: .9, flatShading: true })); ROPE_MATS.set(key, m); return m;
}
const REG = { v: null, sign: null, dv: null, dice: [], ext: 0, extT: 0, cells: [] };
const SGN = { W: 380, H: 370, SW: 320, top: 150, MAIN: 132 };    // canvas size and sign layout (ortho: 1 unit = 1 css px)
const sgPx = (x, y) => [x + SGN.W/2, SGN.H/2 - y];               // world → overlay pixels
// the sign: rope, board, frame, portrait, an engraved (or blank, while typing) name plate and an extension that grows downwards
function makeSign3D(P, o = {}){
  const g = new THREE.Group(), iron = ironMat(), { SW, top, MAIN } = SGN, yT = top - 36;
  g.add(mesh(GEO.box, iron, 0, top - 3, 1, 12, 6, 4)); g.add(ironRing(iron, 0, top - 5, 4.5));
  [-SW/2 + 24, SW/2 - 24].forEach(x => { const r = ropeMesh(new THREE.Vector3(0, top - 5, 3), new THREE.Vector3(x, yT + 4, 3), ropeMat(P.color)); r.scale.x = r.scale.z = 2.4; g.add(r); g.add(ironRing(iron, x, yT + 2, 4)); });
  const body = new THREE.Group(); g.add(body);
  const bd = rusticBoard(SW, MAIN, 9, { ph: 33, brackets: false }); bd.position.y = yT; body.add(bd);
  // the extension: more planks that slide out from behind; its texture repeats one plank every 33 px
  const extM = plankMat(3, 0x5e3c22).clone(); extM.map = extM.map.clone(); extM.map.needsUpdate = true; keepMat(extM);
  const ext = new THREE.Mesh(GEO.box, [endGrainMat(), endGrainMat(), extM, endGrainMat(), extM, endGrainMat()]); ext.scale.set(SW - 6, 1, 6); ext.position.set(0, yT - MAIN, -1); body.add(ext);
  const batD = plankMat(5, 0x4a301c), bat = (w, h, x, y) => { const m = mesh(GEO.box, batD, x, y, 1, w, h, 9); body.add(m); return m; };
  const lR = bat(10, MAIN, -SW/2 - 3, yT - MAIN), rR = bat(10, MAIN, SW/2 + 3, yT - MAIN);
  // iron corner brackets that travel with the bottom edge
  const L = 22, T = 5, brk = new THREE.Group(); body.add(brk);
  const corner = (cx, cy, ix, iy, par) => { par.add(mesh(GEO.box, iron, cx + ix*L/2, cy + iy*T/2 - T/2, 6, L, T, 2)); par.add(mesh(GEO.box, iron, cx + ix*T/2, cy + iy*L/2 - L/2, 6, T, L, 2));
    [[cx + ix*(L - 4), cy + iy*T/2], [cx + ix*T/2, cy + iy*(L - 4)], [cx + ix*T/2, cy + iy*T/2]].forEach(([x, y]) => par.add(mesh(GEO.sphere, iron, x, y, 7.4, 1.7, 1.7, 1.2))); };
  corner(-SW/2 - 8, yT, 1, -1, body); corner(SW/2 + 8, yT, -1, -1, body); corner(-SW/2 - 8, 0, 1, 1, brk); corner(SW/2 + 8, 0, -1, 1, brk);
  body.add(mesh(GEO.box, iron, 0, yT - 4, 5, SW + 18, 4, 2));
  // portrait: rough dark frame, nailed
  const px = -SW/2 + 52, pyc = yT - 53, frM = plankMat(6, 0x4a301c);
  [[0, 34, 70, 7], [0, -34, 70, 7], [-32, 0, 7, 62], [32, 0, 7, 62]].forEach(([dx, dy, w, h], k) => { const f = mesh(GEO.box, frM, px + dx, pyc + dy - h/2, 5, w, h, 4); f.rotation.z = (k - 1.5)*.01; body.add(f); });
  [[-32, 34], [32, 34], [-32, -34], [32, -34]].forEach(([dx, dy]) => body.add(mesh(GEO.sphere, iron, px + dx, pyc + dy, 8, 1.8, 1.8, 1.2)));
  const avT = new THREE.CanvasTexture(avatarCanvas(P.avatar || 'campesino')); avT.colorSpace = THREE.SRGBColorSpace; avT.magFilter = THREE.NearestFilter;
  const por = new THREE.Mesh(sg(new THREE.PlaneGeometry(1, 1)), keepMat(new THREE.MeshStandardMaterial({ map: avT, roughness: .8 }))); por.scale.set(56, 60, 1); por.position.set(px, pyc, 6.5); body.add(por);
  // the name, burnt into the wood (blank while you type it)
  if (!o.blank){ const nm = burntPlane(P.name || ' ', 120, 22, 18); nm.scale.set(SW - 124, 30, 1); nm.position.set(44, yT - 32, 3.3); body.add(nm); }
  else { const sc = mesh(GEO.box, keepMat(new THREE.MeshStandardMaterial({ color: 0x2a160a, transparent: true, opacity: .18 })), 44, yT - 47, 3.1, SW - 124, 30, .2); body.add(sc); }
  g.userData.setExt = h => { ext.scale.y = Math.max(1, h); ext.position.y = yT - MAIN - h; extM.map.repeat.set(1, Math.max(.05, h/33)); lR.scale.y = rR.scale.y = MAIN + h; lR.position.y = rR.position.y = yT - MAIN - h; brk.position.y = yT - MAIN - h; };
  g.userData.setExt(o.ext || 0);
  outlineItem(g);
  return g;
}
function regEnsure(){
  let el = $('#reg'); if (!el){ el = document.createElement('div'); el.id = 'reg'; document.body.appendChild(el); }
  if (!el.querySelector('.rsign')){ el.innerHTML = `<div class="rbox" style="width:${SGN.W}px;height:${SGN.H}px"><canvas class="rsign"></canvas><div class="rov"></div></div>`; REG.v = null; }
  if (!REG.v && miniInit()) REG.v = miniView(el.querySelector('.rsign'), { w: SGN.W, h: SGN.H, ortho: true, res: 1, fps: 45, tick: (dt, t) => regTick(dt, t) });
  el.classList.add('show'); document.body.classList.add('registering');
  return el.querySelector('.rov');
}
function regTick(dt, t){
  if (REG.sign){ REG.sign.rotation.z = Math.sin(t*1.1)*.012; if (REG.extT !== REG.ext){ REG.ext += (REG.extT - REG.ext)*Math.min(1, dt*7); if (Math.abs(REG.extT - REG.ext) < .5) REG.ext = REG.extT; REG.sign.userData.setExt(REG.ext); } }
  const ov = $('#reg .rov .rext'); if (ov) ov.style.opacity = REG.ext > REG.extT*.85 && REG.extT > 0 ? 1 : 0;
}
function regSign(P, o = {}){ if (!REG.v) return; if (REG.sign) REG.v.sc.remove(REG.sign); REG.sign = makeSign3D(P, { ...o, ext: REG.ext }); REG.v.sc.add(REG.sign); }
function regClose(){ const el = $('#reg'); if (el) el.classList.remove('show'); document.body.classList.remove('registering'); REG.cells.forEach(v => v.alive = false); REG.cells = []; if (REG.dv) REG.dv.alive = false; REG.dv = null; }
function setMyColor(c){ const me = G.players[0], old = me.color; if (c === old) return; if (NG.on){ if (!G.players.some((P, i) => i && !P.empty && P.color === c)) me.color = c; return; } const other = G.players.find((P, i) => i && P.color === c); if (other) other.color = old; me.color = c; }
// step 1: name, avatar and color, written straight on the sign
function startRegistration(){
  const me = G.players[0];
  try { me.name = localStorage.getItem('hexterra-name') || 'Alcalde'; const c = localStorage.getItem('hexterra-color'); if (NG.on) me.color = freeColor(0, c && okColor(c) ? c : me.color); else if (c) setMyColor(c); me.avatar = avOk(localStorage.getItem('hexterra-avatar') || me.avatar || 'campesino'); } catch {}
  const ov = regEnsure(); REG.ext = REG.extT = 0; regSign(me, { blank: true });
  const { SW, top } = SGN, yT = top - 36, at = (x, y) => { const [px, py] = sgPx(x, y); return `left:${px}px;top:${py}px`; };
  ov.innerHTML = `<input class="rname" maxlength="12" value="${me.name.replace(/"/g, '')}" style="${at(-51, yT - 15)};width:190px;height:30px" title="Escribe tu nombre en la placa">
    <button class="rpor" style="${at(-SW/2 + 24, yT - 23)}" title="Elegir avatar"></button>
    <button class="rav l" style="${at(-SW/2 + 22, yT - 95)}" title="Avatar anterior">◀</button><button class="rav r" style="${at(-SW/2 + 56, yT - 95)}" title="Siguiente avatar">▶</button>
    <div class="rcols" style="${at(-46, yT - 56)}">${COLOR_CHOICES.map(c => { const taken = NG.on && G.players.some((P, i) => i && !P.empty && P.color === c); return `<button class="rcol ${c === me.color ? 'on' : ''} ${taken ? 'taken' : ''}" data-c="${c}" style="--c:${c}" ${taken ? 'disabled title="Ya lo eligió otro jugador"' : ''}></button>`; }).join('')}</div>
    <div class="rhint" style="${at(-46, yT - 84)}">Escribe tu nombre y elige tu color</div>
    <button class="rcarve rok" style="${at(SW/2 - 112, yT - 100)}">Guardar ${ic('check')}</button>`;
  const inp = ov.querySelector('.rname');
  inp.oninput = () => { me.name = inp.value.trim() || 'Alcalde'; };
  ov.querySelectorAll('.rav').forEach(b => b.onclick = () => { const i = AVATARS.findIndex(a => a.id === me.avatar); me.avatar = AVATARS[(i + (b.classList.contains('l') ? -1 : 1) + AVATARS.length) % AVATARS.length].id; regSign(me, { blank: true }); SFX.click?.(); });
  ov.querySelector('.rpor').onclick = () => { $('#reg').classList.remove('show'); chooseAvatar(); const mb = modalBody.onclick; modalBody.onclick = e => { mb && mb(e); if (modal.classList.contains('hidden')){ $('#reg').classList.add('show'); regSign(me, { blank: true }); } }; };
  ov.querySelectorAll('.rcol').forEach(b => b.onclick = () => { if (b.disabled) return; setMyColor(b.dataset.c); ov.querySelectorAll('.rcol').forEach(x => x.classList.toggle('on', x === b)); regSign(me, { blank: true }); SFX.click?.(); });
  ov.querySelector('.rok').onclick = () => { me.name = inp.value.trim() || 'Alcalde'; try { localStorage.setItem('hexterra-name', me.name); localStorage.setItem('hexterra-color', me.color); localStorage.setItem('hexterra-avatar', me.avatar); } catch {} SFX.click?.(); PLATES.forEach(p => p.build()); updatePlates(true); if (NG.on) netRegRoll(); else orderRolls(); };
  setTimeout(() => inp.focus(), 300);
}
// the dice box inside the extension
function regDiceView(cv){
  if (!miniInit()) return; if (REG.dv) REG.dv.alive = false;
  const v = miniView(cv, { w: 200, h: 96, res: 1, fov: 30, fps: 60, tick: dt => stepRegDice(dt) });
  v.cam.position.set(0, 3.2, 3.0); v.cam.lookAt(0, 0, .1);
  v.sc.add(mesh(GEO.cyl14, keepMat(new THREE.MeshStandardMaterial({ color: 0x5a1e22, roughness: 1 })), 0, -.2, 0, 1.55, .2, .95));
  REG.dv = v; REG.dice = [0, 1].map(i => { const d = makeDie(); d.scale.setScalar(.5); d.position.set(i ? .5 : -.5, .25, 0); v.sc.add(d); return { g: d, t: 9 }; });
}
function stepRegDice(dt){
  REG.dice.forEach((d, i) => { if (d.t >= 1.3) return; d.t += dt; const k = Math.min(1, d.t/1.3);
    if (k < 1){ d.g.rotation.x += dt*(14 - k*12); d.g.rotation.y += dt*(9 - k*7)*(i ? -1 : 1); d.g.position.y = .25 + Math.abs(Math.sin(k*Math.PI*3))*(1 - k)*.8; d.g.position.x = (i ? .5 : -.5) + Math.sin(k*9 + i)*(1 - k)*.25; }
    else { d.g.quaternion.copy(d.qf); d.g.position.y = .25; SFX.clack?.(.6); } });
}
function rollRegDice(){
  return new Promise(res => { const a = 1 + Math.floor(Math.random()*6), b = 1 + Math.floor(Math.random()*6);
    REG.dice.forEach((d, i) => { const v = i ? b : a; d.t = 0; d.qf = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(...DIE_NORMAL[v]), new THREE.Vector3(0, 1, 0)).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), (Math.random() - .5)*.6)); });
    SFX.dice?.(); setTimeout(() => res(a + b), 1500); });
}
// step 2: the sign stretches down to hold the dice; every player rolls one by one, ties roll again
async function orderRolls(){
  const n = G.players.length, rolls = {}, ov = $('#reg .rov'), { SW, top, MAIN } = SGN, yT = top - 36, EXT = 112;
  const at = (x, y) => { const [px, py] = sgPx(x, y); return `left:${px}px;top:${py}px`; };
  ov.innerHTML = `<div class="rtop" style="${at(-SW/2 + 92, yT - 68)};width:${SW - 104}px"><div class="rmsg"></div><div class="rlist"></div></div><div class="rext" style="${at(-SW/2 + 14, yT - MAIN - 4)};width:${SW - 28}px;height:${EXT - 8}px"><canvas class="rdice"></canvas><div class="rres"></div><div class="rbtn"></div></div>`;
  REG.extT = EXT; regDiceView(ov.querySelector('.rdice'));
  const msg = h => ov.querySelector('.rmsg').innerHTML = h, list = () => { const ord = Object.keys(rolls).map(Number).sort((a, b) => rolls[b] - rolls[a]); ov.querySelector('.rlist').innerHTML = ord.map(i => `<span style="--c:${G.players[i].color}"><i></i>${G.players[i].name} <b>${rolls[i]}</b></span>`).join(''); };
  const final = []; let tie = 0;
  const rollGroup = async ids => {
    const res = {};
    for (const i of ids){
      const P = G.players[i]; regSign(P); ov.querySelector('.rres').textContent = '';
      msg(i === 0 ? '<b>Tu turno</b>: lanza los dados' : `<b>${P.name}</b> lanza…`);
      const bt = ov.querySelector('.rbtn'); bt.innerHTML = '';
      if (i === 0) await new Promise(r => { bt.innerHTML = `<button class="rcarve rroll">${ic('dado')} Lanzar</button>`; bt.querySelector('.rroll').onclick = () => { bt.innerHTML = ''; r(); }; });
      else await wait(650);
      const v = await rollRegDice(); res[i] = rolls[i] = v; ov.querySelector('.rres').textContent = v; list(); await wait(750);
    }
    return res;
  };
  const rank = async ids => {
    if (ids.length === 1){ final.push(ids[0]); return; }
    const res = await rollGroup(ids), vals = [...new Set(ids.map(i => res[i]))].sort((a, b) => b - a);
    for (const v of vals){ const same = ids.filter(i => res[i] === v); if (same.length > 1){ tie++; msg(`¡Empate con <b>${v}</b>! Desempatan ${same.map(i => G.players[i].name).join(' y ')}`); await wait(1300); await rank(same); } else final.push(same[0]); }
  };
  await rank([...Array(n).keys()]);
  G.order = final; updatePlates(true);
  regSign(G.players[final[0]]); ov.querySelector('.rres').textContent = '1°';
  msg(`Empieza <b>${G.players[final[0]].name}</b>`);
  ov.querySelector('.rlist').innerHTML = final.map((i, k) => `<span style="--c:${G.players[i].color}"><i></i><b>${k + 1}°</b> ${G.players[i].name}</span>`).join('');
  const bt = ov.querySelector('.rbtn'); bt.innerHTML = '<button class="rcarve rgo">Colocar pueblos ▶</button>';
  bt.querySelector('.rgo').onclick = () => { SFX.click?.(); REG.extT = 0; regClose(); startSetup(); };
}
// online: each player rolls once on its own sign as soon as it joins; the host sorts the order when the match begins
async function netRegRoll(){
  const ov = $('#reg .rov'), { SW, top, MAIN } = SGN, yT = top - 36, EXT = 112, me = G.players[0];
  const at = (x, y) => { const [px, py] = sgPx(x, y); return `left:${px}px;top:${py}px`; };
  ov.innerHTML = `<div class="rtop" style="${at(-SW/2 + 92, yT - 68)};width:${SW - 104}px"><div class="rmsg"><b>Lanza los dados</b></div><div class="rsub">El que saque más empieza</div></div><div class="rext" style="${at(-SW/2 + 14, yT - MAIN - 4)};width:${SW - 28}px;height:${EXT - 8}px"><canvas class="rdice"></canvas><div class="rres"></div><div class="rbtn"></div></div>`;
  REG.extT = EXT; regSign(me); regDiceView(ov.querySelector('.rdice'));
  const bt = ov.querySelector('.rbtn');
  await new Promise(r => { bt.innerHTML = `<button class="rcarve rroll">${ic('dado')} Lanzar</button>`; bt.querySelector('.rroll').onclick = () => { bt.innerHTML = ''; r(); }; });
  const v = await rollRegDice(); ov.querySelector('.rres').textContent = v; ov.querySelector('.rmsg').innerHTML = `Sacaste <b>${v}</b>`;
  await wait(1200); REG.extT = 0; regClose(); netRegDone(v);
}
// the end of the first placement: your sign comes back and stretches to show what your villages will produce
function regSummary(onGo){
  const me = G.players[0], ov = regEnsure(), { SW, top, MAIN } = SGN, yT = top - 36, EXT = 132;
  REG.ext = 0; REG.extT = EXT; regSign(me);
  // how many tiles of each biome touch your villages
  const by = {}; G.verts.filter(x => x.building && x.building.p === 0).forEach(x => x.tiles.forEach(ti => { const t = G.tiles[ti]; by[t.type] = (by[t.type] || 0) + 1; }));
  const items = Object.keys(TERRAIN).filter(k => by[k]).map(k => ({ type: k, res: TERRAIN[k].res, n: by[k] }));
  const at = (x, y) => { const [px, py] = sgPx(x, y); return `left:${px}px;top:${py}px`; };
  ov.innerHTML = `<div class="rtop" style="${at(-SW/2 + 92, yT - 68)};width:${SW - 104}px"><div class="rmsg"><b>Biomas junto a tus pueblos</b></div><div class="rsub">Cada bioma que toca tus pueblos te dará su recurso cuando salga su número</div></div><div class="rext sum" style="${at(-SW/2 + 14, yT - MAIN - 4)};width:${SW - 28}px;height:${EXT - 8}px"><div class="rcells">${items.map((it, i) => `<div class="rcell"><canvas data-i="${i}"></canvas><span><em>×${it.n}</em></span><small class="rbio">${TERRAIN[it.type].label}</small></div>`).join('')}</div><div class="rbtn"><button class="rcarve rgo">¡A jugar! ▶</button></div></div>`;
  ov.querySelectorAll('canvas').forEach(cv => { const it = items[+cv.dataset.i]; if (!miniInit()) return; const o = spinner(it.res ? makeResourceItem(it.res) : iconModel('cactus'), 1.1);
    const mv = miniView(cv, { w: 52, h: 52, res: .9, fov: 30, fps: 30, tick: dt => { o.userData.inner.rotation.y += dt*1.4; } }); mv.sc.add(o); mv.cam.position.set(0, .35, 2.5); mv.cam.lookAt(0, 0, 0); REG.cells.push(mv); });
  ov.querySelector('.rgo').onclick = () => { SFX.click?.(); regClose(); onGo(); };
}

// ---------- first placement: snake order, the second village gives starting resources ----------
const SETUP = { queue: [], k: 0, v: null, prev: null };
function startSetup(){
  const o = G.order || [...G.players.keys()];
  SETUP.queue = [...o, ...[...o].reverse()]; SETUP.k = 0;
  G.setup = true; G.phase = 'setup';
  nextSetup();
}
async function nextSetup(){
  clearSetupMarkers(); setupPreview(null);
  if (SETUP.k >= SETUP.queue.length){ return finishSetup(); }
  const p = SETUP.queue[SETUP.k], round = SETUP.k < G.players.length ? 1 : 2, P = G.players[p];
  if (NG.on && !netOwns(p)){ G.current = p; G.phase = 'setup'; setupTip(`<i style="--c:${P.color}"></i><b>${P.name}</b> está colocando su ${round === 1 ? 'primer' : 'segundo'} pueblo…`); refresh(); netFlush(true); return; }
  NG.setupSeen = SETUP.k + ':' + p;
  G.current = p; refresh();
  if (p !== 0 || window.__autoSetup){
    setupTip(`<i style="--c:${P.color}"></i><b>${P.name}</b> está colocando su ${round === 1 ? 'primer' : 'segundo'} pueblo…`);
    await wait(900);
    const cands = G.verts.filter(distanceOK).map(v => ({ v, s: vscore(v) + Math.random()*1.6 })).sort((a, b) => b.s - a.s), v = cands[0].v;
    buildSettlement(p, v.id, true); if (round === 2) P.v2 = v.id; focusBoard?.(v.x, v.z, P.color); SFX.build?.(); await wait(700);
    const e = v.edges.map(id => G.edges[id]).map(e => { const o = G.verts[e.a === v.id ? e.b : e.a]; return { e, s: Math.max(0, ...o.adj.filter(x => x !== v.id).map(x => distanceOK(G.verts[x]) ? vscore(G.verts[x]) : 0)) + Math.random() }; }).sort((a, b) => b.s - a.s)[0].e;
    buildRoad(p, e.id, true); SFX.build?.();
    histPush(`${P.name} colocó su ${round === 1 ? 'primer' : 'segundo'} pueblo en <b>${v.name}</b>`, P.color);
    await wait(600); SETUP.k++; nextSetup(); return;
  }
  // the human chooses
  SETUP.round = round; G.phase = 'setupV';
  setupTip(`<i style="--c:${P.color}"></i>Coloca tu <b>${round === 1 ? 'primer' : 'segundo'} pueblo</b>${round === 2 ? ' · de sus terrenos elegirás tus recursos iniciales' : ''}`);
  setupMarkers('v', G.verts.filter(distanceOK));
  refresh();
}
// ---------- starting resources (the original rule, adjusted) ----------
// your second village gives as many resources as producing tiles it touches (0 to 3), like in the board game,
// but you share them out as you like among the kinds of those tiles (two of one and one of another, all three of one…)
function startAllowance(p){
  const v = G.verts[G.players[p].v2]; if (!v) return { n: 0, types: [] };
  const rs = v.tiles.map(ti => TERRAIN[G.tiles[ti].type].res).filter(Boolean);
  return { n: Math.min(3, rs.length), types: [...new Set(rs)] };
}
// a bot takes what its land produces least of, among what it is allowed and what a village and a road cost
function botStartPick(p){
  const { n, types } = startAllowance(p), prod = { madera: 0, ladrillo: 0, lana: 0, trigo: 0, mineral: 0 }, want = { madera: 3, ladrillo: 3, trigo: 2, lana: 2, mineral: 1 };
  G.verts.filter(v => v.building && v.building.p === p).forEach(v => v.tiles.forEach(ti => { const t = G.tiles[ti], r = TERRAIN[t.type].res; if (r && t.num) prod[r] += 6 - Math.abs(7 - t.num); }));
  const order = types.slice().sort((a, b) => (prod[a] - want[a]) - (prod[b] - want[b]) + (Math.random() - .5)*.5), got = {};
  for (let k=0;k<n;k++){ const r = order[k % order.length]; got[r] = (got[r] || 0) + 1; }
  return got;
}
function giveStart(p, got){ const P = G.players[p]; RES.forEach(r => P.res[r] += got[r] || 0); P.startPick = 0; }
// the picker, on your sign: tap a resource to add it, − to take it back
function startPick(onDone){
  const me = G.players[0], { types } = startAllowance(0), N = me.startPick || 0, got = {};
  if (!N || !types.length){ me.startPick = 0; onDone(); return; }
  const ov = regEnsure(), { SW, top, MAIN } = SGN, yT = top - 36, EXT = 150;
  REG.ext = 0; REG.extT = EXT; regSign(me);
  const at = (x, y) => { const [px, py] = sgPx(x, y); return `left:${px}px;top:${py}px`; }, total = () => Object.values(got).reduce((a, b) => a + b, 0);
  ov.innerHTML = `<div class="rtop" style="${at(-SW/2 + 92, yT - 68)};width:${SW - 104}px"><div class="rmsg"><b>Elige tus recursos iniciales</b></div><div class="rsub">Tu 2° pueblo te da ${N}: repártelos entre sus terrenos</div></div><div class="rext sum pick" style="${at(-SW/2 + 14, yT - MAIN - 4)};width:${SW - 28}px;height:${EXT - 8}px"><div class="rcells">${types.map(r => `<div class="rcell" data-r="${r}"><canvas></canvas><span><em class="n">0</em></span><small class="rbio">${RES_NAME[r]}</small><button class="rminus" title="Quitar">−</button></div>`).join('')}</div><div class="rbtn"><span class="rcount">0 / ${N}</span><button class="rcarve rgo" disabled>Listo ▶</button></div></div>`;
  const upd = () => { ov.querySelectorAll('.rcell').forEach(c => { const n = got[c.dataset.r] || 0; c.querySelector('.n').textContent = n; c.classList.toggle('on', n > 0); }); ov.querySelector('.rcount').textContent = `${total()} / ${N}`; ov.querySelector('.rgo').disabled = total() !== N; ov.querySelector('.rext').classList.toggle('full', total() >= N); };
  ov.querySelectorAll('.rcell').forEach(c => { const r = c.dataset.r;
    if (miniInit()){ const o = spinner(makeResourceItem(r), 1.1), mv = miniView(c.querySelector('canvas'), { w: 52, h: 52, res: .9, fov: 30, fps: 30, tick: dt => { o.userData.inner.rotation.y += dt*((got[r] || 0) ? 3 : 1.2); } }); mv.sc.add(o); mv.cam.position.set(0, .35, 2.5); mv.cam.lookAt(0, 0, 0); REG.cells.push(mv); }
    c.onclick = e => { if (e.target.closest('.rminus')){ if (got[r]){ got[r]--; SFX.click?.(); } } else if (total() < N){ got[r] = (got[r] || 0) + 1; SFX.coin?.() || SFX.click?.(); } upd(); }; });
  ov.querySelector('.rgo').onclick = () => { if (total() !== N) return; SFX.click?.(); regClose();
    if (NG.on && !netAuth()) netOp('start', { res: { ...got } });   // the one acting adds them; they arrive with its next state
    else { giveStart(0, got); let d = 0; RES.forEach(r => { if (got[r]){ const tok = invExpect(r, got[r]); for (let i=0;i<got[r];i++) flyToInventory(tok, innerWidth/2, innerHeight*.35, (d++)*140); } }); refresh(); }
    notify(`Empezaste con ${resStr(got)}`, me.color); onDone(); };
}
let SMARK = null;
function clearSetupMarkers(){ if (SMARK){ boardScene.remove(SMARK); SMARK.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); SMARK = null; } }
function setupMarkers(kind, list){
  clearSetupMarkers(); SMARK = new THREE.Group();
  list.forEach(x => {
    if (kind === 'v'){ const m = new THREE.Mesh(new THREE.SphereGeometry(.12, 16, 12), markerMat); m.position.set(x.x, .32, x.z); m.userData.setupV = x.id; SMARK.add(m); }
    else { const a = G.verts[x.a], b = G.verts[x.b], m = new THREE.Mesh(new THREE.BoxGeometry(.55, .07, .16), markerMat); m.position.set((a.x + b.x)/2, .25, (a.z + b.z)/2); m.rotation.y = Math.atan2(-(b.z - a.z), b.x - a.x); m.userData.setupE = x.id; SMARK.add(m); }
  });
  boardScene.add(SMARK);
}
function setupHover(e){
  if (!G || G.phase !== 'setupV' || !SMARK) return;
  setRay(e); const ho = ray.intersectObjects(SMARK.children, false)[0]?.object || nearPick(SMARK.children, wpos, e, 30);
  const vid = ho ? ho.userData.setupV : null;
  if (vid !== SETUP.hv){ SETUP.hv = vid; setupPreview(vid == null ? null : G.verts[vid]); SMARK.children.forEach(m => m.scale.setScalar(m.userData.setupV === vid ? 1.6 : 1)); canvas.style.cursor = vid == null ? '' : 'pointer'; }
}
function setupClick(e){
  setRay(e); const ho = SMARK && (ray.intersectObjects(SMARK.children, false)[0]?.object || nearPick(SMARK.children, wpos, e, 30)); if (!ho) return true; const hit = { object: ho };
  if (G.phase === 'setupV' && hit.object.userData.setupV !== undefined){
    const v = G.verts[hit.object.userData.setupV]; buildSettlement(0, v.id, true); SFX.build?.(); SETUP.v = v; if (SETUP.round === 2) G.players[0].v2 = v.id; setupPreview(null);
    G.phase = 'setupE'; setupTip(`<i style="--c:${G.players[0].color}"></i>Ahora coloca un <b>camino</b> junto a tu pueblo`);
    setupMarkers('e', v.edges.map(id => G.edges[id]).filter(ed => ed.road === null)); refresh(); return true;
  }
  if (G.phase === 'setupE' && hit.object.userData.setupE !== undefined){
    buildRoad(0, hit.object.userData.setupE, true); SFX.build?.();
    histPush(`Colocaste tu ${SETUP.round === 1 ? 'primer' : 'segundo'} pueblo en <b>${SETUP.v.name}</b>`, G.players[0].color);
    SETUP.k++; G.phase = 'setup'; clearSetupMarkers(); setTimeout(nextSetup, 400); return true;
  }
  return true;
}
// ---------- the centered panel: rotating models of the resources a spot (or all your villages) will give ----------
function setupPreview(v){
  pbEnsure();
  PB.prevHtml = v ? `<span class="pc" style="justify-content:center;font-size:12px">${v.port ? `⚓ ${v.port === '3:1' ? '3:1' : '2:1'}<br>` : ''}te dará</span>` + v.tiles.map(ti => { const t = G.tiles[ti], r = TERRAIN[t.type].res; return `<span class="pc">${r ? `<span class="m3" data-k="${r}"></span>` : `<span style="font-size:22px;line-height:32px">${TERRAIN_ICON[t.type] || '·'}</span>`}${t.num ? `<em class="${t.num === 6 || t.num === 8 ? 'hot' : ''}">${t.num}<small>${'•'.repeat(pips(t.num))}</small></em>` : `<em>—</em>`}</span>`; }).join('') : '';
  renderTip();
}
function finishSetup(){
  setupTip(''); clearSetupMarkers();
  G.setup = false; updateLongest?.();
  const first = (G.order || [0])[0];
  // bots pick their starting resources now; people pick on their own sign
  G.players.forEach((P, i) => { if (P.bot){ const got = botStartPick(i); giveStart(i, got); if (Object.keys(got).length) notify(`${P.name} empezó con ${resStr(got)}`, P.color); } else P.startPick = startAllowance(i).n; });
  if (NG.on){ setupPreview(null); G.current = first; G.phase = 'roll'; G.turnId++; notify(`Empieza ${G.players[first].name}`, G.players[first].color); refresh(); netFlush(true); startPick(() => regSummary(() => {})); netKick(); return; }
  const go = () => { setupPreview(null); G.current = first; G.phase = 'roll'; G.turnId++; refresh(); setTimeout(() => { if (G && !(G.quests || []).length) assignQuestFor0(); }, 6000);
    notify(first === 0 ? '🔔 <b>Empiezas tú:</b> tira los dados' : `Empieza ${G.players[first].name}`, G.players[first].color, 'sys');
    if (G.players[first].bot) botTurn(first); else SFX.turn?.(); };
  startPick(() => regSummary(go));
}

