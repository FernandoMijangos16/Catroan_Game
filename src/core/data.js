// ================= GAME DATA =================
const TERRAIN = {
  bosque:   { res:'madera',   color:0x3d8a3f, ground:0x4f8d3f, label:'Bosque' },
  pradera:  { res:'lana',     color:0x9ad46b, ground:0x96cb63, label:'Pradera' },
  campo:    { res:'trigo',    color:0xe9c64a, ground:0xd9bf5c, label:'Campo' },
  cerro:    { res:'ladrillo', color:0xcf6f3c, ground:0xc27d4e, label:'Cerro' },
  montana:  { res:'mineral',  color:0x8d939c, ground:0x9a9c96, label:'Montaña' },
  desierto: { res:null,       color:0xe6d49c, ground:0xe4d5a0, label:'Desierto' },
};
const RES = ['madera','ladrillo','lana','trigo','mineral'];
const RES_ICON = { madera:'🪵', ladrillo:'🧱', lana:'🐑', trigo:'🌾', mineral:'🔩' };
const RES_NAME = { madera:'Madera', ladrillo:'Ladrillo', lana:'Lana', trigo:'Trigo', mineral:'Metal' };
const TERRAIN_ICON = { bosque:'🌲', pradera:'🐑', campo:'🌾', cerro:'🧱', montana:'⛰️', desierto:'🏜️' };
const COST = { camino:{madera:1,ladrillo:1}, pueblo:{madera:1,ladrillo:1,lana:1,trigo:1}, ciudad:{trigo:2,mineral:3} };
const PLAYER_DEFS = [
  { name:'Tú',    color:'#e0473b', bot:false },
  { name:'Ana',   color:'#3b82f6', bot:true },
  { name:'Beto',  color:'#f2efe4', bot:true },
  { name:'Carla', color:'#f59e0b', bot:true },
  { name:'Diego', color:'#2f9e5a', bot:true },
  { name:'Elena', color:'#9a5ad0', bot:true },
];
// game mode (a mode selector will set this later; for now '#jugadores=6' in the address tries the 5-6 extension)
const GAME_MODE = { players: Math.min(6, Math.max(3, +((location.hash.match(/jugadores=(\d)/) || [])[1] || 4))) };
// bots get a different name every game: some of a lifetime, some from programming and video games
const BOT_POOL = ['Ana','Beto','Carla','Diego','Elena','Fabio','Ada','Linus','Grace','Alan','Guido','Dennis','Margaret','Ken','Bjarne','Hedy','Mario','Link','Samus','Kirby','Zelda','Lara','Pixel','Byte','Kernel','Sprite','Glitch','Debug','Cache','Ruby'];
const VILLAGE_NAMES = ['Villa Pixel','Puerto Kernel','Monte Respawn','Valle Debug','Bahía Byte','El Compilador','Pueblo Sprite','Checkpoint','Llano Lag','Aldea Commit','San Backend','Río Recursivo','Loma Algoritmo','Campo Polígono','Isla Bucle','Rancho Render','Paso Asíncrono','Villa Hitbox','Mina Merge','Torre Shader','Pradera Frame','Nido de Bits','Arroyo Array','Cumbre Caché','Valle Vóxel','La Consola','El Joystick','Monte Speedrun','Las Partidas','Vida Extra','Valle Hondo','Piedra Alta','Los Pinos','Arroyo Seco','San Telmo','Robledal','Cañada Verde','Tres Cruces','Monteluz','La Esperanza','Campo Dorado','Villa Trigal','Peñasco','Los Olivos','Río Claro','Cerro Rojo','Las Lomas','Altamira','El Mirador','Fuente Vieja','Buenavista','Laguna Azul','Santa Brígida','Encinar','Puerto Viento','Rocafría','Hierbabuena','La Colmena','Ojo de Agua','Barranco','Molino Viejo','El Roble','Valdeoro','Cumbres','Salinas','Lucero'];
const S = 1, SQ3 = Math.sqrt(3);
const pips = n => n ? 6 - Math.abs(7 - n) : 0;
const hexDist = (a,b) => (Math.abs(a.q-b.q) + Math.abs(a.r-b.r) + Math.abs((a.q+a.r)-(b.q+b.r))) / 2;

let G = null;
let boardScene = null, villageCtx = null;
let busy = false;   // a transition or scene change is running
let mode = 'board';
let markers = null;
let savedCam = null;

