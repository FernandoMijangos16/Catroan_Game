// ================= TUTORIAL ("Cómo jugar"): a fixed game guided by Ulises, the traveller =================
// Always the same: same map (seed), you play first against two bots, the bots' villages are worked out from that map
// before the game starts, the dice come out of a list and the bots only roll and pass. Each step lets you use only
// what Ulises asks for (tutAllow), so the game cannot leave the script. The guide's panel is in ui/tutorial-guide.js.
// Chapters in this first part: welcome, placement, starting resources, dice and production, building.
const TUT = { on: false, seed: 271828, plan: null, dice: [], allow: new Set(), glow: null, targetV: null, targetE: null, chapter: '', bots: ['Rosa', 'Nico'] };
const TUT_CHAPTERS = ['Bienvenida', 'Colocación', 'Recursos iniciales', 'Dados y producción', 'Construir'];
// ---------- gates: everything asks here while the tutorial is on ----------
// k: 'dados', 'camino', 'pueblo', 'ciudad', 'carta', 'comercio', 'fin', 'tablero' (clicks on the board), 'cartas', 'jugadores'
function tutAllow(k){
  if (!TUT.on || TUT.allow.has(k)) return true;
  tutNudge(); return false;
}
const tutRoadOnly = list => TUT.on && TUT.targetE != null ? list.filter(e => e.id === TUT.targetE) : list;
const tutSpotOnly = list => TUT.on && TUT.targetV != null ? list.filter(v => v.id === TUT.targetV) : list;
// ---------- the plan: who places where, worked out from the fixed map ----------
function tutPlan(){
  const queue = [0, 1, 2, 2, 1, 0], taken = new Set(), roads = new Set(), plan = [];
  const free = v => !taken.has(v.id) && v.adj.every(a => !taken.has(a)) && v.tiles.some(ti => TERRAIN[G.tiles[ti].type].res && ti !== G.robber);
  const has = (v, r) => v.tiles.some(ti => TERRAIN[G.tiles[ti].type].res === r && ti !== G.robber);
  queue.forEach((p, k) => {
    const second = k >= 3;
    // your second village touches wood and brick if it can: the road of the last chapter is built with them
    const score = v => vscore(v) + (p === 0 && second ? (has(v, 'madera') ? 2 : 0) + (has(v, 'ladrillo') ? 2 : 0) : 0) - v.id*1e-6;
    const v = G.verts.filter(free).sort((a, b) => score(b) - score(a))[0];
    taken.add(v.id);
    const e = v.edges.map(id => G.edges[id]).filter(ed => !roads.has(ed.id)).map(ed => ({ ed, s: vscore(G.verts[ed.a === v.id ? ed.b : ed.a]) - ed.id*1e-6 })).sort((a, b) => b.s - a.s)[0].ed;
    roads.add(e.id); plan.push({ p, v: v.id, e: e.id });
  });
  return plan;
}
const tutSlot = () => TUT.plan && TUT.plan[SETUP.k];
// the dice: your rolls pay you wood and then brick (whatever you still lack for a road), the bots' pay them
function tutDiceFor(p, want){
  const mine = G.verts.filter(v => v.building && v.building.p === p).flatMap(v => v.tiles).map(ti => G.tiles[ti]).filter(t => t.num && t.i !== G.robber && t.num !== 7);
  const t = (want && mine.find(t => TERRAIN[t.type].res === want)) || mine.sort((a, b) => pips(b.num) - pips(a.num))[0];
  const n = t ? t.num : 6, d1 = Math.max(1, n - 6), d2 = n - d1;
  return [Math.min(d1, d2), Math.max(d1, d2)];
}
function tutQueueDice(){
  const me = G.players[0], lack = r => (me.res[r] || 0) < 1;
  TUT.dice = [tutDiceFor(0, lack('madera') ? 'madera' : lack('ladrillo') ? 'ladrillo' : null), tutDiceFor(1), tutDiceFor(2)];
}
// ---------- start ----------
function startTutorial(){
  PAUSE.gen++;
  Object.assign(GAME_OPTS, { mode: 'catroan', firstPerson: true, online: false, botLevel: 'normal', events: false });
  closeMainMenu(); applyGameOpts();
  TUT.on = true; document.body.classList.add('tutorial');
  newGame(3, null, TUT.seed);
  const me = G.players[0];
  try { me.name = localStorage.getItem('hexterra-name') || 'Alcalde'; me.avatar = avOk(localStorage.getItem('hexterra-avatar') || me.avatar); } catch {}
  TUT.bots.forEach((n, i) => { G.players[i + 1].name = n; G.players[i + 1].bot = true; });
  G.order = [0, 1, 2]; PLATES.forEach(p => p.build()); updatePlates(true);
  TUT.plan = tutPlan();
  tutGuideOpen();
  tutScript();
}
// ---------- the script ----------
const tutMine = k => G.verts.filter(v => v.building && v.building.p === 0).length >= k;
const tutRoads = () => G.edges.filter(e => e.road === 0).length;
async function tutScript(){
  const gen = PAUSE.gen, me = G.players[0], alive = () => TUT.on && PAUSE.gen === gen;
  const say = (txt, o) => alive() && tutSay(txt, o), act = (txt, until, o) => alive() && tutAct(txt, until, o);
  // 1 · welcome
  TUT.chapter = 0;
  if (!await say(`¡Hola, <b>${me.name}</b>! Soy <b>Ulises</b>. Recorrí esta isla de punta a punta con mi mochila, y te voy a enseñar a jugar.`, { expr: 'risa' })) return;
  if (!await say('Gana quien llegue primero a <b>10 puntos</b>. Cada pueblo vale 1 punto y cada ciudad 2.')) return;
  if (!await say(`Cada hexágono es un bioma y da un recurso: el bosque ${resImg('madera')}, el cerro ${resImg('ladrillo')}, la pradera ${resImg('lana')}, el campo ${resImg('trigo')} y la montaña ${resImg('mineral')}. El desierto no da nada.`)) return;
  if (!await say('El número de cada hexágono dice con qué tirada de dados produce. El <b>6</b> y el <b>8</b> salen seguido; el <b>2</b> y el <b>12</b>, casi nunca.', { expr: 'serio' })) return;
  // 2 · placement
  TUT.chapter = 1; startSetup();
  const slot = k => TUT.plan[k];
  TUT.targetV = slot(0).v; focusBoard?.(G.verts[slot(0).v].x, G.verts[slot(0).v].z, me.color);
  if (!await act('Coloca tu <b>primer pueblo</b> en el cruce que brilla. Toca varios biomas con buenos números: es un buen lugar.', () => tutMine(1))) return;
  TUT.targetV = null; TUT.targetE = slot(0).e;
  if (!await act('Ahora pon un <b>camino</b> junto a tu pueblo. Los caminos te llevan a nuevos cruces.', () => tutRoads() >= 1)) return;
  TUT.targetE = null;
  if (!await act(`Ahora colocan <b>${TUT.bots[0]}</b> y <b>${TUT.bots[1]}</b>. El orden se regresa: quien puso al último pone dos seguidos.`, () => G.phase === 'setupV' && G.current === 0, { wait: true })) return;
  TUT.targetV = slot(5).v; focusBoard?.(G.verts[slot(5).v].x, G.verts[slot(5).v].z, me.color);
  if (!await act('Tu <b>segundo pueblo</b>. Fíjate en sus biomas: de ellos saldrán tus recursos iniciales.', () => tutMine(2))) return;
  TUT.targetV = null; TUT.targetE = slot(5).e;
  if (!await act('Y su <b>camino</b>.', () => tutRoads() >= 2)) return;
  TUT.targetE = null;
  // 3 · starting resources
  TUT.chapter = 2;
  if (!await act(`Tu segundo pueblo te da <b>3 recursos</b> de sus biomas. Te recomiendo ${resImg('madera')} y ${resImg('ladrillo')}: con ellos se hacen caminos.`, () => !G.setup && !(me.startPick > 0), { wait: true, expr: 'duda' })) return;
  if (!await act('Este letrero te muestra qué biomas tocan tus pueblos. Toca el botón para empezar.', () => !G.setup && G.phase === 'roll' && !document.body.classList.contains('registering') && !($('#reg') && $('#reg').classList.contains('show')), { wait: true })) return;
  // 4 · dice and production
  TUT.chapter = 3; tutQueueDice();
  if (!await say('Cada turno empieza tirando los dados. El número que sale hace producir a todos los hexágonos que lo tienen.')) return;
  TUT.glow = 'dados';
  if (!await act('Toca los <b>dados</b>.', () => G.phase === 'main', { allow: ['dados'] })) return;
  TUT.glow = null; await wait(2600);
  { const n = G.dice[0] + G.dice[1], got = tutGot(0, n);
    if (!await say(`Salió <b>${n}</b>. ${got ? `Tu pueblo está junto a un ${got.label} con el ${n}: te dio ${resImg(got.res)}.` : ''} Todos los que tengan pueblo junto a un ${n} cobran, aunque no sea su turno.`, { expr: 'sonrisa' })) return; }
  if (!await say('Si sale <b>7</b> nadie cobra y aparece el ladrón. Eso lo veremos en la siguiente parte.', { expr: 'serio' })) return;
  TUT.glow = 'fin';
  if (!await act('Termina tu turno con el reloj de arena.', () => G.current !== 0, { allow: ['fin'] })) return;
  TUT.glow = null;
  if (!await act(`Ahora juegan <b>${TUT.bots[0]}</b> y <b>${TUT.bots[1]}</b>: también tiran y cobran.`, () => G.current === 0 && G.phase === 'roll', { wait: true })) return;
  TUT.dice.unshift(tutDiceFor(0, (me.res.madera || 0) < 1 ? 'madera' : (me.res.ladrillo || 0) < 1 ? 'ladrillo' : null)); TUT.glow = 'dados';
  if (!await act('Tu turno otra vez: tira los <b>dados</b>.', () => G.phase === 'main', { allow: ['dados'] })) return;
  TUT.glow = null; await wait(2600);
  // 5 · building
  TUT.chapter = 4;
  const lack = RES.filter(r => r === 'madera' || r === 'ladrillo').filter(r => (me.res[r] || 0) < 1);
  if (lack.length){ lack.forEach(r => { me.res[r]++; }); updateInventory?.(); refresh();
    if (!await say(`Te falta ${lack.map(r => resImg(r)).join(' y ')}: te lo regalo de mi mochila, para que veas cómo se construye.`, { expr: 'guiño' })) return; }
  if (!await say(`Un <b>camino</b> cuesta ${resImg('madera')} ${resImg('ladrillo')}. Con caminos llegas a cruces nuevos para fundar más pueblos.`)) return;
  TUT.targetE = tutRoadTarget(); TUT.glow = 'camino';
  { const e = G.edges[TUT.targetE], a = G.verts[e.a]; focusBoard?.(a.x, a.z, me.color); }
  if (!await act('Toca <b>Camino</b> y ponlo donde brilla.', () => tutRoads() >= 3, { allow: ['camino', 'tablero'] })) return;
  TUT.glow = null; TUT.targetE = null;
  if (!await say(`Un <b>pueblo</b> cuesta ${resImg('madera')} ${resImg('ladrillo')} ${resImg('lana')} ${resImg('trigo')} y va en un cruce con tu camino, a dos tramos de cualquier otro pueblo.`)) return;
  if (!await say(`Una <b>ciudad</b> mejora uno de tus pueblos con ${resImg('trigo')}×2 ${resImg('mineral')}×3: vale 2 puntos y cobra el doble.`)) return;
  TUT.chapter = 5;
  tutFinish();
}
// what player p got from tile number n (the first producing tile next to one of its buildings)
function tutGot(p, n){
  for (const v of G.verts) if (v.building && v.building.p === p) for (const ti of v.tiles){ const t = G.tiles[ti]; if (t.num === n && ti !== G.robber && TERRAIN[t.type].res) return { res: TERRAIN[t.type].res, label: TERRAIN[t.type].label.toLowerCase() }; }
  return null;
}
// the road of the last chapter: from one of your villages toward the best free crossing
function tutRoadTarget(){
  const list = validRoads(0); if (!list.length) return null;
  const s = e => Math.max(...[e.a, e.b].map(id => { const v = G.verts[id]; return distanceOK(v) ? vscore(v) : 0; })) - e.id*1e-6;
  return list.sort((a, b) => s(b) - s(a))[0].id;
}
// the end of this first part: keep playing freely, or back to the menu
async function tutFinish(){
  const r = await tutSay('¡Eso es todo por ahora! Pronto te enseño el ladrón, el comercio, las cartas, las misiones y el pueblo en primera persona. ¿Quieres seguir jugando esta partida?', { expr: 'risa', buttons: [['menu', 'Volver al menú'], ['free', 'Seguir jugando']] });
  if (r === 'menu'){ leaveToMenu(); return; }
  tutEnd();
}
// the tutorial lets go: from here it is a normal game against normal bots
function tutEnd(){
  TUT.on = false; TUT.allow.clear(); TUT.glow = null; TUT.targetE = TUT.targetV = null; TUT.dice = [];
  document.body.classList.remove('tutorial'); tutGuideClose(); refresh();
  if (G.players[G.current].bot) botTurn(G.current, G.phase !== 'roll');
}
// the bots of the tutorial: roll, wait, pass
async function tutBotTurn(p, alive){
  await wait(1200); if (!alive()) return;
  await rollDice();
  await annIdle(); await wait(mode === 'board' ? 2400 : 1100); if (!alive()) return;
  endTurn();
}
