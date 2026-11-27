// ================= PAUSE MENU (Esc, or the gear in the top-right corner) =================
// Only a dark layer over the game, with PAUSA piled out of one resource where the menu has its title, and the options
// in the menu's lettering. In a solo game everything stops (PAUSE.frozen: waits are held and the loop only draws);
// online the others keep playing, so it only covers the screen, and Guardar / Reiniciar are not offered.
const PZ = { el: null, title: null, view: 'main', ask: null };
function pauseEl(){
  if (PZ.el) return PZ.el;
  const el = PZ.el = document.createElement('div'); el.id = 'pause';
  el.innerHTML = `<div class="pdark"></div>
    <div class="mview" data-v="main"><div class="mtitle"><canvas></canvas></div>
      <nav class="mopts"><a data-p="resume">Reanudar</a><a data-p="save" class="psolo">Guardar</a><a data-p="saveexit" class="psolo">Guardar y salir</a><a data-p="restart" class="psolo">Reiniciar</a><a data-p="settings">Ajustes</a><a data-p="help">Ayuda</a><a data-p="exit">Salir</a></nav>
      <p class="mnote pnote"></p><div class="psum"></div></div>
    <div class="mview" data-v="ask"><h2></h2><p class="mnote"></p><div class="mrow"><button class="no" data-p="main">No</button><button class="primary" data-p="yes">Sí</button></div></div>
    <div class="mview" data-v="settings"><h2>Ajustes</h2>
      <label class="pvol">${ic('cuerno')} Volumen <input type="range" min="0" max="100" step="5"><b></b></label>
      <div class="mrow"><button class="mtoggle" data-set="full"></button><button class="mtoggle" data-set="fast"></button></div>
      <div class="mrow"><button data-p="main">◀ Volver</button></div></div>
    <div class="mview" data-v="help"><h2>Ayuda</h2><p class="msoon">Próximamente</p><div class="mrow"><button data-p="main">◀ Volver</button></div></div>`;
  document.body.appendChild(el);
  el.addEventListener('click', pauseClick);
  const vol = el.querySelector('.pvol input');
  vol.addEventListener('input', () => { audioInit(); setVolume(vol.value/100); updSettings(); });
  addEventListener('fullscreenchange', () => { if (PAUSE.on) updSettings(); });
  addEventListener('resize', () => { if (PAUSE.on) fitMenuView(el); });
  return el;
}
function pauseOpen(){
  if (PAUSE.on || mode === 'menu' || !G) return;
  const el = pauseEl(); PAUSE.on = true; PAUSE.frozen = !NG.on; PAUSE.at = performance.now();
  ctl.keys = {}; releaseStuck?.(null);
  el.classList.toggle('online', !!NG.on); el.classList.add('show'); document.body.classList.add('paused');
  el.querySelector('.pnote').textContent = NG.on ? 'La partida en línea sigue mientras estás en pausa.' : '';
  pauseGo('main'); SFX.click?.();
}
function pauseClose(){
  if (!PAUSE.on) return;
  PAUSE.on = false; document.body.classList.remove('paused'); PZ.el.classList.remove('show');
  if (PZ.title){ PZ.title.alive = false; PZ.title = null; }
  if (PAUSE.frozen){
    PAUSE.frozen = false; const gone = performance.now() - PAUSE.at;
    if (tween) tween.start += gone;   // a camera move picks up where it stopped
    clock.getDelta();                 // and the loop does not jump by the paused time
    const q = PAUSE.q; PAUSE.q = []; q.forEach(r => r());
  }
}
function pauseGo(v){
  PZ.view = v; const el = PZ.el;
  el.querySelectorAll('.mview').forEach(x => x.classList.toggle('on', x.dataset.v === v));
  if (v === 'main'){ pauseTitle(); pauseSummary(); const solo = !NG.on, ok = canSave();
    el.querySelectorAll('.psolo').forEach(a => a.style.display = solo ? '' : 'none');
    ['save', 'saveexit'].forEach(k => el.querySelector(`[data-p=${k}]`).classList.toggle('dis', !ok));
    el.querySelector('[data-p=save]').title = ok ? 'Guarda esta partida (también se guarda sola al terminar cada turno)' : 'Se puede guardar cuando termine la colocación inicial'; }
  if (v === 'settings') updSettings();
  setTimeout(() => fitMenuView(PZ.el), 0);   // the summary under the options must fit too (same shrink as the main menu)
}
// PAUSA, piled out of a resource picked at random each time, where the menu has its title
function pauseTitle(){
  const cv = PZ.el.querySelector('.mtitle canvas'); if (!miniInit()) return;
  if (PZ.title) PZ.title.alive = false;
  const T = resourceWord('PAUSA', pick(RES));
  const v = miniView(cv, { w: 860, h: 250, res: .8, fov: 26, fps: 30, tick: (dt, t) => T.letters.forEach((L, i) => { L.position.y = Math.sin(t*1.6 - i*.55)*.012; }) });
  v.cam.position.set(0, .34, 3.35); v.cam.lookAt(0, -.02, 0); v.sc.add(T.g); PZ.title = v;
}
// round, season event and everyone's points
function pauseSummary(){
  const box = PZ.el.querySelector('.psum'); if (!G || G.phase === 'register'){ box.innerHTML = ''; return; }
  const k = curEvent(), ev = k ? ` · ${ic(EVENTS[k].icon)} ${EVENTS[k].name} (${evRoundsLeft()} ${evRoundsLeft() === 1 ? 'ronda' : 'rondas'})` : '';
  const head = G.setup ? 'Colocación inicial' : `Ronda ${gameRound()}${ev}`;
  const rows = G.players.map((P, i) => ({ P, i, pts: vp(i) })).filter(r => !r.P.empty).sort((a, b) => b.pts - a.pts)
    .map(({ P, i, pts }) => `<li${i === G.current ? ' class="cur"' : ''}><i style="--c:${P.color}"></i>${String(P.name).replace(/[<>&"]/g, '')}${i === 0 ? ' (tú)' : ''}<b>${pts}</b></li>`).join('');
  box.innerHTML = `<h3>${head}</h3><ul>${rows}</ul><small>Gana quien llega a 10 puntos</small>`;
}
function updSettings(){
  const el = PZ.el, vol = el.querySelector('.pvol input'), pct = Math.round(SND.vol*100);
  vol.value = pct; el.querySelector('.pvol b').textContent = pct + ' %';
  const full = !!document.fullscreenElement, fb = el.querySelector('[data-set=full]'), sb = el.querySelector('[data-set=fast]');
  fb.innerHTML = `${ic('mapa')} Pantalla completa: <b>${full ? 'Sí' : 'No'}</b>`; fb.classList.toggle('off', !full);
  sb.innerHTML = `${ic('flechas')} Animaciones: <b>${PREFS.fast ? 'Rápidas' : 'Normales'}</b>`; sb.classList.toggle('off', false);
  sb.title = 'Rápidas: las esperas de los turnos (bots, dados, avisos) duran la mitad';
}
// a question before throwing the game away
function pauseAsk(title, note, fn){ PZ.ask = fn; const v = PZ.el.querySelector('[data-v=ask]'); v.querySelector('h2').textContent = title; v.querySelector('.mnote').textContent = note; pauseGo('ask'); }
const unsavedNote = () => NG.on ? (NG.seat === 0 ? 'Eres el anfitrión: la partida termina para todos.' : 'Un bot tomará tu lugar; puedes volver con la misma clave.')
  : 'Lo que pasó desde el último guardado se pierde (se guarda solo al terminar cada turno).';
