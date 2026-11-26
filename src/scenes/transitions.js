// ================= TRANSITIONS =================
let tween = null;
function tweenCam(pos, target, ms){ if (skipping()) ms = Math.min(ms, 60); return new Promise(res => { tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), ms, res }; }); }
function stepTween(){
  const k = Math.min(1, (performance.now() - tween.start)/tween.ms), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
  camera.position.lerpVectors(tween.p0, tween.p1, e); controls.target.lerpVectors(tween.t0, tween.t1, e); camera.lookAt(controls.target);
  if (k >= 1){ const r = tween.res; tween = null; r(); }
}
function fade(o, ms){ const f = $('#fade'); f.style.transition = `opacity ${ms}ms ease`; f.style.opacity = o; return wait(ms + 30); }
function disposeCtx(){
  if (villageCtx){ disposeScene(villageCtx.sc); villageCtx = null; }
}
async function enterVillage(vid){
  if (!scenesOn()) return;
  if (busy) return; busy = true;
  hidePopup(); exitBuild(); refresh();
  savedCam = { pos: camera.position.clone(), target: controls.target.clone() };
  mode = 'anim'; controls.enabled = false;
  const v = G.verts[vid];
  await tweenCam(new THREE.Vector3(v.x, .75, v.z + .85), new THREE.Vector3(v.x, .2, v.z), 1000);
  await fade(1, 350);
  openVillage(vid);
  await fade(0, 550);
  busy = false;
}
async function backToBoard(){
  if (busy) return; busy = true;
  $('#bubble').classList.remove('show');
  await fade(1, 350);
  disposeCtx();
  camera.fov = 45; camera.updateProjectionMatrix();
  camera.rotation.order = 'XYZ';
  if (savedCam){ camera.position.copy(savedCam.pos); controls.target.copy(savedCam.target); }
  controls.enabled = true; controls.update();
  mode = 'board'; document.body.dataset.mode = 'board'; refresh();
  await fade(0, 450);
  busy = false;
}