// a fresh name for each bot seat, never two alike in one game
const BOT_USED = [];
function botName(i){ if (i === 1) BOT_USED.length = 0; const n = pick(BOT_POOL.filter(x => !BOT_USED.includes(x))); BOT_USED.push(n); return n; }
function newGameState(nPlayers = GAME_MODE.players, board = null){   // board: the host's tiles and ports, so every online player gets the same map
  const big = nPlayers > 4, coords = [];
  if (!big){ for (let q=-2;q<=2;q++) for (let r=-2;r<=2;r++) if (Math.abs(q+r)<=2) coords.push([q,r]); }
  else for (let r=-3;r<=3;r++) for (let q=Math.max(-3, -3 - r); q<=Math.min(2, 2 - r); q++) coords.push([q, r]);
  const types = board ? board.types.slice() : shuffle(big ? [...Array(6).fill('bosque'),...Array(6).fill('pradera'),...Array(6).fill('campo'),...Array(5).fill('cerro'),...Array(5).fill('montana'),'desierto','desierto']
    : [...Array(4).fill('bosque'),...Array(4).fill('pradera'),...Array(4).fill('campo'),...Array(3).fill('cerro'),...Array(3).fill('montana'),'desierto']);
  let tiles = coords.map(([q,r],i) => ({ i, q, r, type: types[i], x: S*SQ3*(q + r/2), z: S*1.5*r, num: 0, verts: [] }));
  { const mx = tiles.reduce((a, t) => a + t.x, 0)/tiles.length, mz = tiles.reduce((a, t) => a + t.z, 0)/tiles.length; tiles.forEach(t => { t.x -= mx; t.z -= mz; }); }
  const nums = big ? [2,2,3,3,3,4,4,4,5,5,5,6,6,6,8,8,8,9,9,9,10,10,10,11,11,11,12,12] : [2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12];
  if (board) tiles.forEach((t, i) => { t.num = board.nums[i] | 0; });
  else for (let tries=0; tries<800; tries++){
    shuffle(nums); let k=0;
    tiles.forEach(t => { t.num = t.type==='desierto' ? 0 : nums[k++]; });
    const hot = tiles.filter(t => t.num===6 || t.num===8);
    if (hot.every(a => hot.every(b => a===b || hexDist(a,b) > 1))) break;
  }
  const verts = [], edges = [], vmap = new Map(), emap = new Map();
  tiles.forEach(t => {
    const ids = [];
    for (let k=0;k<6;k++){
      const a = (60*k - 30) * Math.PI/180;
      const x = t.x + S*Math.cos(a), z = t.z + S*Math.sin(a);
      const key = Math.round(x*100) + ',' + Math.round(z*100);
      let id = vmap.get(key);
      if (id === undefined){ id = verts.length; vmap.set(key,id); verts.push({ id, x, z, tiles: [], adj: [], edges: [], building: null, name: null, mesh: null }); }
      verts[id].tiles.push(t.i); ids.push(id);
    }
    t.verts = ids;
    for (let k=0;k<6;k++){
      const a = ids[k], b = ids[(k+1)%6];
      const key = Math.min(a,b) + '-' + Math.max(a,b);
      if (!emap.has(key)){
        const id = edges.length; emap.set(key,id);
        edges.push({ id, a, b, road: null, mesh: null });
        verts[a].adj.push(b); verts[b].adj.push(a); verts[a].edges.push(id); verts[b].edges.push(id);
      }
    }
  });
  return {
    id: Math.random(), tiles, verts, edges, ports: board ? portsFrom(board.ports, tiles, verts) : makePorts(tiles, verts, edges),
    players: PLAYER_DEFS.slice(0, nPlayers).map((d, i, all) => ({ ...d, name: i ? botName(i) : d.name, res: { madera:0, ladrillo:0, lana:0, trigo:0, mineral:0 }, roads:0, pueblos:0, ciudades:0, cards: [], knights: 0 })),
    deck: newDeck(), army: -1, longest: -1, playedTurn: -1, merchant: -1, freeRoads: 0,
    current: 0, phase: 'roll', robber: tiles.find(t => t.type==='desierto').i, dice: [0,0], over: false,
    buildMode: null, names: shuffle([...VILLAGE_NAMES]), gossip: [], turnId: 0,
  };
}

