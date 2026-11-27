// ================= SEASON EVENTS (SwapHolm mode only, and only if "Eventos: Sí" in Jugar) =================
// Every 4-6 rounds an event starts and lasts 2-3 rounds. Favoured resources: 68 % chance of 1 extra each time a tile
// gives you one; harmed: 40 % chance of 1 less. The state (G.event, G.evNext, G.evLast, G.evOn) travels in netSnap, and
// the rolls are made by whoever is acting (the rules always run there).
const EVENTS = {
  feria:    { name: 'Feria', icon: 'moneda', start: 'Llegó la <b>feria</b>: el comercio cambia 3:1', end: 'La feria se fue de la isla',
              desc: 'El comercio cambia 3:1 y los puertos 3:1 cambian 2:1.' },
  lluvia:   { name: 'Lluvia', icon: 'gota', up: ['madera', 'trigo', 'lana'], start: 'Empezó la <b>lluvia</b>: crecen la madera, el trigo y la lana', end: 'Dejó de llover',
              desc: 'Madera, trigo y lana: 68 % de recibir 1 extra.' },
  polen:    { name: 'Polinización', icon: 'girasol', start: 'Llegó la <b>polinización</b>: hay más flores y objetos', end: 'Terminó la polinización',
              desc: 'Se encuentran más flores y objetos, y al encontrarlos: 68 % de 1 extra.' },
  sequia:   { name: 'Sequía', icon: 'sol', down: ['trigo', 'lana'], start: 'Llegó la <b>sequía</b>: escasean el trigo y la lana', end: 'Terminó la sequía',
              desc: 'Trigo y lana: 40 % de recibir 1 menos.' },
  invierno: { name: 'Invierno', icon: 'nube', down: ['madera', 'mineral'], start: 'Llegó el <b>invierno</b>: escasean la madera y el metal', end: 'Terminó el invierno',
              desc: 'Madera y metal: 40 % de recibir 1 menos.' },
};
const EVK = Object.keys(EVENTS);
const eventsOn = () => !!G && !isClassic() && G.evOn !== false;
const curEvent = () => eventsOn() && G.event && EVENTS[G.event.k] ? G.event.k : null;
const evRoundsLeft = () => G.event ? Math.max(1, G.event.until - gameRound()) : 0;
// called when a turn passes (endTurn): starts and ends events on their schedule
function eventsTick(){
  if (!eventsOn() || G.setup || G.over) return;
  const round = gameRound();
  if (G.evNext == null) G.evNext = 4 + Math.floor(Math.random()*3);   // the first one never before round 4
  if (G.event && round >= G.event.until){
    const E = EVENTS[G.event.k]; G.event = null; G.evNext = round + 4 + Math.floor(Math.random()*3);
    if (E) notify(`${E.end}`, '#c8a040');
  } else if (!G.event && round >= G.evNext){
    const k = pick(EVK.filter(x => x !== G.evLast)); G.event = { k, until: round + 2 + Math.floor(Math.random()*2) }; G.evLast = k;
    notify(`${EVENTS[k].start} · ${G.event.until - round} rondas`, '#c8a040');
  }
}
// production from one tile to one village / city: n cards of resource r
function eventYield(r, n){
  const k = curEvent(); if (!k || n <= 0) return n; const E = EVENTS[k];
  if (E.up && E.up.includes(r) && Math.random() < .68) return n + 1;
  if (E.down && E.down.includes(r) && Math.random() < .4) return n - 1;
  return n;
}
// finds of flowers and objects during the pollination
const eventFindChance = base => curEvent() === 'polen' ? Math.min(.9, base*1.6) : base;
const eventFindQty = n => curEvent() === 'polen' && Math.random() < .68 ? n + 1 : n;
// the fair makes the comercio cheaper: 4:1 → 3:1, 3:1 ports → 2:1 (2:1 ports stay)
const eventRate = k => curEvent() === 'feria' ? (k >= 4 ? 3 : k === 3 ? 2 : k) : k;
// the plate in the top-right corner while an event is on
function updEventChip(){
  const b = $('#b-event'); if (!b) return; const k = curEvent();
  if (!k){ b.style.display = 'none'; b.dataset.k = ''; return; }
  const E = EVENTS[k], left = evRoundsLeft();
  if (b.dataset.k !== k){ b.dataset.k = k; b.innerHTML = ic(E.icon) + '<span></span>'; }
  b.lastChild.textContent = ` ${E.name} · ${left} ${left === 1 ? 'ronda' : 'rondas'}`; b.title = E.desc; b.style.display = '';
}
