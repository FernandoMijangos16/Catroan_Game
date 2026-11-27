// ================= INPUT =================
let down = null;
canvas.addEventListener('pointerdown', e => { down = { x:e.clientX, y:e.clientY, lx:e.clientX, ly:e.clientY, moved:false }; if (mode === 'village'){ try { canvas.setPointerCapture(e.pointerId); } catch {} } });
canvas.addEventListener('pointermove', e => {
  if (!down) return;
  const dx = e.clientX - down.lx, dy = e.clientY - down.ly; down.lx = e.clientX; down.ly = e.clientY;
  if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down.moved = true;
  if (mode === 'village'){ ctl.yaw -= dx*.005; ctl.pitch = clamp(ctl.pitch - dy*.004, -1.1, 1.1); }
});
canvas.addEventListener('pointerup', e => {
  if (!down) return; const click = !down.moved; down = null; if (!click) return;
  if (mode === 'board') boardClick(e); else if (mode === 'village') villageClick(e); else if (mode === 'market') marketClick(e);
});
canvas.addEventListener('pointermove', e => { if (mode === 'market') marketHover(e); else if (mode === 'board' && G && G.phase === 'setupV') setupHover(e); });
canvas.addEventListener('pointercancel', () => { down = null; });
// a button released outside the game (over another window, outside the frame) never reaches the canvas, and the camera
// stays "grabbed" following the mouse. Any move with no button pressed, or losing focus, lets go of it.
let PRESSED = null;
canvas.addEventListener('pointerdown', e => { PRESSED = e.pointerId; }, true);
canvas.addEventListener('pointerup', () => { PRESSED = null; }, true);
const releaseStuck = e => { if (PRESSED === null) return; const id = PRESSED; PRESSED = null; down = null;
  canvas.dispatchEvent(new PointerEvent('pointerup', { pointerId: id, bubbles: true, clientX: e ? e.clientX : 0, clientY: e ? e.clientY : 0, isPrimary: true, pointerType: 'mouse' })); };
