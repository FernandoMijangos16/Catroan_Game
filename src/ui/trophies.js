const TROPHY = { el: null, views: {} };
function updateTrophies(){
  const hb = $('#hexbar'); if (!hb || !G) return;
  let el = TROPHY.el; if (!el){ el = TROPHY.el = document.createElement('div'); el.id = 'trophies'; hb.appendChild(el);
    ['army', 'road'].forEach(k => { const d = document.createElement('div'); d.className = 'troph ' + k; d.innerHTML = '<canvas></canvas>'; el.appendChild(d);
      d.addEventListener('pointerenter', () => sysNote(k === 'army' ? `<b>Ejército más grande</b> · +2 puntos<br><span class="muted">Lo conservas mientras nadie juegue más caballeros que tú.</span>` : `<b>Camino más largo</b> · +2 puntos<br><span class="muted">Lo conservas mientras nadie tenga un camino seguido más largo.</span>`, { ms: 2600 }));
      if (miniInit()){ const o = trophyModel(k); const v = miniView(d.querySelector('canvas'), { w: 70, h: 84, res: 1, fov: 28, fps: 4, tick: () => {} }); v.sc.add(o); o.rotation.y = -.35; v.cam.position.set(0, 1.1, 2.75); v.cam.lookAt(0, .45, 0); TROPHY.views[k] = v; } }); }
  el.querySelector('.army').classList.toggle('on', G.army === 0); el.querySelector('.road').classList.toggle('on', G.longest === 0);
}
