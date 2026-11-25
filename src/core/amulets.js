// ================= THE WITCH'S AMULETS =================
const AMULETS = {
  ojo:        { name: 'Ojo turbio', tgt: 'player', desc: 'Durante los 2 siguientes turnos del rival, su número más productivo tiene 50% de darle solo la mitad.' },
  plaga:      { name: 'Plaga', tgt: 'player', res: 'trigo', plague: 'plaga', desc: 'Plaga en los trigales del rival por una ronda.' },
  incendio:   { name: 'Incendio', tgt: 'player', res: 'madera', plague: 'incendio', desc: 'Incendio en los bosques del rival por una ronda.' },
  derrumbe:   { name: 'Derrumbe', tgt: 'player', res: 'mineral', plague: 'derrumbe', desc: 'Derrumbe en las minas del rival por una ronda.' },
  inundacion: { name: 'Inundación', tgt: 'player', res: 'ladrillo', plague: 'inundación', desc: 'Inunda los barreros del rival por una ronda.' },
  enfermedad: { name: 'Enfermedad', tgt: 'player', res: 'lana', plague: 'enfermedad', desc: 'Enferma a las ovejas del rival por una ronda.' },
  demolicion: { name: 'Demolición', tgt: 'road', desc: 'Quita un camino (tuyo o de un rival) que sea una punta suelta y te quedas con su madera y ladrillo.' },
  escudo:     { name: 'Escudo de roble', tgt: 'passive', desc: 'Bloquea solo el siguiente amuleto que te lancen.' },
  trebol:     { name: 'Trébol de la fortuna', tgt: 'passive', desc: 'Al tirar los dados en tu turno podrás volver a tirarlos una vez.' },
  pluma:      { name: 'Pluma del viento', tgt: 'player', desc: 'Roba 1 recurso al azar al rival que elijas.' },
};
const AMK = Object.keys(AMULETS);
const PLAGUE_TXT = { trigo: 'Sin intercambio de trigo, −1 trigo al cosechar y riesgo al construir', madera: 'Sin intercambio de madera, −1 madera al cosechar y riesgo al construir', mineral: 'Sin intercambio de metal, −1 metal al cosechar y riesgo al construir', ladrillo: 'Sin intercambio de ladrillo, −1 ladrillo al cosechar y riesgo al construir', lana: 'Sin intercambio de lana, −1 lana al cosechar y riesgo al construir' };
// ---------- models: a pendant on a cord with a symbol for what it does ----------
