// ================= START =================
function newGame(n, board){
  disposeCtx(); exitBuild(); hidePopup(); highlightPieces(null); DICE3D.length = 0;
  HIST.length = 0; setTimeout(renderNews, 50);
  G = newGameState(n || GAME_MODE.players, board || null); G.quests = [];
  G.setup = true; G.phase = 'register'; G.order = null;
  buildBoardScene();
  camera.fov = 45; camera.rotation.order = 'XYZ'; camera.updateProjectionMatrix();
  camera.position.set(0, 11.2, 9.6); controls.target.set(0,0,1.5); controls.enabled = true; controls.update();
  mode = 'board'; document.body.dataset.mode = 'board';
  document.querySelectorAll('.die').forEach(el => el.textContent = '–');
  $('#log-list').innerHTML = '';
  refresh();
}
let UI_S = 1;
function uiScale(){ const b = Math.min(innerWidth/1440, innerHeight/860); UI_S = clamp(Math.min(2*b, innerWidth*.74/790, innerHeight/560), .6, 2.6); document.documentElement.style.setProperty('--ui', UI_S); }
uiScale(); addEventListener('resize', uiScale);
// ---- every on-screen group can be resized by dragging its grip
const KSIZE = { corner: 1, hex: 1, hud: 1 };
// limits so the screen never gets crowded nor too tiny: [min, max, largest share of the window width, of its height]
const KLIM = { corner: [.8, 1.3, .74, .3], hex: [.75, 1.25, .9, .36], hud: [.8, 1.4, .2, .5] };
function applyK(){ Object.entries(KSIZE).forEach(([k, v]) => document.documentElement.style.setProperty('--k-' + k, v)); setTimeout(cornerBottom, 0); }
function cornerBottom(){ const c = $('#corner'); if (c) document.documentElement.style.setProperty('--corner-b', Math.round(c.getBoundingClientRect().bottom) + 'px'); }
try { Object.assign(KSIZE, JSON.parse(localStorage.getItem('hexterra-ksize') || '{}')); } catch {}
Object.keys(KSIZE).forEach(k => KSIZE[k] = clamp(+KSIZE[k] || 1, KLIM[k][0], KLIM[k][1]));
applyK(); addEventListener('resize', () => setTimeout(cornerBottom, 50));
function addGrip(el, key, dirFn){
  if (!el || el.querySelector(':scope > .rzgrip')) return; const g = document.createElement('i'); g.className = 'rzgrip'; g.title = 'Arrastra para cambiar el tamaño'; el.appendChild(g);
  let op = null;
  g.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); op = { x: e.clientX, y: e.clientY, k: KSIZE[key] }; g.classList.add('on'); try { g.setPointerCapture(e.pointerId); } catch {} });
  g.addEventListener('pointermove', e => { if (!op) return; const d = dirFn(e.clientX - op.x, e.clientY - op.y), L = KLIM[key], prev = KSIZE[key]; KSIZE[key] = clamp(op.k*(1 + d/260), L[0], L[1]); applyK();
    const r = el.getBoundingClientRect(); if (KSIZE[key] > prev && (r.width > innerWidth*L[2] || r.height > innerHeight*L[3])){ KSIZE[key] = prev; applyK(); } g.classList.toggle('lim', KSIZE[key] <= L[0] + .001 || KSIZE[key] === prev); });
  const end = () => { if (!op) return; op = null; g.classList.remove('on'); try { localStorage.setItem('hexterra-ksize', JSON.stringify(KSIZE)); } catch {} if (typeof dockWins === 'function') dockWins(); };
  g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
  g.addEventListener('click', e => e.stopPropagation(), true);
}
let CORNER_SIDE = (() => { try { return localStorage.getItem('hexterra-corner') || 'r'; } catch { return 'r'; } })();
function layoutCorner(){
  let c = $('#corner'); if (!c){ c = document.createElement('div'); c.id = 'corner'; document.body.appendChild(c); cornerDrag(c); }
  const order = CORNER_SIDE === 'r' ? ['#news-board', '#quest-icon', '#players', '#hud-right'] : ['#hud-right', '#players', '#news-board', '#quest-icon'];
  c.append(...order.map(q => $(q)).filter(Boolean));
  c.style.left = c.style.right = ''; c.classList.toggle('left', CORNER_SIDE === 'l'); document.body.dataset.corner = CORNER_SIDE;
  addGrip(c, 'corner', (dx, dy) => (CORNER_SIDE === 'r' ? -dx : dx) + dy); addGrip($('#hud-right'), 'hud', (dx, dy) => dy);
  setTimeout(() => { cornerBottom(); if (typeof dockWins === 'function') dockWins(); }, 0);
}
// the whole group of signs can be dragged; it sticks to the closest side (board / missions icons always face the center)
function cornerDrag(c){
  let op = null, block = false;
  c.addEventListener('pointerdown', e => { if (e.button || e.target.closest('.rzgrip')) return; const r = c.getBoundingClientRect(); op = { x0: e.clientX, y0: e.clientY, l: r.left, moved: 0, id: e.pointerId }; }, true);
  addEventListener('pointermove', e => { if (!op) return; const dx = e.clientX - op.x0; op.moved = Math.max(op.moved, Math.abs(dx) + Math.abs(e.clientY - op.y0));
    if (op.moved > 8){ c.classList.add('drag'); c.style.right = 'auto'; c.style.left = (op.l + dx) + 'px'; c.style.transformOrigin = 'top left'; } });
  addEventListener('pointerup', () => { if (!op) return; const moved = op.moved > 8; op = null; if (!moved) return;
    block = true; setTimeout(() => block = false, 60); c.classList.remove('drag'); const r = c.getBoundingClientRect(); c.style.transformOrigin = '';
    CORNER_SIDE = r.left + r.width/2 < innerWidth/2 ? 'l' : 'r'; try { localStorage.setItem('hexterra-corner', CORNER_SIDE); } catch {} SFX.click?.(); layoutCorner(); });
  c.addEventListener('click', e => { if (block){ e.stopPropagation(); e.preventDefault(); } }, true);
}
renderResourceIcons();
renderSpecialIcons();
document.documentElement.style.setProperty('--plate', `url(${plateURL()})`);
initNews();
initQuestIcon();
document.documentElement.style.setProperty('--paperimg', `url(${paperURL()})`);
initPlates();
initNews3D();

