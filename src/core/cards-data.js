// ================= DEVELOPMENT CARDS =================
const CARD_DEFS = {
  caballero:  { name: 'Guardia', n: 14, kind: 'Acción', col: '#a8322a', desc: 'Mueve al ladrón a otro terreno y roba 1 carta a un rival que tenga pueblo ahí. Con 3 guardias o más ganas la Guardia más poderosa (+2 PV). Se puede jugar antes de tirar los dados.' },
  punto:      { name: 'Punto de desarrollo', n: 5, kind: 'Punto', col: '#c9962a', desc: 'Vale 1 punto de victoria. Se suma solo, no hace falta jugarla.' },
  caminos:    { name: 'Rutas y senderos', n: 2, kind: 'Progreso', col: '#3a7a44', desc: 'Construye 2 caminos gratis donde puedas.' },
  abundancia: { name: 'Fortuna de temporada', n: 2, kind: 'Progreso', col: '#3a7a44', desc: 'Toma del comercio 2 recursos, los que quieras.' },
  monopolio:  { name: 'Avaricia', n: 2, kind: 'Progreso', col: '#3a7a44', desc: 'Elige un recurso: todos los rivales te entregan todo lo que tengan de él.' },
  mercader:   { name: 'Mercader', n: 2, kind: 'Especial', col: '#5a3e86', desc: 'Durante este turno todos tus cambios en el comercio son 2:1, con cualquier recurso.' },
  espia:      { name: 'Espía', n: 2, kind: 'Especial', col: '#5a3e86', desc: 'Elige un recurso y roba 1 al rival que más tenga de él.' },
  cosecha:    { name: 'Gran cosecha', n: 2, kind: 'Especial', col: '#5a3e86', desc: 'Cada uno de tus pueblos produce 1 recurso de su mejor terreno (las ciudades 2).' },
};
const ART1 = {}, ART2 = {};
function newDeck(){ const d = []; Object.entries(CARD_DEFS).forEach(([k, c]) => { for (let i=0;i<c.n;i++) d.push(k); }); return shuffle(d); }
const vpCards = p => G.players[p].cards ? G.players[p].cards.filter(c => c.t === 'punto').length : 0;
// ---------- 3D art for each card, same chunky outlined style as the items ----------
