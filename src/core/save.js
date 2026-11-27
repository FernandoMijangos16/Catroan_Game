// ================= SAVE AND CONTINUE (solo games only: one slot in localStorage) =================
// The state is the same one the online game sends (netSnap), taken with this player at seat 0; continuing rebuilds the
// board from its terrains, numbers and ports and applies that state like an online client would (netApply).
// It is saved by itself at the end of every turn; "Guardar" in the pause menu saves the moment if it is a calm one
// (your turn, before or after rolling, nothing open), otherwise that turn's start is what stays saved.
const SAVE_KEY = 'hexterra-save';
const canSave = () => !!G && !NG.on && !TUT.on && !G.setup && !G.over && G.phase !== 'register';
function snapLocal(){
  const keep = { seat: NG.seat, n: NG.n, ver: NG.ver };
  NG.seat = 0; NG.n = G.players.length; NG.ver = 0;
  try { return netSnap(); } finally { Object.assign(NG, keep); }
}
// a moment that can be picked up again as it is: nobody is halfway through something
const calmNow = () => G.current === 0 && (G.phase === 'roll' || G.phase === 'main') && !G.buildMode && !G.amuletPick && (mode === 'board' || mode === 'village')
  && $('#modal').classList.contains('hidden');
function saveGame(){
  if (!canSave()) return false;
  const data = { v: 1, at: Date.now(), opts: { ...GAME_OPTS, online: false }, n: G.players.length, round: gameRound(),
    board: { types: G.tiles.map(t => t.type), nums: G.tiles.map(t => t.num), ports: G.ports.map(p => [p.type, p.a, p.b]), seed: G.seed },
    news: HIST.slice(-40), s: snapLocal() };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); return true; } catch { return false; }
}
function readSave(){ try { const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); return d && d.v === 1 && d.s && d.board ? d : null; } catch { return null; } }
const hasSave = () => !!readSave();
function clearSave(){ try { localStorage.removeItem(SAVE_KEY); } catch {} }
// end of every turn (core/bots.js endTurn)
function autoSave(){ if (canSave()) saveGame(); }
function continueGame(){
  const d = readSave(); if (!d) return false;
  PAUSE.gen++;
  Object.assign(GAME_OPTS, d.opts, { online: false }); closeMainMenu(); applyGameOpts();
  newGame(d.n, d.board, d.board.seed);
  Object.assign(NG, { seat: 0, n: d.n, ver: -1, regLocal: false, hold: false, held: null, dice: null });
  G.quests = (d.s.q || []).map(q => ({ ...q }));   // already known: their "new mission" notes do not pop up again
  netApply(d.s);
  if (Array.isArray(d.news)){ HIST.push(...d.news); setTimeout(renderNews, 50); }
  NG.ver = 0; refresh();
  const P = G.players[G.current];
  if (P.bot) botTurn(G.current, G.phase !== 'roll');
  else notify('Continuaste tu partida · <b>es tu turno</b>', P.color, 'sys');
  return true;
}
