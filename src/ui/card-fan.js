function initCardFan(){
  const f = document.createElement('div'); f.id = 'cards'; document.body.appendChild(f);
}
function cardStatus(p, c){
  if (c.t === 'punto') return ['Se suma sola a tus puntos', false];
  if (G.current !== p) return ['Solo en tu turno', false];
  if (c.turn === G.turnId) return ['La compraste este turno: podrás jugarla en el siguiente', false];
  if (G.playedTurn === G.turnId) return ['Ya jugaste una carta este turno', false];
  if (G.phase === 'rolling' || G.phase === 'robber' || G.over) return ['Ahora no se puede', false];
  if (G.phase === 'roll' && c.t !== 'caballero') return ['Primero tira los dados (solo la Guardia se juega antes)', false];
  return ['Haz clic para jugarla', true];
}
function renderFan(newIdx = -1){
  const f = $('#cards'); if (!f || !G) return;
  const hand = G.players[0].cards || [];
  while (f.children.length > hand.length) f.lastChild.remove();
  while (f.children.length < hand.length){ const el = document.createElement('div'); el.className = 'card'; el.innerHTML = '<div class="cin"><img class="face"><img class="back"></div>'; f.appendChild(el);
    el.addEventListener('click', e => { e.stopPropagation(); if (document.body.classList.contains('boxfront')){ swapDeck(false); return; } openHand(); }); }
  f.style.setProperty('--pc', G.players[0].color); document.body.classList.toggle('nocards', !hand.length); if (!hand.length) document.body.classList.remove('boxfront');
  // a compact fan that never reaches the action buttons: measure the room left of them
  const n = hand.length, hb = $('#hexbar canvas'), Z = UI_S || 1, room = hb && hb.getBoundingClientRect().width ? hb.getBoundingClientRect().left/Z + 30 - 60 - 10 : 240;
  const cw = Math.round(clamp(room*.42, 54, 74)), ch = Math.round(cw*1.4), step = n > 1 ? Math.min(cw*.36, Math.max(6, (room - cw*1.15)/(n - 1))) : 0, spread = Math.min(7, 32/Math.max(1, n));
  f.style.setProperty('--cw', cw + 'px'); f.style.setProperty('--ch', ch + 'px');
  [...f.children].forEach((el, i) => {
    const c = hand[i]; el.dataset.i = i;
    el.querySelector('.face').src = cardFaceURL(c.t, G.players[0].color, 1); el.querySelector('.back').src = cardBackURL(G.players[0].color);
    const rot = (i - (n - 1)/2)*spread, lift = Math.abs(i - (n - 1)/2)*Math.abs(i - (n - 1)/2)*1.2;
    el.style.setProperty('--x', (i*step) + 'px'); el.style.setProperty('--r', rot + 'deg'); el.style.setProperty('--ly', lift + 'px'); el.style.zIndex = 10 + i;
    el.classList.toggle('play', cardStatus(0, c)[1]);
    if (i === newIdx){ el.classList.add('incoming'); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('incoming'))); }
  });
}
function clickCard(i){
  const c = G.players[0].cards[i]; if (!c) return; const [st, ok] = cardStatus(0, c);
  if (!ok){ notify(st, G.players[0].color, 'sys'); return; }
  const d = CARD_DEFS[c.t];
  const go = choice => { playCard(0, i, choice); renderFan(); };
  if (c.t === 'abundancia') pickRes('Fortuna de temporada', 'Elige el primer recurso', r1 => pickRes('Fortuna de temporada', 'Elige el segundo recurso', r2 => go([r1, r2])));
  else if (c.t === 'monopolio') pickRes('Avaricia', 'Todos te darán este recurso', r => go(r));
  else if (c.t === 'espia') pickRes('Espía', 'Robarás 1 al rival que más tenga', r => go(r));
  else go(null);
}
function pickRes(title, sub, cb){
  openModal(`<h3>${title}</h3><p class="muted">${sub}</p><div class="row">${RES.map(r => `<button data-r="${r}">${resImg(r)} ${RES_NAME[r]}</button>`).join('')}</div><div class="row end"><button data-x="1">Cancelar</button></div>`);
  modalBody.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.x){ closeModal(); return; } closeModal(); cb(b.dataset.r); };
}
// ---------- rules ----------
