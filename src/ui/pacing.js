// ================= PACING: camera focus and location pings =================
const annIdle = () => scrollIdle();
const FOCUS = { goal: null, t: 0 };
function focusBoard(x, z, color){
  if (mode !== 'board' || !boardScene) return;
  const tg = controls.target; FOCUS.goal = new THREE.Vector3(tg.x + (x - tg.x)*.45, tg.y, tg.z + (z - tg.z)*.45); FOCUS.t = 1.4;
  pingAt(x, z, color);
}
function stepFocus(dt){
  if (!FOCUS.goal || FOCUS.t <= 0) return;
  if (typeof down !== 'undefined' && down){ FOCUS.goal = null; return; }
  FOCUS.t -= dt; const d = FOCUS.goal.clone().sub(controls.target).multiplyScalar(Math.min(1, dt*2.4));
  controls.target.add(d); camera.position.add(d); if (FOCUS.t <= 0) FOCUS.goal = null;
}
const PINGS = [], PING_GEO = new THREE.RingGeometry(.7, 1, 32).rotateX(-Math.PI/2);
function pingAt(x, z, color){
  if (!boardScene) return;
  for (let k=0;k<2;k++){
    const m = new THREE.Mesh(PING_GEO, new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    m.position.set(x, boardSurfaceH(x, z) + .04, z); boardScene.add(m); PINGS.push({ m, t: -k*.5 });
  }
}
function stepPings(dt){
  for (let i = PINGS.length - 1; i >= 0; i--){
    const p = PINGS[i]; p.t += dt; const k = p.t/1.3;
    if (k < 0) continue;
    p.m.scale.setScalar(.12 + k*.45); p.m.material.opacity = Math.max(0, 1 - k)*.9;
    if (k >= 1){ boardScene && boardScene.remove(p.m); p.m.material.dispose(); PINGS.splice(i, 1); }
  }
}

