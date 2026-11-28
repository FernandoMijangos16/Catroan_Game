// ================= NOTICE BOARD (3D model rendered next to the players) WITH GAME HISTORY =================
const HIST = [];
let NEWS_T = null, NOTE_TEX = null;
function noteTex(){
  if (NOTE_TEX) return NOTE_TEX;
  NOTE_TEX = pxTex(16, 20, (c) => { c.fillStyle = '#efe2c2'; c.fillRect(0, 0, 16, 20); c.fillStyle = '#d8c69c'; c.fillRect(0, 19, 16, 1); c.fillRect(15, 0, 1, 20); for (let y = 5; y < 18; y += 3){ c.fillStyle = '#6a5a48'; c.fillRect(2, y, 6 + ((y*7) % 7), 1); } c.fillStyle = '#3a2a1a'; c.fillRect(2, 2, 9, 1); });
  return NOTE_TEX;
}
function noticeBoardModel(colors){
  const A = houseAssets(), g = new THREE.Group(), W = wallMats('plank', 0xffffff);
  const wood = hmat('nbwood', () => new THREE.MeshStandardMaterial({ map: A.tex.plank.plain, color: 0xb08a60, roughness: .9 }));
  const dark = hmat('nbdark', () => new THREE.MeshStandardMaterial({ map: A.tex.plank.plain, color: 0x7a5434, roughness: .9 }));
  [-.62, .62].forEach(x => { const p = new THREE.Mesh(GEO.box, dark); p.scale.set(.1, 1.45, .1); p.position.set(x, 0, 0); g.add(p); });
  const back = new THREE.Mesh(GEO.box, wood); back.scale.set(1.3, .85, .06); back.position.set(0, .45, 0); g.add(back);
  [[0, .44, 1.38, .07], [0, 1.31, 1.38, .07]].forEach(([x, y, w, h]) => { const b = new THREE.Mesh(GEO.box, dark); b.scale.set(w, h, .1); b.position.set(x, y - h/2, .02); g.add(b); });
  const rf = new THREE.Mesh(ROOF_GEO, [roofMat('shingle', 0x8a5a3a), wood]); rf.scale.set(1.55, .32, .42); rf.position.set(0, 1.4, 0); g.add(rf);
  const notes = [[-.38, .98, .1], [.02, 1.02, -.06], [.4, .95, .12], [-.3, .66, -.1], [.12, .68, .05], [.45, .62, -.12]];
  const nm = hmat('note', () => new THREE.MeshStandardMaterial({ map: noteTex(), roughness: 1 }));
  colors.slice(0, 6).forEach((col, i) => {
    const [x, y, r] = notes[i], n = new THREE.Mesh(GEO.box, nm); n.scale.set(.26, .3, .01); n.position.set(x, y - .15, .035); n.rotation.z = r; g.add(n);
    const pin = mesh(GEO.sphere, col, x, y + .1, .05, .035, .035, .035); g.add(pin);
  });
  const sign = new THREE.Mesh(GEO.box, dark); sign.scale.set(.5, .14, .04); sign.position.set(0, 1.18 - .07, .06); g.add(sign);
  g.traverse(o => { if (o.isMesh){ o.castShadow = true; } });
  return outlineItem(g);
}
function snapInit(){ if (!SNAP.r) snapModel('__init', () => new THREE.Group()); return !!SNAP.r; }
function renderNews(){
  NEWS3D.dirty = true;
  const n = $('#news-board .nb-n'); if (n){ n.textContent = HIST.length > 99 ? '99+' : HIST.length; n.style.display = HIST.length ? 'block' : 'none'; }
  if ($('#news').classList.contains('show')) fillNews();
}
function histPush(html, color){
  if (NG.on && !NG.relaying && !NG.inLog && netAuth()) netSend({ t: 'hist', h: packHtml(html), c: color, f: NG.seat });
  HIST.unshift({ html, color, t: G ? G.turnId : 0, spec: actionSpec(html, color) }); if (HIST.length > 120) HIST.pop();
  clearTimeout(NEWS_T); NEWS_T = setTimeout(renderNews, 250);
  const nb = $('#news-board'); if (nb){ nb.classList.remove('bump'); void nb.offsetWidth; nb.classList.add('bump'); }
}
const QICON = { v: null };
// quest letter: a thick, slightly curled sheet with a pixel house, a red seal blot, ink lines and a signature + red quill
function questLetterTex(){
  return pxTex(40, 52, (c, w, h) => {
    for (let y=0;y<h;y++) for (let x=0;x<w;x++){ const n = hash2(x, y, 71), e = Math.min(x, y, w - 1 - x, h - 1 - y), d = e < 2 ? .78 : e < 4 ? .9 : 1, blot = hash2(x >> 2, y >> 2, 72) > .86 ? .9 : 1;
      const r = (196 + n*26)*d*blot, g = (172 + n*22)*d*blot, bl = (112 + n*18)*d*blot; c.fillStyle = `rgb(${r|0},${g|0},${bl|0})`; c.fillRect(x, y, 1, 1); }
    c.fillStyle = '#3a2416'; // little house icon
    c.fillRect(6, 10, 8, 6); c.fillRect(7, 8, 6, 2); c.fillRect(8, 6, 4, 2); c.fillRect(9, 5, 2, 1); c.fillStyle = '#c9a868'; c.fillRect(9, 12, 2, 4);
    c.fillStyle = '#9c1c16'; [[17,5,6,4],[16,7,9,3],[19,10,3,3],[20,13,1,2],[23,6,2,2]].forEach(r => c.fillRect(...r)); // red seal blot
    c.fillStyle = '#7a1410'; [[25,9,2,3],[28,8,1,4],[30,9,2,3],[33,8,1,4],[29,10,2,1]].forEach(r => c.fillRect(...r));
    c.fillStyle = '#3a2416'; [[7,20,24],[9,24,24],[8,28,22],[10,32,20],[9,36,18]].forEach(([x, y, l]) => c.fillRect(x, y, l, 2));
    c.fillStyle = '#4a3046'; [[22,42,8,1],[20,43,4,2],[24,44,3,1],[27,43,5,1]].forEach(r => c.fillRect(...r));
  });
}
function questIconModel(){
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(.8, 1.04, .05, 6, 8, 1), pos = geo.attributes.position;
  for (let i=0;i<pos.count;i++){ const x = pos.getX(i), y = pos.getY(i); pos.setZ(i, pos.getZ(i) + .06*Math.sin(x*3.4 + 1) + .05*Math.cos(y*2.6) + Math.max(0, y - .3)*Math.max(0, x)*.35); }
  geo.computeVertexNormals();
  const edge = keepMat(new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 1, flatShading: true }));
  const front = keepMat(new THREE.MeshStandardMaterial({ map: questLetterTex(), roughness: 1, flatShading: true }));
  const back = keepMat(new THREE.MeshStandardMaterial({ map: parchTex(), color: 0xc8b088, roughness: 1, flatShading: true }));
  const sheet = new THREE.Mesh(geo, [edge, edge, edge, edge, front, back]); sheet.rotation.z = .32; g.add(sheet);
  const q = quill3D(), red = keepMat(new THREE.MeshStandardMaterial({ map: m3().featherTex, color: 0xd83a2a, roughness: .9, flatShading: true, side: THREE.DoubleSide }));
  q.traverse(o => { if (o.isMesh && o.material === m3().feather) o.material = red; }); q.scale.setScalar(.72); q.position.set(.4, -.2, .22); q.rotation.set(.3, -.2, -.5); g.add(q);
  outlineItem(sheet);
  return g;
}
function initQuestIcon(){
  const el = document.createElement('div'); el.id = 'quest-icon'; el.title = 'Misiones'; el.innerHTML = '<canvas></canvas><b class="nb-n"></b>';
  $('#news-board').after(el); el.addEventListener('click', e => { e.stopPropagation(); if (!tutAllow('misiones')) return; SFX.click?.(); openQuests(); });
  if (!miniInit()) return;
  const o = spinner(questIconModel(), 1.25);
  const v = miniView(el.querySelector('canvas'), { w: 62, h: 62, res: .75, fov: 30, fps: 24, tick: (dt, t) => { o.userData.inner.rotation.y = t*.9; } });
  v.sc.add(o); v.cam.position.set(0, .1, 2.7); v.cam.lookAt(0, 0, 0); QICON.v = v;
}
function updateQuestIcon(){ const n = G ? (G.quests || []).filter(q => q.p === 0 && q.state !== 'done').length : 0, b = $('#quest-icon .nb-n'); if (b){ b.textContent = n; b.style.display = n ? 'block' : 'none'; } }
function initNews(){
  const nb = document.createElement('div'); nb.id = 'news-board'; nb.title = 'Tablón de anuncios: historial de la partida';
  nb.innerHTML = '<canvas width="96" height="96"></canvas><b class="nb-n"></b>';
  $('#players').after(nb);
  const panel = document.createElement('div'); panel.id = 'news'; document.body.appendChild(panel);
  nb.addEventListener('click', e => { e.stopPropagation(); if (panel.classList.contains('show')) closeParchPanel(panel); else { openParchPanel(panel); fillNews(); } });
  addEventListener('pointerdown', e => { if (panel.classList.contains('show') && !panel.contains(e.target) && !nb.contains(e.target)) closeParchPanel(panel); });
  renderNews();
}
function fillNews(){
  const panel = $('#news'); panel.style.setProperty('--paper', `url(${paperURL()})`);
  const r = $('#news-board').getBoundingClientRect(), pw = parseFloat(panel.style.width) || 470; panel.style.left = Math.min(innerWidth - pw - 8, Math.max(8, r.left + r.width/2 - pw/2)) + 'px'; panel.style.top = (r.bottom + 4) + 'px';
  const actImg = S => S.model ? snapModel('act:' + S.model + ':' + S.p, () => actModelObj(S)) : S.act === 'amuleto' ? snapModel('am:' + S.amulet, () => amuletModel(S.amulet)) : iconImg(S.act);
  const rows = HIST.slice(0, 60).map(h => { const S = h.spec || actionSpec(h.html, h.color), hasItems = Object.keys(S.items).length;
    const res = (S.victim >= 0 && (S.act === 'amuleto' || S.model === 'ladron' || S.act === 'cuchillo' || S.act === 'bomba') ? `<span class="aarrow"><img src="${iconImg('flecha')}"></span>${whoHTML(S.victim, 'victim sm')}` : '') + (S.piece ? `<span class="aarrow"><img src="${iconImg('flecha')}"></span><img class="npz" src="${snapModel('act:' + S.piece + ':' + S.p, () => modelObj(S.piece, Math.max(0, S.p)))}">` : '') + (hasItems ? `<span class="aarrow"><img src="${iconImg('flecha')}"></span><div class="aitems">${itemsHTML(S.items, false)}</div>` : '');
    return `<div class="nrow2" style="--pc:${h.color}">${whoHTML(S.p, 'sm')}<div class="aact"><img src="${actImg(S)}"><small>${S.cap}</small></div>${res}</div>`; }).join('');
  ensureParchPanel(panel).innerHTML = deEmo(`<div class="ntitle">Tablón de anuncios</div><div class="nlist">${rows || '<div class="ntxt" style="text-align:center;padding:10px">Aún no pasa nada en la isla</div>'}</div>`);
}