initCenterBtn();
layoutCorner();
initInventory();
initSpecialWin();
initQuestPanel();
initHexbar();
addGrip($('#hexbar'), 'hex', (dx, dy) => dx - dy);
initCardFan(); initAmuletBox();
renderCardArt();
(document.fonts?.ready || Promise.resolve()).then(() => { renderCardArt(); renderFan(); });
$('#b-road small').innerHTML = resImg('madera') + resImg('ladrillo');
$('#b-set small').innerHTML = ['madera','ladrillo','lana','trigo'].map(k => resImg(k)).join('');
$('#b-city small').innerHTML = resImg('trigo').repeat(2) + resImg('mineral').repeat(3);
newGame();
openMainMenu();
const updSoundBtn = () => { $('#b-sound').innerHTML = ic(SND.on ? 'cuerno' : 'cuerno-off'); $('#b-sound').title = SND.on ? 'Sonido: activado' : 'Sonido: apagado'; };
const updCycleBtn = () => { const b = $('#b-cycle'); b.innerHTML = ic(DAY.fixed ? 'sol' : 'luna'); b.title = DAY.fixed ? 'Ciclo de día y noche: apagado (siempre de día) · toca para activarlo' : 'Ciclo de día y noche: activado · toca para dejar siempre de día'; document.body.classList.toggle('nocycle', DAY.fixed); };
updCycleBtn();
$('#b-cycle').onclick = () => { DAY.fixed = !DAY.fixed; try { localStorage.setItem('hexterra-cycle', DAY.fixed ? 'off' : 'on'); } catch {} updCycleBtn(); SFX.click?.(); };
updSoundBtn();
$('#b-sound').onclick = () => { audioInit(); setSound(!SND.on); updSoundBtn(); };
$('#b-time').onclick = () => skipToNextPhase();
setRetro(true);   // the pixel look is always on
// brass-and-cloth skins for every button (same look as the hexagonal action buttons)
(function initButtonSkins(){
  const tex = (w, base, pal, f) => { const cv = document.createElement('canvas'); cv.width = cv.height = w; const c = cv.getContext('2d'), R = mulberry32(base.length*31 + w); c.fillStyle = base; c.fillRect(0, 0, w, w); for (let i=0;i<w*w*.45;i++){ c.fillStyle = pal[Math.floor(R()*pal.length)]; c.fillRect(Math.floor(R()*w), Math.floor(R()*w), 1 + Math.floor(R()*2), 1); } if (f) f(c, R); return `url(${cv.toDataURL()})`; };
  const cloth = (base, pal) => tex(24, base, pal, c => { for (let y=0;y<24;y+=2){ c.fillStyle = 'rgba(255,255,255,.035)'; c.fillRect(0, y, 24, 1); } });
  const st = document.documentElement.style;
  st.setProperty('--pbtex', `url(${pbTex()})`);
  st.setProperty('--brassimg', tex(32, '#a8823a', ['#8e6a2c', '#bf9a4a', '#7a5a24', '#d8b860', '#6e7a4a', '#9a7432']));
  st.setProperty('--cloth-g', cloth('#3e4a2a', ['#36421f', '#4a5832', '#2f3a1c', '#46522c']));
  st.setProperty('--cloth-r', cloth('#5e1e28', ['#521a22', '#6e2630', '#48161e', '#682430']));
  st.setProperty('--cloth-d', cloth('#2a2420', ['#221d1a', '#332b26', '#1d1916', '#2e2622']));
  st.setProperty('--cloth-y', cloth('#7a5a1a', ['#6e5016', '#8a6a22', '#5e4412', '#846020']));
})();
addEventListener('pointerdown', () => audioInit(), { once: false, passive: true });
