// ================= TUTORIAL ("Cómo jugar"): a fixed game guided by Ulises, the traveller =================
// Always the same: same map (seed), you play first against two bots, the bots' villages are worked out from that map
// before the game starts, the dice come out of a list and the bots only roll and pass. Each step lets you use only
// what Ulises asks for (tutAllow), so the game cannot leave the script. The guide's panel is in ui/tutorial-guide.js.
// Part 1: welcome, placement, starting resources, dice and production, building. Part 2 (same game, or straight from
// "Cómo jugar" with the board already set up by tutSkipToPart2): the 7 and the robber, trading, cards. Part 3 (same game,
// or from "Cómo jugar" with tutSkipToPart3): objects and flowers, the village in first person, missions, the witch and amulets.
const TUT = { on: false, seed: 271828, plan: null, dice: [], allow: new Set(), glow: null, targetV: null, targetE: null, robTile: null, chapter: '', part: 1, bots: ['Rosa', 'Nico'] };
const TUT_CHAPTERS = ['Bienvenida', 'Colocación', 'Recursos iniciales', 'Dados y producción', 'Construir', 'El 7 y el ladrón', 'Comercio', 'Cartas',
  'Objetos y flores', 'El pueblo', 'Misiones', 'El brujo y los amuletos'];
// ---------- gates: everything asks here while the tutorial is on ----------
// k: 'dados', 'camino', 'pueblo', 'ciudad', 'carta', 'comercio', 'fin', 'tablero' (clicks on the board), 'cartas', 'jugadores',
// 'editar' (the panel-editing button: never in a step, so it stays locked; starting the tutorial turns editing off)
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
    const score = v => vscore(v) + (p === 0 && second ? (has(v, 'madera') ? 2 : 0) + (has(v, 'ladrillo') ? 2 : 0) + (v.port ? 8 : 0) : 0) - v.id*1e-6;
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
function startTutorial(part = 1){
  PAUSE.gen++; TUT.part = part;
  Object.assign(GAME_OPTS, { mode: 'catroan', firstPerson: true, online: false, botLevel: 'normal', events: false });
  closeMainMenu(); applyGameOpts();
  TUT.on = true; document.body.classList.add('tutorial');
  if (editOn()) setEditPanels(false, true);   // no panel editing while Ulises points at things (the saved choice stays)
  newGame(3, null, TUT.seed);
  const me = G.players[0];
  try { me.name = localStorage.getItem('hexterra-name') || 'Alcalde'; me.avatar = avOk(localStorage.getItem('hexterra-avatar') || me.avatar); } catch {}
  TUT.bots.forEach((n, i) => { G.players[i + 1].name = n; G.players[i + 1].bot = true; });
  G.order = [0, 1, 2]; PLATES.forEach(p => p.build()); updatePlates(true);
  TUT.plan = tutPlan();
  if (part === 2) tutSkipToPart2(); else if (part === 3) tutSkipToPart3();
  tutGuideOpen();
  tutScript(part);
}
// part 2 straight away: the placement of part 1 as the plan says, starting resources, your third road, your turn
function tutSkipToPart2(){
  TUT.plan.forEach(({ p, v, e }, k) => { buildSettlement(p, v, true); buildRoad(p, e, true); if (k >= 3) G.players[p].v2 = v; });
  G.setup = false; G.phase = 'main'; G.current = 0; G.turnId = 4; SETUP.k = TUT.plan.length;
  G.players.forEach((P, i) => { const { types } = startAllowance(i), got = {}; for (let k=0;k<3 && types.length;k++){ const r = types[k % types.length]; got[r] = (got[r] || 0) + 1; } giveStart(i, got); });
  const e = tutRoadTarget(); if (e != null) buildRoad(0, e, true);
  updateLongest?.(); PLATES.forEach(pl => pl.build()); updatePlates(true); updateInventory(); refresh();
}
// ---------- the script ----------
const tutMine = k => G.verts.filter(v => v.building && v.building.p === 0).length >= k;
const tutRoads = () => G.edges.filter(e => e.road === 0).length;
async function tutScript(part){
  const gen = PAUSE.gen, me = G.players[0], alive = () => TUT.on && PAUSE.gen === gen;
  const say = (txt, o) => alive() && tutSay(txt, o), act = (txt, until, o) => alive() && tutAct(txt, until, o);
  if (part === 2){ if (await tutPart2(say, act, me) && await tutPart3(say, act, me)) tutFinish(); return; }
  if (part === 3){ if (await tutPart3(say, act, me)) tutFinish(); return; }
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
  if (await tutPart2(say, act, me) && await tutPart3(say, act, me)) tutFinish();
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
  TUT.chapter = TUT_CHAPTERS.length;
  const r = await tutSay('¡Eso es todo por ahora! Pronto te enseño los eventos de temporada, el camino más largo y cómo se gana. ¿Quieres seguir jugando esta partida?', { expr: 'risa', buttons: [['menu', 'Volver al menú'], ['free', 'Seguir jugando']] });
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

// ================= PART 2: the 7 and the robber, trading, cards =================
const tutInTrade = () => !!marketCtx || busy || !modal.classList.contains('hidden');
// a scene (or the simple panel) was opened and has been closed for a moment: back on the board
function tutSceneOver(){ let seen = false, calm = 0; return () => { if (tutInTrade()){ seen = true; calm = 0; return false; } if (!seen || mode !== 'board') return false; return ++calm >= 6; }; }
// Ulises fills in what is missing for the next lesson, from his pack (and says so)
async function tutTopUp(say, want, why){
  const me = G.players[0], got = {};
  Object.entries(want).forEach(([r, n]) => { const k = n - (me.res[r] || 0); if (k > 0){ me.res[r] += k; got[r] = k; } });
  if (!Object.keys(got).length) return true;
  updateInventory(); refresh();
  return say(`${why} Te doy ${resStr(got)} de mi mochila.`, { expr: 'guiño' });
}
// the tile the bot's robber goes to: one of yours, with a number, where no bot has a village (so it robs you)
function tutRobTileFor(p){
  const near = q => new Set(G.verts.filter(v => v.building && v.building.p === q).flatMap(v => v.tiles));
  const mine = near(0), theirs = new Set(G.players.map((P, i) => i).filter(i => i !== 0).flatMap(i => [...near(i)]));
  const ok = [...mine].map(ti => G.tiles[ti]).filter(t => t.num && t.i !== G.robber);
  const best = ok.filter(t => !theirs.has(t.i)).sort((a, b) => pips(b.num) - pips(a.num))[0] || ok[0];
  return best ? best.i : null;
}
// your port, if your villages have one
function tutMyPort(){ return G.ports.findIndex(pt => [pt.a, pt.b].some(v => G.verts[v].building && G.verts[v].building.p === 0)); }
async function tutPart2(say, act, me){
  const R = TUT.bots[0];
  // 6 · the 7 and the robber
  TUT.chapter = 5;
  if (!await say('Sigamos con lo que da más miedo en la isla: el <b>ladrón</b>.', { expr: 'serio' })) return false;
  { const fill = ['trigo', 'lana', 'mineral', 'trigo', 'lana', 'mineral', 'trigo', 'trigo', 'lana'], want = {}; let t = total(me);
    for (const r of fill){ if (t >= 9) break; want[r] = (want[r] || me.res[r] || 0) + 1; t++; }
    if (!await tutTopUp(say, want, 'Vamos a llenar tu bolsa: si tienes <b>más de 7</b> cuando sale un 7, el ladrón se lleva la mitad.')) return false; }
  TUT.dice = [[3, 4], tutDiceFor(2), [3, 4]]; TUT.robTile = tutRobTileFor(1); TUT.glow = 'fin';
  if (!await act('Termina tu turno.', () => G.current !== 0, { allow: ['fin'] })) return false;
  TUT.glow = null;
  if (!await act(`${R} va a tirar…`, () => G.phase === 'discard' || G.robber === TUT.robTile, { wait: true })) return false;
  if (G.phase === 'discard' && !await act(scenesOn() ? `¡${R} sacó <b>7</b>! Tienes más de 7 recursos: el ladrón te espera en el callejón. Toca en tu barra los que le entregas.` : `¡${R} sacó <b>7</b>! Tienes más de 7: elige la mitad para entregarla al ladrón.`,
    () => G.phase !== 'discard', { expr: 'sorpresa' })) return false;
  if (!await act(`Ahora ${R} pone al ladrón en un terreno tuyo y <b>te roba 1 recurso</b>. Mientras esté ahí, ese terreno no produce.`, () => G.current === 0 && G.phase === 'roll', { wait: true, expr: 'serio' })) return false;
  TUT.robTile = null; TUT.glow = 'dados';
  if (!await act('Tu turno: tira los <b>dados</b>.', () => G.phase === 'robber' || G.phase === 'main', { allow: ['dados'] })) return false;
  TUT.glow = null;
  { const near = new Set(G.verts.filter(v => v.building && v.building.p === 1).flatMap(v => v.tiles)), t = [...near].map(ti => G.tiles[ti]).filter(t => t.num && t.i !== G.robber).sort((a, b) => pips(b.num) - pips(a.num))[0];
    if (t){ pingAt?.(t.x, t.z, G.players[1].color); focusBoard?.(t.x, t.z, G.players[1].color); } }
  if (!await act(`¡Ahora sacaste <b>7</b> tú! Toca un terreno donde tenga pueblo ${R} o ${TUT.bots[1]} para mandarle al ladrón: le robarás 1 recurso.`, () => G.phase !== 'robber' && G.phase !== 'discard', { allow: ['ladron'], expr: 'risa' })) return false;
  if (!await say('El ladrón se queda ahí hasta que alguien saque otro 7 o juegue una <b>Guardia</b>.')) return false;
  // 7 · trading
  TUT.chapter = 6;
  if (!await say('Cuando te falta algo, <b>comercia</b>. El comercio siempre acepta <b>4 iguales por 1</b> de lo que quieras.')) return false;
  if (!await tutTopUp(say, { trigo: 4 }, 'Para practicar necesitas 4 trigos.')) return false;
  TUT.glow = 'comercio';
  if (!await act('Toca <b>Comercio</b>.', () => tutInTrade(), { allow: ['comercio'] })) return false;
  TUT.glow = null;
  { const r0 = { ...me.res };
    if (!await act(scenesOn() ? `Pon tus 4 ${resImg('trigo')} en la mesa, elige lo que quieres y <b>toca la campana</b>. Luego toca <b>Salir del mercado</b>.` : `Da un lote de 4 ${resImg('trigo')}, elige 1 de lo que quieras y cambia.`, tutSceneOver())) return false;
    const traded = RES.some(r => me.res[r] !== r0[r]);
    if (!await say(traded ? '¡Bien cambiado!' : 'Esta vez no cambiaste, pero ya sabes dónde está el mercader.')) return false; }
  const pi = tutMyPort();
  if (pi >= 0){ const pt = G.ports[pi], two = pt.type !== '3:1';
    if (!await say(`Tu pueblo está junto a un <b>puerto</b>: ahí cambias más barato, ${two ? `2 ${resImg(pt.type)} por 1` : '3 recursos cualesquiera por 1'}. El pirata del muelle te atiende.`)) return false;
    if (!await tutTopUp(say, two ? { [pt.type]: 2 } : { lana: 2, mineral: 1 }, 'Para el pirata necesitas recursos.')) return false;
    const a = G.verts[pt.a], b = G.verts[pt.b]; focusBoard?.((a.x + b.x)/2, (a.z + b.z)/2, me.color);
    if (!await act('Toca el <b>ancla del puerto</b> junto a tu pueblo.', () => tutInTrade(), { allow: ['puerto'] })) return false;
    if (!await act(scenesOn() ? 'Dale tus recursos al pirata, elige lo que quieres y luego toca <b>Volver al tablero</b>.' : 'Cambia en el puerto y cierra el panel.', tutSceneOver())) return false; }
  if (!await say(`También puedes cambiar con los demás jugadores: les mandas una <b>carta de trueque</b> y ellos la sellan con SÍ o NO.`)) return false;
  { const give = RES.find(r => me.res[r] > 0) || 'trigo', want = RES.find(r => r !== give && G.players[1].res[r] > 0);
    if (!me.res[give]){ me.res[give] = 1; updateInventory(); }
    if (!want){ G.players[1].res.madera++; }
    if (!await act(`Toca el letrero de <b>${R}</b> (arriba) y elige <b>Proponer trueque</b>.`, () => tutInTrade(), { allow: ['jugadores'] })) return false;
    if (!await act(scenesOn() ? `Escribe la carta: toca los <b>+</b> para poner lo que ofreces y lo que pides, y envíala. Un mensajero se la lleva a ${R}.` : `Elige lo que das y lo que pides a ${R} y envía la propuesta.`, tutSceneOver())) return false;
    if (!await say(tradeCount(0, 1) > 0 ? `${R} aceptó. Cada pareja puede hacer hasta ${TRADE_MAX} trueques por turno.` : `Esta vez no se cerró el trato. Cada pareja puede hacer hasta ${TRADE_MAX} trueques por turno.`)) return false; }
  // 8 · cards
  TUT.chapter = 7;
  if (!await say(`Las <b>cartas</b> cuestan ${resImg('lana')} ${resImg('trigo')} ${resImg('mineral')}. Unas dan puntos, otras te ayudan: Guardia, Rutas y senderos, Temporada de abundancia, Avaricia…`)) return false;
  if (!await tutTopUp(say, { lana: 1, trigo: 1, mineral: 1 }, 'Para tu primera carta necesitas lana, trigo y metal.')) return false;
  { const k = G.deck.lastIndexOf('caballero'); if (k >= 0){ G.deck.splice(k, 1); G.deck.push('caballero'); } }   // the next card is a Guardia
  const n0 = (me.cards || []).length; TUT.glow = 'carta';
  if (!await act('Toca <b>Carta</b> para comprar una.', () => (me.cards || []).length > n0, { allow: ['carta'] })) return false;
  TUT.glow = null;
  if (!await say('¡Una <b>Guardia</b>! Las cartas no se juegan el turno en que las compras. Las de <b>Punto de desarrollo</b> se suman solas, sin jugarlas.')) return false;
  TUT.dice = [tutDiceFor(1), tutDiceFor(2), tutDiceFor(0)]; TUT.glow = 'fin';
  if (!await act('Termina tu turno para poder usarla.', () => G.current !== 0, { allow: ['fin'] })) return false;
  TUT.glow = null;
  if (!await act(`Juegan ${R} y ${TUT.bots[1]}…`, () => G.current === 0 && G.phase === 'roll', { wait: true })) return false;
  if (!await act('La Guardia se puede jugar <b>incluso antes de tirar</b>. Abre tus cartas (abajo a la izquierda) y juega la Guardia.', () => G.phase === 'robber', { allow: ['cartas'] })) return false;
  if (!await act('Mueve al ladrón a otro terreno: así se lo quitas de encima a tu pueblo y le robas a alguien.', () => G.phase !== 'robber', { allow: ['ladron'] })) return false;
  if (!await say('Quien junte <b>3 Guardias</b> o más, y más que nadie, tiene la <b>Guardia más poderosa</b>: vale 2 puntos.', { expr: 'risa' })) return false;
  TUT.glow = 'dados';
  if (!await act('Ahora sí, tira los <b>dados</b>.', () => G.phase !== 'roll', { allow: ['dados'] })) return false;
  TUT.glow = null;
  return true;
}

// ================= PART 3: objects and flowers, the village in first person, missions, the witch and amulets =================
// Missions are off in the tutorial (assignQuestFor0 / villageQuests) and so are the random finds (bioTick, roadFind,
// villageGifts): here Ulises posts two fixed missions in your first village and the finds come when he says.
// New gates: 'visitar' (only the ! over your village, to go in), 'misiones' (the missions panel), 'amuletos' (the box).
// part 3 straight away: the board as part 2 leaves it (a few rounds later, your turn, dice already rolled)
function tutSkipToPart3(){
  tutSkipToPart2();
  G.turnId = 13; G.dice = [2, 3]; G.phase = 'main';
  updatePlates(true); updateInventory(); refresh();
}
function tutQuest(o){
  const q = { id: o.id, p: 0, vid: o.vid, items: o.items, item: Object.keys(o.items)[0], n: Object.values(o.items)[0], kind: o.kind, role: o.role, gender: o.gender, name: o.name, reward: o.reward, state: 'new', expr: o.expr };
  q.txt = o.txt.replace('{x}', qListM(q));
  (G.quests ||= []).push(q); drawQuestMarks(); return q;
}
function tutFind(k, n, where){ giveSpecial(0, k, n); notify(`Encontraste ${foundStr(k, n)} ${where}`, G.players[0].color); }
const tutCalm = () => mode === 'board' && !busy && !marketCtx;
async function tutPart3(say, act, me){
  const R = TUT.bots[0], N = TUT.bots[1], home = TUT.plan[0].v, hv = G.verts[home];
  const atHome = () => { focusBoard?.(hv.x, hv.z, me.color); pingAt?.(hv.x, hv.z, me.color); };
  // 9 · objects and flowers
  TUT.chapter = 8;
  if (!await say('En la isla no solo hay recursos: también hay <b>objetos</b> y <b>flores</b>. Los aldeanos los piden en sus misiones.')) return false;
  if (!await tutTopUp(say, { madera: 1, ladrillo: 1 }, 'Para el siguiente camino necesitas madera y ladrillo.')) return false;
  { const r0 = tutRoads(); TUT.targetE = tutRoadTarget(); TUT.glow = 'camino';
    if (TUT.targetE != null){ const e = G.edges[TUT.targetE], a = G.verts[e.a]; focusBoard?.(a.x, a.z, me.color); }
    if (!await act('Construye un <b>camino</b> donde brilla. Al abrir caminos, a veces encuentras flores.', () => tutRoads() > r0, { allow: ['camino', 'tablero'] })) return false;
    TUT.glow = null; TUT.targetE = null; await wait(900); }
  tutFind('margarita', 2, 'junto al camino');
  if (!await say(`¡Encontraste <b>2 margaritas</b>! Se guardan en tu ventana de <b>Objetos y flores</b>, a la izquierda.`, { expr: 'risa' })) return false;
  if (!await say('Cuando un terreno tuyo produce seguido, a veces sale su objeto: champiñones en el bosque, cristales en la montaña, miel en la pradera, vasijas en el cerro, semillas en el campo y ámbar en el desierto.')) return false;
  TUT.dice = [tutDiceFor(1), tutDiceFor(2), tutDiceFor(0, 'madera')]; TUT.glow = 'fin';
  if (!await act('Termina tu turno.', () => G.current !== 0, { allow: ['fin'] })) return false;
  TUT.glow = null;
  if (!await act(`Juegan ${R} y ${N}…`, () => G.current === 0 && G.phase === 'roll', { wait: true })) return false;
  TUT.glow = 'dados';
  if (!await act('Tu turno: tira los <b>dados</b>.', () => G.phase === 'main', { allow: ['dados'] })) return false;
  TUT.glow = null; await wait(2600);
  let found;
  { const n = G.dice[0] + G.dice[1], got = tutGot(0, n), biome = got ? G.tiles[[...G.verts.filter(v => v.building && v.building.p === 0).flatMap(v => v.tiles)].find(ti => G.tiles[ti].num === n && TERRAIN[G.tiles[ti].type].res === got.res)].type : 'bosque';
    found = SPK.find(k => SPECIAL[k].kind === 'objeto' && SPECIAL[k].biome === biome) || 'hongo';
    tutFind(found, 1, `en ${TERRAIN[biome].label.toLowerCase()}`);
    if (!await say(`Tu ${got ? got.label : 'terreno'} volvió a producir y encontraste ${foundStr(found, 1)}. Guárdalo: alguien lo va a querer.`, { expr: 'sonrisa' })) return false; }
  // 10 · the village (in first person; without it, the missions come to your panel)
  TUT.chapter = 9;
  const q1 = tutQuest({ id: 'tut-flor', vid: home, kind: 'flor', role: 'campesino', gender: 'f', name: 'Doña Lupe', items: { margarita: 2 }, reward: { type: 'res', res: { lana: 1, trigo: 1, mineral: 1 } }, expr: 'triste',
    txt: 'Mi nieto tiene tos… con {x} le preparo un té. ¿Me ayudas?' });
  if (scenesOn()){
    if (!await say(`Tus pueblos se pueden <b>visitar</b>. Sobre <b>${hv.name}</b> apareció un <b>!</b> amarillo: alguien necesita ayuda.`)) return false;
    atHome();
    if (!await act('Toca el <b>!</b> sobre tu pueblo para entrar.', () => mode === 'village' && villageCtx && villageCtx.vid === home, { allow: ['visitar'] })) return false;
    await wait(1800);
    if (!await say('Estás dentro de tu pueblo. Camina con <b>W A S D</b> o las flechas, gira con <b>Q</b> y <b>E</b>, corre con <b>Shift</b> y arrastra para mirar.')) return false;
    { const p0 = ctl.pos.clone();
      if (!await act('Camina un poco por el pueblo.', () => mode !== 'village' || Math.hypot(ctl.pos.x - p0.x, ctl.pos.z - p0.z) > 3)) return false; }
    if (!await say('Aquí vive tu gente: trabaja, platica, vende en el mercado y a veces te regala flores. Toca a cualquiera para platicar.')) return false;
    if (!await act(`Junto al <b>pozo</b> hay un cartel. Ve con <b>${q1.name}</b>, que está colgando un folleto, y tócala.`, () => q1.state === 'accepted', { expr: 'duda' })) return false;
    if (!await act('¡Aceptaste su misión! Toca <b>Tablero</b>, abajo, para volver.', () => tutCalm())) return false;
  } else {
    if (!await say('Con la primera persona encendida podrías entrar a tus pueblos y caminar por ellos. Sin ella, las misiones llegan directo a tu panel.')) return false;
    if (!await act('Abre tus <b>misiones</b> (el cartel de arriba) y toca <b>Aceptar</b>.', () => q1.state === 'accepted', { allow: ['misiones'] })) return false;
  }
  // 11 · missions
  TUT.chapter = 10;
  if (!await say(`${q1.name} pidió ${qImgs(q1)} y ya los tienes. Cuando juntas lo que piden, entregas desde tu panel de misiones.`)) return false;
  if (!await act(`Abre tus <b>misiones</b> (el cartel de arriba) y toca el <b>sello</b> para aprobar la entrega.${scenesOn() ? ' Ella irá a tu despacho.' : ''}`, () => q1.state === 'done' && tutCalm(), { allow: ['misiones'] })) return false;
  if (!await say(`${q1.name} te pagó con ${rewardText(q1.reward)}. Cada misión da algo distinto: recursos, descuentos, caminos de regalo o cartas.`, { expr: 'risa' })) return false;
  // 12 · the witch and the amulets
  TUT.chapter = 11;
  if (!await say('En las afueras de tus pueblos vive <b>el brujo</b>. Sus misiones piden varias cosas, y paga con <b>amuletos</b>.', { expr: 'serio' })) return false;
  tutFind('lirio', 1, 'en la mochila de Ulises');
  if (!await say(`Te doy un ${specImg('lirio')} <b>lirio</b> de mi mochila: el brujo lo va a querer.`, { expr: 'guiño' })) return false;
  const q2 = tutQuest({ id: 'tut-brujo', vid: home, kind: 'brujo', role: 'brujo', gender: 'm', name: 'El brujo', items: { [found]: 1, lirio: 1 }, reward: { type: 'amulet', k: 'pluma' }, expr: 'serio',
    txt: 'Je, je… para mi caldero necesito {x}. A cambio, te daré algo que pocos han tocado.' });
  if (scenesOn()){
    atHome();
    if (!await act('Ahora el <b>!</b> sobre tu pueblo es morado: es el brujo. Tócalo para entrar.', () => mode === 'village' && villageCtx && villageCtx.vid === home, { allow: ['visitar'] })) return false;
    await wait(1800);
    if (!await act('Busca su <b>choza</b> en las afueras: le sale humo morado y tiene un <b>!</b> morado encima. Háblale.', () => q2.state === 'accepted', { expr: 'duda' })) return false;
    if (!await act('Vuelve al <b>Tablero</b>.', () => tutCalm())) return false;
  } else if (!await act('Abre tus <b>misiones</b> y acepta la del brujo.', () => q2.state === 'accepted', { allow: ['misiones'] })) return false;
  if (!await act('Ya tienes lo que pide. Abre tus <b>misiones</b> y sella la entrega del brujo.', () => q2.state === 'done' && tutCalm(), { allow: ['misiones'] })) return false;
  if (!await say('¡Un <b>amuleto</b>! Se guardan en tu <b>caja de amuletos</b>, detrás de tus cartas (abajo a la izquierda).', { expr: 'risa' })) return false;
  if (!await say('Unos se lanzan a un rival (plaga, incendio, derrumbe…), otros te protegen (el escudo de roble) o te ayudan (el trébol te deja volver a tirar los dados).')) return false;
  if (!await act(`Toca tu caja de amuletos, elige la <b>Pluma del viento</b> y luego el letrero de <b>${R}</b>: le robarás 1 recurso.`, () => !((me.amulets || {}).pluma > 0) && !G.amuletPick, { allow: ['amuletos', 'jugadores'] })) return false;
  if (!await say('Cuidado: los rivales también te pueden lanzar amuletos. El <b>escudo de roble</b> bloquea el siguiente.', { expr: 'serio' })) return false;
  return true;
}
