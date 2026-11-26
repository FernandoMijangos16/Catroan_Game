// ================= PLAYER SIGNS hanging from a rope in the player's color =================
const PLATES = [];
const signW = () => (G && G.players.length > 4 ? .84 : 1)*150;
function ropeMesh(a, b, mat){ const d = new THREE.Vector3().subVectors(b, a), len = d.length(), m = new THREE.Mesh(GEO.cyl, mat); m.scale.set(1.3, len, 1.3); m.position.copy(a); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m; }
function initPlates(){
  const box = $('#players'); box.innerHTML = '';
  if (!miniInit()) return;
  const A = houseAssets();
  const wood = signWoodMat(false), woodD = signWoodMat(true);
  PLAYER_DEFS.forEach((d, i) => {
    const el = document.createElement('div'); el.className = 'pl'; el.innerHTML = '<canvas></canvas><b class="ordb"></b><b class="fxb"></b><i class="think"><i></i><i></i><i></i></i>'; box.appendChild(el);
    el.style.cursor = 'pointer';
    if (i === 0) el.addEventListener('click', () => G && !G.amuletPick && !NG.on && chooseAvatar()); else el.addEventListener('click', e => { e.stopPropagation(); if (!G) return; if (G.amuletPick) amuletPlate(i); else plateMenu(i, el); });
    const H = 104, pl = { el, i, last: {} };
    const v = miniView(el.querySelector('canvas'), { w: signW(), h: H, ortho: true, res: 1, fps: 20, tick: (dt, t) => { pl.sign.rotation.z = Math.sin(t*1.25 + i*1.7)*(pl.act ? .035 : .018); pl.items.forEach(s => { s.userData.inner.rotation.y += dt*1.1; s.rotation.z = .22; }); } });
    pl.v = v;
    const ropeM = keepMat(new THREE.MeshStandardMaterial({ color: new THREE.Color(d.color), roughness: .85, flatShading: true }));
    const brass = keepMat(new THREE.MeshStandardMaterial({ color: 0x9a7434, metalness: .45, roughness: .5, flatShading: true, envMap: IT.env, envMapIntensity: .5 }));
    pl.build = () => {
      v.sc.children.filter(o => o.userData.signRoot).forEach(o => v.sc.remove(o));
      const W = signW(), Z = 1; v.resize(W*Z, H*Z); v.cam.zoom = Z; v.cam.updateProjectionMatrix();
      const root = new THREE.Group(); root.userData.signRoot = true; v.sc.add(root);
      const top = H/2 - 4, iron = ironMat(), nm0 = G && G.players[i] ? G.players[i] : d;
      root.add(mesh(GEO.box, iron, 0, top - 2, 1, 7, 4, 3)); root.add(ironRing(iron, 0, top - 3, 2.6));
      const sign = new THREE.Group(); sign.position.set(0, top - 3, 0); root.add(sign); pl.sign = sign;
      const SW = W - 10, SH = 76, sy = -18;
      [-SW/2 + 12, SW/2 - 12].forEach(x => { sign.add(ropeMesh(new THREE.Vector3(0, 0, 2), new THREE.Vector3(x, sy + 3, 2), ropeMat(nm0.color))); sign.add(ironRing(iron, x, sy + 1, 2.4)); });
      const bd = rusticBoard(SW, SH, i + 1, { ph: 25.4 }); bd.position.y = sy; sign.add(bd);
      // section 1: portrait in a rough nailed frame + name burnt into the top plank
      const px = -SW/2 + 21, pyc = sy - 21, frM = plankMat(6, 0x4a301c);
      [[0, 15, 32, 4], [0, -15, 32, 4], [-14, 0, 4, 30], [14, 0, 4, 30]].forEach(([dx, dy, w, h], k) => { const f = mesh(GEO.box, frM, px + dx, pyc + dy - h/2, 6, w, h, 3); f.rotation.z = (k - 1.5)*.012; sign.add(f); });
      [[-14, 15], [14, -15]].forEach(([dx, dy]) => sign.add(mesh(GEO.sphere, iron, px + dx, pyc + dy, 8, 1.2, 1.2, .9)));
      pl.avTex = pl.avTex || (() => { const t = new THREE.CanvasTexture(avatarCanvas('campesino')); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; return t; })();
      const por = new THREE.Mesh(sg(new THREE.PlaneGeometry(1, 1)), keepMat(new THREE.MeshStandardMaterial({ map: pl.avTex, roughness: .8 }))); por.scale.set(25, 27, 1); por.position.set(px, pyc, 6.5); sign.add(por);
      const nm = burntPlane(nm0.name, 100, 20, 16); nm.scale.set(SW - 46, 19, 1); nm.position.set(18, sy - 13, 3.2); sign.add(nm);
      // an iron strap across, then the bottom row: points · resource crate · development cards
      sign.add(mesh(GEO.box, iron, 8, sy - 39, 3.6, SW - 44, 2.6, 1.2)); [-SW/2 + 40, SW/2 - 6].forEach(x => sign.add(mesh(GEO.sphere, iron, x, sy - 37.7, 4.6, 1.1, 1.1, .8)));
      const cells = 3, cw = (SW - 6)/cells, y0 = sy - SH; pl.items = []; pl.tags = [];
      const MS = Math.min(25, cw*.56);
      const models = [spinner(cardModel('punto'), MS), spinner(crateModel(), MS*.95), spinner((() => { const g = cardMesh(); g.traverse(o => { if (o.isMesh && Array.isArray(o.material)) o.material = o.material.map((m, k) => k >= 4 ? keepMat(new THREE.MeshStandardMaterial({ map: cardBackTex(nm0.color), roughness: .8 })) : m); }); return g; })(), MS)];
      models.forEach((s, c) => { const x0 = -SW/2 + 3 + cw*c, cx = x0 + cw*.34; s.position.set(cx, y0 + 19, 16); sign.add(s); pl.items.push(s);
        const tag = burntPlane('0', 22, 16, 13, { num: true }); tag.scale.set(17, 13, 1); tag.position.set(x0 + cw*.8, y0 + 13, 3.3); sign.add(tag); pl.tags.push(tag); });
      const brass = iron;
      outlineItem(sign);
      pl.last = {}; pl.brass = brass;
    };
    pl.build(); PLATES.push(pl);
  });
  addEventListener('resize', () => { PLATES.forEach(p => p.build()); updatePlates(true); renderFan(); });
}
function plateMenu(i, el){
  const old = $('#pl-menu'); if (old){ old.remove(); if (+old.dataset.i === i) return; }
  const P = G.players[i], r = el.getBoundingClientRect();
  const can = !G.over && !G.players[0].bot && tradesLeft(0, i) > 0 && ((G.current === 0 && G.phase === 'main') || (!NG.on && G.current === i && G.tradeOpen === G.turnId));
  const why = G.over ? 'La partida terminó.' : !tradesLeft(0, i) ? tradeLimitMsg(P.name) : G.current === 0 ? 'Primero tira los dados.' : G.current !== i ? `Fuera de tu turno solo puedes cambiar con ${G.players[G.current].name}.` : `Espera a que ${P.name} haga un trueque primero.`;
  const m = document.createElement('div'); m.id = 'pl-menu'; m.dataset.i = i;
  m.innerHTML = `<button ${can ? '' : 'disabled'}><i class="dot" style="background:${P.color}"></i> Proponer trueque a ${P.name}</button>${can ? '' : `<small>${why}</small>`}`;
  m.style.left = (r.left + r.width/2) + 'px'; m.style.top = (r.bottom + 2) + 'px'; document.body.appendChild(m); SFX.click?.();
  m.querySelector('button').onclick = e => { e.stopPropagation(); m.remove(); tradeLetter(i); };
  const h = e => { if (!m.contains(e.target) && !el.contains(e.target)){ m.remove(); removeEventListener('pointerdown', h, true); } };
  setTimeout(() => addEventListener('pointerdown', h, true), 0);
}
function updatePlates(force){
  if (!G || !PLATES.length) return;
  { const box = $('#players'); if (G.order && box.dataset.ord !== G.order.join()){ box.dataset.ord = G.order.join(); G.order.forEach(i => PLATES[i] && box.appendChild(PLATES[i].el)); } else if (!G.order && box.dataset.ord){ box.dataset.ord = ''; PLATES.forEach(pl => box.appendChild(pl.el)); } }
  PLATES.forEach(pl => {
    const P = G.players[pl.i]; pl.el.style.display = P ? '' : 'none'; if (!P) return;
    if (pl.lastN !== G.players.length){ pl.lastN = G.players.length; pl.build(); pl.last = {}; }
    const act = pl.i === G.current && !G.over, tot = total(P), dev = P.cards ? P.cards.length : 0, pts = vp(pl.i);
    if (!P.avatar) P.avatar = pl.i === 0 ? ((() => { try { return localStorage.getItem('hexterra-avatar'); } catch { return null; } })() || 'campesino') : (() => { const used = G.players.map(x => x.avatar), free = AVATARS.filter(a => !used.includes(a.id)); return free[Math.floor(G.id*1e6 + pl.i*7) % free.length].id; })();
    P.avatar = avOk(P.avatar);
    pl.act = act; pl.el.classList.toggle('active', act); pl.el.classList.toggle('me', pl.i === 0);
    { const f = P.fx || {}, PIC = { trigo: 'calavera', madera: 'fuego', mineral: 'montana', ladrillo: 'ola', lana: 'frasco' }, fb = pl.el.querySelector('.fxb'); if (fb){ const t = (f.ojo ? 'ojo' : '') + (f.plague ? ' ' + PIC[f.plague.res] : '') + (amCount(pl.i, 'escudo') ? ' escudo' : ''); if (fb.dataset.t !== t){ fb.dataset.t = t; fb.innerHTML = t.trim().split(/\s+/).filter(Boolean).map(k => ic(k)).join(''); } fb.style.display = t ? '' : 'none'; fb.title = [f.ojo ? `Ojo turbio sobre el ${f.ojo.num}` : '', f.plague ? AMULETS[f.plague.k].name + ': ' + PLAGUE_TXT[f.plague.res] : ''].filter(Boolean).join(' · '); } }
    { const oi = G.order ? G.order.indexOf(pl.i) : -1, ob = pl.el.querySelector('.ordb'); if (ob){ ob.textContent = oi >= 0 ? (oi + 1) + '°' : ''; ob.style.display = oi >= 0 ? '' : 'none'; } }
    if (pl.last.nm !== P.name + P.color){ if (pl.last.nm !== undefined || pl.built !== P.name + P.color){ pl.build(); } pl.built = pl.last.nm = P.name + P.color; }
    if (force || pl.last.av !== P.avatar){ pl.last.av = P.avatar; pl.avTex.image = avatarCanvas(P.avatar); pl.avTex.needsUpdate = true; }
    [pts, tot, dev].forEach((n, k) => { if (force || pl.last['n' + k] !== n){ pl.last['n' + k] = n; const m = pl.tags[k].material; m.map = burntTex(String(n), 22, 16, 13, { num: true }); m.needsUpdate = true; } });
    pl.el.querySelector('.think').style.display = act && P.bot ? 'flex' : 'none';
    if (pl.last.act !== act){ pl.last.act = act; pl.sign.traverse(o => { if (o.isMesh && (o.material === ironMat() || o.material === ironMat(true))) o.material = ironMat(act); }); }
    pl.el.title = (pl.i === 0 ? 'Toca para cambiar tu avatar · ' : 'Toca para proponer un trueque · ') + `${P.name}: ${pts} puntos, ${tot} recursos, ${dev} de desarrollo${G.army === pl.i ? ' · Guardia más poderosa' : ''}${G.longest === pl.i ? ' · Camino más largo' : ''}`;
  });
}

