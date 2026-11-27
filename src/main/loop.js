// ================= LOOP =================
const clock = new THREE.Clock();
let uiT = 1;
function draw(sc){ if (sc.userData.env){ applyEnv(sc.userData.env, 0, clock.elapsedTime); seasonEnv(sc); } if (sc.userData.sky) sc.userData.sky.position.copy(camera.position); renderScene(sc); }
let pulseT = 0;
renderer.setAnimationLoop(() => {
  const raw = clock.getDelta(), dt = Math.min(raw, .05), t = clock.elapsedTime;
  if (PAUSE.frozen){ stepMini(raw); const sc = mode === 'village' && villageCtx ? villageCtx.sc : mode === 'market' && marketCtx ? marketCtx.sc : boardScene; if (sc) draw(sc); return; }   // paused: the game stands still under the dark layer
  WIND.value = t; stepInventory(raw); stepMini(raw); stepHexbar(raw); stepHighlight(t);
  advanceDay(dt); updateAudio(Math.min(raw, .1), t); tickPlayTime(Math.min(raw, 1)); seasonStep(dt, t);
  if ((uiT += raw) > .5){ uiT = 0; const [ik, tx] = dayLabel(), bt = $('#b-time'); if (bt.dataset.ic !== ik){ bt.dataset.ic = ik; bt.innerHTML = ic(ik) + '<span></span>'; } bt.lastChild.textContent = ' ' + tx; }
  if (tween) stepTween();
  if (mode === 'board' || mode === 'anim'){
    if (mode === 'board') controls.update();
    pulseT += dt; markerMat.opacity = .45 + .35*Math.sin(pulseT*4);
    for (let r = skipping() ? 8 : 1; r > 0; r--){ stepBoardFx(dt); stepFly(dt, t); stepDice(dt); }   // double click: same steps, more per frame
    if (boardScene){ boardScene.userData.water.userData.update(t); draw(boardScene); }
  } else if (mode === 'village' && villageCtx){ updateVillage(dt, t); stepFireworks(dt); draw(villageCtx.sc); }
  else if (mode === 'market' && marketCtx){ for (let r = skipping() ? 8 : 1; r > 0 && marketCtx; r--) updateMarket(dt, t); if (marketCtx) draw(marketCtx.sc); }
});

