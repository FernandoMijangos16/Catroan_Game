// ================= START =================
function newGame(n, board, seed){
  disposeCtx(); exitBuild(); hidePopup(); highlightPieces(null); DICE3D.length = 0;
  HIST.length = 0; setTimeout(renderNews, 50);
  G = newGameState(n || GAME_MODE.players, board || null, seed ?? null); G.quests = []; G.evOn = GAME_OPTS.events !== false;
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
// ---------- one way to edit every board panel: brass frame on hover, a name plate to move it, four corners to resize ----------
// (the floating inventories build the same pieces themselves: ui/inventory.js). Double click on the plate = back to normal.
function edCorners(el, onDown, onMove, onEnd){
  ['tl', 'tr', 'bl', 'br'].forEach(c => { const h = document.createElement('i'); h.className = 'edc ' + c; h.dataset.c = c; h.title = 'Arrastra para cambiar el tamaño'; el.appendChild(h);
    let op = null;
    h.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); op = { x: e.clientX, y: e.clientY }; onDown(); el.classList.add('edit'); try { h.setPointerCapture(e.pointerId); } catch {} });
    h.addEventListener('pointermove', e => { if (!op) return; const dx = e.clientX - op.x, dy = e.clientY - op.y; onMove((c[1] === 'r' ? dx : -dx) + (c[0] === 'b' ? dy : -dy)); });
    const end = () => { if (!op) return; op = null; el.classList.remove('edit'); onEnd(); }; h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
    h.addEventListener('click', e => e.stopPropagation(), true); });
}
function edTag(el, name, onReset){ const t = document.createElement('b'); t.className = 'edtag'; t.textContent = name; t.title = 'Arrastra para mover · doble clic: tamaño y lugar normales'; el.appendChild(t);
  t.addEventListener('dblclick', e => { e.stopPropagation(); onReset(); SFX.click?.(); }); return t; }
function addGrip(el, key, name, move){
  if (!el || el.querySelector(':scope > .edc')) return; el.classList.add('edfr');
  // hover by position: these panels let clicks through (pointer-events:none) and other layers may sit on top of them
  addEventListener('pointermove', e => { if (e.buttons) return; const r = el.getBoundingClientRect(), m = 14, on = r.width > 0 && e.clientX > r.left - m && e.clientX < r.right + m && e.clientY > r.top - 30 && e.clientY < r.bottom + m; el.classList.toggle('hov', on); }, { passive: true });
  let k0 = 1;
  edCorners(el, () => { k0 = KSIZE[key]; }, d => { const L = KLIM[key], prev = KSIZE[key]; KSIZE[key] = clamp(k0*(1 + d/260), L[0], L[1]); applyK();
      const r = el.getBoundingClientRect(); if (KSIZE[key] > prev && (r.width > innerWidth*L[2] || r.height > innerHeight*L[3])){ KSIZE[key] = prev; applyK(); } },
    () => { try { localStorage.setItem('hexterra-ksize', JSON.stringify(KSIZE)); } catch {} if (typeof dockWins === 'function') dockWins(); });
  const t = edTag(el, name, () => { KSIZE[key] = 1; applyK(); if (move && move.reset) move.reset(); try { localStorage.setItem('hexterra-ksize', JSON.stringify(KSIZE)); } catch {} if (typeof dockWins === 'function') dockWins(); });
  if (move && move.drag){ let op = null;
    t.addEventListener('pointerdown', e => { if (e.button) return; e.preventDefault(); e.stopPropagation(); op = { x: e.clientX, y: e.clientY }; move.start(); el.classList.add('edit', 'drag'); try { t.setPointerCapture(e.pointerId); } catch {} });
    t.addEventListener('pointermove', e => { if (op) move.drag(e.clientX - op.x, e.clientY - op.y); });
    const end = () => { if (!op) return; op = null; el.classList.remove('edit', 'drag'); move.end(); }; t.addEventListener('pointerup', end); t.addEventListener('pointercancel', end); }
}
// the action bar can also be moved (kept fully on screen)
const HBPOS = (() => { try { return JSON.parse(localStorage.getItem('hexterra-hbpos') || '{}'); } catch { return {}; } })();
function applyHbPos(){ const h = $('#hexbar'); if (!h) return; let x = HBPOS.x || 0, y = HBPOS.y || 0; h.style.setProperty('--hb-x', '0px'); h.style.setProperty('--hb-y', '0px');
  const r = h.getBoundingClientRect(); x = clamp(x, -r.left, innerWidth - r.right); y = clamp(y, -r.top + 40, innerHeight - r.bottom); HBPOS.x = x; HBPOS.y = y;
  h.style.setProperty('--hb-x', x + 'px'); h.style.setProperty('--hb-y', y + 'px'); }
const HB_MOVE = { s: null, start(){ this.s = { x: HBPOS.x || 0, y: HBPOS.y || 0 }; }, drag(dx, dy){ HBPOS.x = this.s.x + dx; HBPOS.y = this.s.y + dy; applyHbPos(); },
  end(){ try { localStorage.setItem('hexterra-hbpos', JSON.stringify(HBPOS)); } catch {} }, reset(){ HBPOS.x = 0; HBPOS.y = 0; applyHbPos(); this.end(); } };
addEventListener('resize', () => setTimeout(applyHbPos, 60));
let CORNER_SIDE = (() => { try { return localStorage.getItem('hexterra-corner') || 'r'; } catch { return 'r'; } })();
function layoutCorner(){
  let c = $('#corner'); if (!c){ c = document.createElement('div'); c.id = 'corner'; document.body.appendChild(c); cornerDrag(c); }
  const order = CORNER_SIDE === 'r' ? ['#news-board', '#quest-icon', '#players', '#hud-right'] : ['#hud-right', '#players', '#news-board', '#quest-icon'];
  c.append(...order.map(q => $(q)).filter(Boolean));
  c.style.left = c.style.right = ''; c.classList.toggle('left', CORNER_SIDE === 'l'); document.body.dataset.corner = CORNER_SIDE;
  addGrip(c, 'corner', 'Jugadores', { start(){}, drag(){}, end(){}, reset(){ CORNER_SIDE = 'r'; try { localStorage.setItem('hexterra-corner', 'r'); } catch {} layoutCorner(); } });   // moved by dragging the signs themselves (cornerDrag)
  setTimeout(() => { cornerBottom(); if (typeof dockWins === 'function') dockWins(); }, 0);
}
// the whole group of signs can be dragged; it sticks to the closest side (board / missions icons always face the center)
function cornerDrag(c){
  let op = null, block = false;
  c.addEventListener('pointerdown', e => { if (e.button || e.target.closest('.edc')) return; const r = c.getBoundingClientRect(); op = { x0: e.clientX, y0: e.clientY, l: r.left, moved: 0, id: e.pointerId }; }, true);
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
addGrip($('#hexbar'), 'hex', 'Acciones', HB_MOVE); applyHbPos();
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
  st.setProperty('--cloth-n', cloth('#4e3422', ['#452e1e', '#5a3c28', '#3e2a1a', '#543826']));   // neutral: brown leather
  st.setProperty('--cloth-y', cloth('#7a5a1a', ['#6e5016', '#8a6a22', '#5e4412', '#846020']));
})();
addEventListener('pointerdown', () => audioInit(), { once: false, passive: true });