addEventListener('pointermove', e => { if (PRESSED !== null && e.buttons === 0 && e.pointerType === 'mouse') releaseStuck(e); }, true);
addEventListener('blur', () => releaseStuck(null));
document.addEventListener('pointerleave', e => { if (e.buttons === 0) releaseStuck(e); });
const keyName = e => e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
addEventListener('keydown', e => {
  const k = keyName(e);
  if (PAUSE.on){ if (k === 'escape'){ if (PZ.view === 'main') pauseClose(); else pauseGo('main'); } return; }
  if (k === 'escape' && escOpensPause()){ pauseOpen(); return; }
  if (mode === 'village'){ ctl.keys[k] = true; if (k.startsWith('arrow') || k === ' ') e.preventDefault(); }
  if (k === 'escape' && mode === 'market' && marketCtx && marketCtx.kind !== 'thief' && !marketCtx.busy){ exitMarket(); return; }
  if (k === 'escape'){ if (!modal.classList.contains('hidden') && modal.dataset.dismiss) closeModal(); else if (mode === 'board'){ exitBuild(); hidePopup(); refresh(); } }
});
// Esc pauses only when there is nothing to close first (a dialog, the market, a build or a popup on the board, the showcase)
function escOpensPause(){
  if (mode === 'menu' || !G || (typeof SHOW !== 'undefined' && SHOW.kind)) return false;
  if (!modal.classList.contains('hidden') && modal.dataset.dismiss) return false;
  if (mode === 'market') return false;
  if (mode === 'board' && (G.buildMode || $('#popup').style.display === 'block')) return false;
  return mode === 'board' || mode === 'village' || mode === 'anim';
}
addEventListener('keyup', e => { ctl.keys[keyName(e)] = false; });
addEventListener('blur', () => { ctl.keys = {}; });
document.querySelectorAll('#dpad button').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); ctl.keys[k] = true; try { b.setPointerCapture(e.pointerId); } catch {} });
  ['pointerup','pointercancel','lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { ctl.keys[k] = false; }));
});
$('#b-roll').onclick = () => { if (G.current === 0 && G.phase === 'roll') rollDice(); };
$('#b-road').onclick = () => enterBuild('camino');
$('#b-set').onclick = () => enterBuild('pueblo');
$('#b-city').onclick = () => enterBuild('ciudad');
$('#b-trade').onclick = () => { if (G && G.current === 0 && G.phase === 'main') enterMarket('trade'); };
$('#b-end').onclick = () => { if (G.current === 0 && G.phase === 'main') endTurn(); };
$('#b-back').onclick = backToBoard;
// "back to the board": a brass hex button carrying a tiny tilted model of the island, like the board's action buttons
function initMapButton(){
  const btn = $('#b-back'), cv = btn.querySelector('canvas'); if (!miniInit()) return;
  const S = { hover: 0, lift: 0, built: null };
  const v = miniView(cv, { w: 150, h: 118, res: 1, fov: 26, fps: 30, tick: (dt, t) => { S.lift += ((S.hover ? 1 : 0) - S.lift)*Math.min(1, dt*10); if (S.g){ S.g.position.y = S.lift*.12; S.isle.rotation.y = Math.sin(t*.6)*.25; } if (G && S.built !== G.id) build(); } });
  v.cam.position.set(0, 2.6, 1.55); v.cam.lookAt(0, 0, -.05);
  const brass = icm(0xa8823a, { m: .55, r: .45 });
  function build(){
    S.built = G ? G.id : 0; if (S.g) v.sc.remove(S.g);
    const g = new THREE.Group(); S.g = g; v.sc.add(g);
    const body = new THREE.Mesh(sg(new THREE.CylinderGeometry(1, 1, .14, 6)), brass); body.position.y = .07; g.add(body);
    const cvp = document.createElement('canvas'); cvp.width = cvp.height = 96; const c = cvp.getContext('2d'), R = mulberry32(31);
    c.fillStyle = '#2f5a6e'; c.fillRect(0, 0, 96, 96); for (let i=0;i<300;i++){ c.fillStyle = pick(['#28505f', '#376679', '#2a4d5c', '#3f7286'], R); c.fillRect(Math.floor(R()*96), Math.floor(R()*96), 2, 1); }
    c.font = "700 13px 'Pixelify Sans', monospace"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#0d1a20'; c.fillText('Tablero', 48, 82); c.fillStyle = '#e8c878'; c.fillText('Tablero', 48, 81);
    const tex = new THREE.CanvasTexture(cvp); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter;
    const shape = new THREE.Shape(); for (let k=0;k<6;k++){ const th = k*Math.PI/3, px = Math.sin(th)*.88, py = -Math.cos(th)*.88; k ? shape.lineTo(px, py) : shape.moveTo(px, py); }
    const pg = new THREE.ShapeGeometry(shape), pp = pg.attributes.position, uv = pg.attributes.uv; for (let i=0;i<pp.count;i++) uv.setXY(i, pp.getX(i)/1.76 + .5, pp.getY(i)/1.76 + .5); pg.rotateX(-Math.PI/2);
    const plate = new THREE.Mesh(pg, keepMat(new THREE.MeshStandardMaterial({ map: tex, roughness: .95 }))); plate.position.y = .142; g.add(plate);
    // the island: seven little hex tiles in the board's own colours, tilted towards you
    const isle = new THREE.Group(); isle.position.set(0, .16, -.1); isle.rotation.x = -.12; g.add(isle); S.isle = isle;
    const COL = { bosque: 0x2f6a34, pradera: 0x7ab04a, campo: 0xd8b24a, cerro: 0xb0563a, montana: 0x8a8a90, desierto: 0xd9c49a };
    const types = G && G.tiles ? G.tiles.slice(0, 7).map(t => t.type) : ['bosque', 'campo', 'cerro', 'pradera', 'montana', 'desierto', 'bosque'];
    const pos = [[0, 0], ...[0, 1, 2, 3, 4, 5].map(k => [Math.cos(k*Math.PI/3)*.34, Math.sin(k*Math.PI/3)*.34])];
    pos.forEach(([x, z], i) => { const h = new THREE.Mesh(sg(new THREE.CylinderGeometry(.19, .2, .08 + (types[i] === 'montana' ? .1 : 0), 6)), icm(COL[types[i]] || 0x7ab04a)); h.position.set(x, .04, z); h.rotation.y = Math.PI/6; isle.add(h);
      if (types[i] === 'bosque') isle.add(mesh(GEO.cone7, icm(0x1f4a24), x, .08, z, .08, .16, .08, false)); });
    isle.add(mesh(GEO.box, icm(0xb0303a), .06, .1, .02, .05, .1, .05, false));
  }
  build();
  btn.addEventListener('pointerenter', () => S.hover = 1); btn.addEventListener('pointerleave', () => S.hover = 0);
}
initMapButton();

