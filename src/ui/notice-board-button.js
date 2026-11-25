// ================= 3D NOTICE BOARD + CENTER BUTTON =================
const NEWS3D = { v: null, o: null, dirty: true };
function initNews3D(){
  const nb = $('#news-board'); if (!nb || !miniInit()) return;
  const cv = nb.querySelector('canvas');
  const v = miniView(cv, { w: 62, h: 62, res: .75, fov: 30, fps: 24, tick: (dt, t) => {
    if (NEWS3D.dirty){ NEWS3D.dirty = false; if (NEWS3D.o) v.sc.remove(NEWS3D.o); NEWS3D.o = spinner(noticeBoardModel(HIST.slice(0, 6).map(h => h.color && h.color !== '#aaa' ? h.color : '#c9a06a')), 1.3); v.sc.add(NEWS3D.o); v.cam.position.set(0, .1, 2.7); v.cam.lookAt(0, 0, 0); }
    NEWS3D.o.userData.inner.rotation.y = t*.9;
  } });
  NEWS3D.v = v;
}
function compassModel(){
  const g = new THREE.Group(), brass = keepMat(new THREE.MeshStandardMaterial({ color: 0xc9963a, metalness: .55, roughness: .4, flatShading: true, envMap: IT.env }));
  g.add(new THREE.Mesh(sg(new THREE.TorusGeometry(.8, .12, 5, 12)), brass));
  const disc = new THREE.Mesh(sg(new THREE.CylinderGeometry(.72, .72, .06, 12).rotateX(Math.PI/2)), keepMat(new THREE.MeshStandardMaterial({ map: m3().paperTex, roughness: 1, flatShading: true }))); g.add(disc);
  [[0, 1, 0xb8322a], [0, -1, 0xe9e2d0], [1, 0, 0xe9e2d0], [-1, 0, 0xe9e2d0]].forEach(([x, y, c]) => { const a = new THREE.Mesh(GEO.cone4, mat(c)); a.scale.set(.16, .55, .06); a.position.set(x*.12, y*.12, .06); a.rotation.z = Math.atan2(-x, y); g.add(a); });
  g.add(mesh(GEO.sphere, brass, 0, 0, .08, .1, .1, .1));
  return outlineItem(g);
}
let CAM_MOVED = false;
function centerView(){ const a = innerWidth/innerHeight, k = (a < 1.3 ? Math.pow(1.3/a, .85) : 1)*(G && G.tiles.length > 19 ? 1.3 : 1); return { pos: new THREE.Vector3(0, 11.2*k, 9.6*k), target: new THREE.Vector3(0, 0, 1.5) }; }
function centerBoard(instant){
  if (mode !== 'board') return;
  const c = centerView();
  if (instant){ camera.position.copy(c.pos); controls.target.copy(c.target); controls.update(); }
  else tweenCam(c.pos, c.target, 700).then(() => { controls.update(); });
  CAM_MOVED = false; FOCUS.goal = null;
}
function initCenterBtn(){
  const b = document.createElement('button'); b.id = 'b-center'; b.className = 'panel'; b.title = 'Centrar el tablero'; b.innerHTML = '<canvas></canvas>';
  $('#b-sound').before(b);
  b.onclick = () => { SFX.click?.(); centerBoard(); };
  if (miniInit()){ const o = compassModel(); const v = miniView(b.querySelector('canvas'), { w: 26, h: 26, res: 1, fov: 30, fps: 24, tick: (dt, t) => { o.rotation.z = Math.sin(t*.9)*.5; o.rotation.y = Math.sin(t*.6)*.4; } }); v.sc.add(o); v.cam.position.set(0, 0, 3.6); v.cam.lookAt(0, 0, 0); }
  controls.addEventListener('start', () => { CAM_MOVED = true; });
  addEventListener('resize', () => { if (!CAM_MOVED) centerBoard(true); });
}

