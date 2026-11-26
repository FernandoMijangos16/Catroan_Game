// ================= FLOWERS AND BIOME OBJECTS =================
const SPECIAL = {
  // drop: how many come at once (the commoner the item, the bigger the handful)
  margarita: { name: 'Margarita', kind: 'flor', common: true, val: 1, drop: [1, 3] },
  amapola:   { name: 'Amapola', kind: 'flor', common: true, val: 1, drop: [1, 3] },
  lirio:     { name: 'Lirio del bosque', kind: 'flor', biome: 'bosque', val: 2, drop: [1, 2] },
  edelweiss: { name: 'Edelweiss', kind: 'flor', biome: 'montana', val: 2, drop: [1, 2] },
  cactusflor:{ name: 'Flor de cactus', kind: 'flor', biome: 'desierto', val: 2, drop: [1, 2] },
  hongo:     { name: 'Champiñón', kind: 'objeto', biome: 'bosque', val: 2, drop: [1, 3] },
  cristal:   { name: 'Cristal', kind: 'objeto', biome: 'montana', val: 3, drop: [1, 1] },
  vasija:    { name: 'Vasija de barro', kind: 'objeto', biome: 'cerro', val: 2, drop: [1, 2] },
  miel:      { name: 'Tarro de miel', kind: 'objeto', biome: 'pradera', val: 2, drop: [1, 2] },
  semillas:  { name: 'Saco de semillas', kind: 'objeto', biome: 'campo', val: 2, drop: [1, 3] },
  ambar:     { name: 'Ámbar', kind: 'objeto', biome: 'desierto', val: 3, drop: [1, 1] },
};
const SPK = Object.keys(SPECIAL);
const SPEC_IMG = {};
const specImg = (k, cls = 'ri') => SPEC_IMG[k] ? `<img class="${cls}" data-k="${k}" src="${SPEC_IMG[k]}" alt="${SPECIAL[k].name}">` : `<span class="m3" data-k="${k}"></span>${SPECIAL[k].name}`;
function makeSpecialItem(k){
  const g = new THREE.Group(), A = itemAssets();
  const add = (geo, m, x, y, z, sx, sy, sz, rx=0, ry=0, rz=0) => { const o = new THREE.Mesh(geo, m.isMaterial ? m : mat(m, { tex: false })); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx, ry, rz); o.castShadow = true; g.add(o); return o; };
  const stem = (h, bend = 0) => { add(GEO.cyl, 0x3f7a35, 0, 0, 0, .014, h, .014, 0, 0, bend); [[.35, .7], [.55, -.8]].forEach(([y, r]) => add(A.g.leaf, 0x4f8a3a, Math.cos(r)*.05, h*y, Math.sin(r)*.03, .08, .016, .03, 0, r, .4*Math.sign(r))); };
  const petals = (n, y, len, w, col, tilt = .25, cup = 0) => { for (let i=0;i<n;i++){ const a = i/n*Math.PI*2; const o = add(PGEO.joint, col, Math.cos(a)*len*.55, y + cup, Math.sin(a)*len*.55, len*.55, .022, w); o.rotation.set(0, -a, .45, 'YXZ'); } };
  switch (k){
    case 'margarita': stem(.34); petals(12, .34, .13, .022, 0xf6f2ea, .15); add(GEO.sphere, 0xe8b830, 0, .345, 0, .035, .022, .035); break;
    case 'amapola': stem(.32, .08); for (let i=0;i<5;i++){ const a = i/5*Math.PI*2; add(PGEO.joint, i % 2 ? 0xd8322a : 0xc0261e, Math.cos(a)*.05, .35, Math.sin(a)*.05, .075, .05, .06, 0, -a, -.9); } add(GEO.sphere, 0x1a1410, 0, .35, 0, .03, .03, .03); break;
    case 'lirio': { add(GEO.cyl, 0x3f7a35, 0, 0, 0, .014, .36, .014); add(A.g.leaf, 0x4f8a3a, .04, .1, 0, .12, .02, .03, 0, 0, .9);
      const bell = sg(new THREE.LatheGeometry([[0, .07], [.025, .065], [.04, .03], [.05, 0], [.058, -.012]].map(([x, y]) => new THREE.Vector2(x, y)), 7));
      for (let i=0;i<4;i++){ const y = .34 - i*.075, x = .04 + i*.015; add(GEO.cyl, 0x3f7a35, x*.5, y, 0, .006, .04, .006, 0, 0, -1); const b = new THREE.Mesh(bell, mat(0x6a5ad8, { tex: false })); b.position.set(x + .03, y - .07, 0); b.rotation.z = .3; g.add(b); } break; }
    case 'edelweiss': stem(.26); for (let i=0;i<8;i++){ const a = i/8*Math.PI*2; add(GEO.cone4, 0xe8eae2, Math.cos(a)*.06, .27, Math.sin(a)*.06, .03, .1, .012, Math.PI/2, -a + Math.PI/2, 0); } for (let i=0;i<5;i++) add(GEO.sphere, 0xe2d690, (i % 3 - 1)*.015, .28, (i % 2 - .5)*.02, .016, .016, .016); break;
    case 'cactusflor': add(PGEO.joint, 0x4f8a4a, 0, .12, 0, .1, .13, .07); add(PGEO.joint, 0x5a9a50, .1, .2, 0, .05, .07, .04, 0, 0, -.5);
      for (let i=0;i<10;i++) add(GEO.box, 0xf0ead8, Math.cos(i)*.08, .06 + (i % 4)*.05, .06*Math.sign(Math.sin(i*2)), .004, .02, .004, i, 0, 0);
      for (let i=0;i<7;i++){ const a = i/7*Math.PI*2; add(PGEO.joint, 0xf06aa8, Math.cos(a)*.04, .26, Math.sin(a)*.04, .045, .02, .025, 0, -a, -.5); } add(GEO.sphere, 0xf0d040, 0, .27, 0, .02, .02, .02); break;
    case 'hongo': [[0, 0, 1], [.12, .02, .65]].forEach(([x, z, s]) => { add(GEO.cyl, 0xf0e6d2, x, 0, z, .04*s, .16*s, .04*s); add(sg(new THREE.SphereGeometry(1, 9, 5, 0, Math.PI*2, 0, Math.PI/2)), 0xc8322a, x, .15*s, z, .12*s, .09*s, .12*s); for (let i=0;i<5;i++){ const a = i*1.3; add(GEO.sphere, 0xf6f2ea, x + Math.cos(a)*.07*s, .15*s + .06*s, z + Math.sin(a)*.07*s, .017*s, .01*s, .017*s); } }); break;
    case 'cristal': add(GEO.rocks[1], 0x6f747c, 0, .06, 0, .16, .1, .14); { const cr = mat(0x7fe0ff, { emissive: 0x2a8ab0, emissiveIntensity: .5, tex: false, roughness: .25 }); [[0, .1, 0, .05, .3, 0, 0], [.07, .08, .04, .035, .2, .5, .4], [-.07, .08, -.02, .035, .22, -.5, .2], [.02, .08, -.07, .03, .17, -.3, -.6]].forEach(([x, y, z, r, h, rx, rz]) => add(GEO.cone6, cr, x, y, z, r, h, r, rx, 0, rz)); } break;
    case 'vasija': { const p = sg(new THREE.LatheGeometry([[.0, 0], [.07, 0], [.11, .06], [.12, .13], [.09, .2], [.05, .23], [.06, .26], [.065, .27]].map(([x, y]) => new THREE.Vector2(x, y)), 10)); const o = new THREE.Mesh(p, mat(0xb8643a, { tex: false })); o.material.side = THREE.DoubleSide; g.add(o); add(GEO.cyl, 0x8a3a22, 0, .11, 0, .118, .02, .118); for (let i=0;i<6;i++) add(GEO.box, 0xe8d0a0, Math.cos(i)*.115, .16, Math.sin(i)*.115, .012, .03, .012, 0, -i, 0); break; }
    case 'miel': add(GEO.cyl14, mat(0xe8a020, { emissive: 0x6a3a00, emissiveIntensity: .3, tex: false, roughness: .2 }), 0, 0, 0, .09, .16, .09); add(GEO.cyl14, 0xf0e6d0, 0, .16, 0, .1, .025, .1); add(GEO.cyl14, 0xd8c8a8, 0, .18, 0, .11, .02, .11); add(GEO.box, 0xa0632e, 0, .165, 0, .225, .012, .012); add(PGEO.joint, 0xf0b030, .06, .14, .06, .02, .05, .02); break;
    case 'semillas': add(PGEO.joint, 0xb89a68, 0, .1, 0, .12, .12, .11); add(GEO.cone7, 0xa88a58, 0, .17, 0, .07, .1, .07); add(GEO.cyl, 0x8a5a2a, 0, .19, 0, .05, .015, .05); for (let i=0;i<6;i++) add(GEO.sphere, 0xe0c060, Math.cos(i*1.1)*.035, .27 + (i % 2)*.01, Math.sin(i*1.1)*.035, .012, .016, .012); break;
    case 'ambar': add(sg(jitterGeo(new THREE.IcosahedronGeometry(1, 0), .25, 4)), keepMat(new THREE.MeshStandardMaterial({ color: 0xf0a020, emissive: 0x8a4000, emissiveIntensity: .45, roughness: .15, transparent: true, opacity: .85, flatShading: true })), 0, .1, 0, .12, .09, .1); add(PGEO.joint, 0x2a1a0c, 0, .1, 0, .03, .015, .02); break;
  }
  return outlineItem(g);
}
function renderSpecialIcons(){
  let r2; try { r2 = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); } catch { return; }
  r2.setSize(80, 80); r2.setPixelRatio(1); r2.outputColorSpace = THREE.SRGBColorSpace;
  const sc = new THREE.Scene(); sc.add(new THREE.HemisphereLight(0xfff4e0, 0x5a4a3a, 2.2)); const dl = new THREE.DirectionalLight(0xfff0d8, 2.6); dl.position.set(2, 3, 2.5); sc.add(dl);
  const cam = new THREE.PerspectiveCamera(30, 1, .02, 20);
  SPK.forEach(k => { const it = makeSpecialItem(k); it.rotation.set(0, .4, .15); sc.add(it); const b = new THREE.Box3().setFromObject(it), c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3()).length(); cam.position.set(c.x + sz*.6, c.y + sz*.5, c.z + sz*1.2); cam.lookAt(c); r2.render(sc, cam); SPEC_IMG[k] = r2.domElement.toDataURL(); sc.remove(it); });
  r2.dispose(); r2.forceContextLoss?.();
}
let SPECW = null;
function useRoadToken(){
  const P = G.players[0];
  if (!(P.roadTokens > 0)) return;
  if (G.current !== 0 || G.phase !== 'main'){ notify('Puedes usar tu camino de regalo durante tu turno, después de tirar los dados.', P.color, 'sys'); return; }
  if (P.roads >= 15 || !validRoads(0).length){ notify('No hay dónde construir un camino ahora.', P.color, 'sys'); return; }
  G.freeRoads = 1; G.tokenRoad = false; SFX.click?.(); enterBuild('camino'); G.tokenRoad = true; refresh();
}
function initSpecialWin(){
  SPECW = floatWin({ id: 'specials', label: 'Objetos y flores', store: 'specials3', S: 46, keys: [...SPK, 'caminoP'], side: 'l', x: 4, y: 420, title: k => AMULETS[k] ? `Amuleto · ${AMULETS[k].name}: ${AMULETS[k].desc}${AMULETS[k].tgt === 'passive' ? '' : ' · toca para usarlo'}` : k === 'caminoP' ? 'Camino de regalo · toca para construirlo gratis (no se puede intercambiar)' : SPECIAL[k].name + (SPECIAL[k].biome ? ' · ' + TERRAIN[SPECIAL[k].biome].label : ' · común'), name: k => AMULETS[k] ? AMULETS[k].name.split(' ')[0] : k === 'caminoP' ? 'Camino' : SPECIAL[k].name.split(' ')[0], count: k => !G ? 0 : AMULETS[k] ? amCount(0, k) : k === 'caminoP' ? G.players[0].roadTokens || 0 : (G.players[0].special || {})[k] || 0, model: k => AMULETS[k] ? amuletModel(k) : k === 'caminoP' ? pieceModel('camino') : makeSpecialItem(k), onSlot: k => { if (k === 'caminoP') useRoadToken(); else if (AMULETS[k]) useAmulet(k); } });
  SPECW.models();
  const upd = SPECW.update; SPECW.update = () => { const was = SPECW.el.style.display; upd(); let any = false; SPECW.keys.forEach(k => { const n = SPECW.o.count(k); SPECW.slots[k].style.display = n ? '' : 'none'; if (n) any = true; }); SPECW.el.style.display = any ? '' : 'none'; if (was !== SPECW.el.style.display) setTimeout(() => dockWins(SPECW), 0); };
  SPECW.update();
}
function giveSpecial(p, k, n = 1, from){
  const P = G.players[p]; P.special = P.special || {}; P.special[k] = (P.special[k] || 0) + n;
  if (p === 0){ updateInventory(); setTimeout(() => { const s = SPECW && SPECW.slots[k]; if (s){ s.classList.remove('pulse'); void s.offsetWidth; s.classList.add('pulse'); SPECW.spin[k] = 1; } }, 50); }
}
const dropQty = k => { const [a, b] = SPECIAL[k].drop || [1, 1]; return a + Math.floor(Math.random()*(b - a + 1)); };
const foundStr = (k, n) => `${n > 1 ? n + ' ' : ''}${specImg(k)} <b>${SPECIAL[k].name}</b>`;
const gameRound = () => G ? Math.floor(Math.max(0, G.turnId - 1)/G.players.length) + 1 : 0;
function bioTick(p, biome, num){
  if (isClassic()) return;
  const P = G.players[p]; P.numCount = P.numCount || {}; P.numCount[num] = (P.numCount[num] || 0) + 1;
  if (gameRound() < 2 || P.numCount[num] <= 2 || P.bioRoll === G.turnId || Math.random() >= .45) return;
  P.bioRoll = G.turnId;
  // the land's object, or now and then one of its flowers (the herbs the missions ask for)
  const obj = SPK.find(k => SPECIAL[k].kind === 'objeto' && SPECIAL[k].biome === biome), flor = SPK.find(k => SPECIAL[k].kind === 'flor' && SPECIAL[k].biome === biome);
  const k = Math.random() < .35 ? (flor || pick(['margarita', 'amapola'])) : obj; if (!k) return; const n = dropQty(k);
  setTimeout(() => { giveSpecial(p, k, n); notify(`${p === 0 ? 'Encontraste' : P.name + ' encontró'} ${foundStr(k, n)} en ${TERRAIN[biome].label.toLowerCase()}`, P.color); }, 2600);
}
function roadFind(p, eid){
  if (G.setup || isClassic()) return;
  const e = G.edges[eid], tiles = G.verts[e.a].tiles.filter(t => G.verts[e.b].tiles.includes(t)).map(t => G.tiles[t]);
  if (!tiles.length) return; const t = pick(tiles), P = G.players[p];
  if (Math.random() < .5){
    const uniq = SPK.find(k => SPECIAL[k].kind === 'flor' && SPECIAL[k].biome === t.type);
    const k = uniq && Math.random() < .5 ? uniq : pick(['margarita', 'amapola']), n = dropQty(k);
    giveSpecial(p, k, n); notify(`${p === 0 ? 'Encontraste' : P.name + ' encontró'} ${foundStr(k, n)} junto al camino`, P.color);
  }
}