function pauseSave(){
  if (!canSave()) return false;
  if (calmNow()) return saveGame() ? 'now' : false;
  return hasSave() ? 'turn' : (saveGame() ? 'now' : false);   // mid-action: the save from the start of this turn stays
}
async function pauseClick(e){
  const a = e.target.closest('[data-p],[data-set]'); if (!a) return; e.stopPropagation();
  if (a.classList.contains('dis')) return; SFX.click?.();
  const k = a.dataset.p, note = PZ.el.querySelector('.pnote');
  if (k === 'resume') pauseClose();
  else if (k === 'main') pauseGo('main');
  else if (k === 'settings') pauseGo('settings');
  else if (k === 'help') pauseGo('help');
  else if (k === 'save'){ const r = pauseSave(); note.textContent = r === 'now' ? 'Partida guardada.' : r === 'turn' ? 'Guardada como estaba al empezar este turno (hay una acción a medias).' : 'No se pudo guardar.'; }
  else if (k === 'saveexit'){ const r = pauseSave(); if (r) leaveToMenu(); else note.textContent = 'No se pudo guardar.'; }
  else if (k === 'restart') pauseAsk('¿Reiniciar la partida?', 'Empieza otra con las mismas opciones y un tablero nuevo. ' + unsavedNote(), restartGame);
  else if (k === 'exit') pauseAsk('¿Salir al menú?', unsavedNote(), leaveToMenu);
  else if (k === 'yes'){ const f = PZ.ask; PZ.ask = null; if (f) f(); }
  else if (a.dataset.set === 'full'){ try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch {} updSettings(); }
  else if (a.dataset.set === 'fast'){ PREFS.fast = !PREFS.fast; try { localStorage.setItem('hexterra-fast', PREFS.fast ? '1' : '0'); } catch {} updSettings(); }
}
// a new game with the same options: the page starts over (like leaving) and start.js opens it straight away
function restartGame(){
  try { sessionStorage.setItem('hexterra-restart', JSON.stringify({ opts: { ...GAME_OPTS, online: false }, n: G.players.length, tut: TUT.on })); } catch {}
  leaveToMenu();
}
// called once at startup (main/start.js): true if a restart was asked for and the game is already open
function restartPending(){
  let d = null; try { d = JSON.parse(sessionStorage.getItem('hexterra-restart') || 'null'); sessionStorage.removeItem('hexterra-restart'); } catch {}
  if (!d || !d.opts) return false;
  if (d.tut){ startTutorial(); return true; }
  Object.assign(GAME_OPTS, d.opts, { online: false }); closeMainMenu(); applyGameOpts(); newGame(d.n > 4 ? d.n : undefined); startRegistration();
  return true;
}
// back to the main menu: the page starts over, so no turn, scene or connection of this game is left running
async function leaveToMenu(){
  PAUSE.gen++; PAUSE.q = [];
  if (NG.on){ try { if (NG.seat === 0) netSend({ t: 'bye' }); await netLeave(); } catch {} }
  try { window.catroanDesk?.lanClose(); } catch {}
  location.reload();
}
function pauseToggle(){ if (PAUSE.on) pauseClose(); else pauseOpen(); }
$('#b-pause').innerHTML = ic('engrane');
$('#b-pause').onclick = e => { e.stopPropagation(); pauseOpen(); };
