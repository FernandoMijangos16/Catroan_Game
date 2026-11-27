// ================= 3D ICONS (replace every emoji): tiny low-poly models with pixel-noise textures =================
const ICM = new Map();
function icm(color, o = {}){
  const key = color + JSON.stringify(o); if (ICM.has(key)) return ICM.get(key);
  const C = new THREE.Color(color), t = pxTex(8, 8, c => { for (let y=0;y<8;y++) for (let x=0;x<8;x++){ c.fillStyle = '#' + C.clone().multiplyScalar(.78 + hash2(x, y, color & 255)*.36).getHexString(); c.fillRect(x, y, 1, 1); } });
  const m = keepMat(new THREE.MeshStandardMaterial({ map: t, roughness: o.r ?? .75, metalness: o.m ?? 0, flatShading: true, emissive: o.e || 0, emissiveIntensity: o.ei ?? 1 })); ICM.set(key, m); return m;
}
const EMO = { '🔔': 'campana', '🔨': 'martillo', '🪶': 'pluma', '☠': 'calavera', '👁': 'ojo', '👁️': 'ojo', '👀': 'ojo', '🛡️': 'escudo', '🛡': 'escudo', '🛤️': 'camino', '🏆': 'trofeo', '🍀': 'trebol', '🔮': 'orbe', '📜': 'pergamino', '⭐': 'estrella', '✨': 'estrella', '🎁': 'regalo', '🌿': 'hierba', '🧺': 'canasta', '🛒': 'canasta', '🎲': 'dado', '🗺️': 'mapa', '⚓': 'ancla', '☀️': 'sol', '☀': 'sol', '🌅': 'amanecer', '🌇': 'amanecer', '🌤️': 'nube', '🌙': 'luna', '🔥': 'fuego', '🌊': 'ola', '⛰️': 'montana', '🤒': 'frasco', '🌲': 'arbol', '🏜️': 'cactus', '🪚': 'serrucho', '⛏️': 'pico', '🐄': 'vaca', '🎣': 'cana', '🐟': 'pez', '🏠': 'casa', '🚪': 'puerta', '💬': 'globo', '😄': 'cara:risa', '🙂': 'cara:sonrisa', '😊': 'cara:sonrisa', '😂': 'cara:risa', '😆': 'cara:risa', '😌': 'cara:cansado', '😮': 'cara:sorpresa', '🤔': 'cara:duda', '🙌': 'mano', '👍': 'mano', '👋': 'mano', '❗': 'exclama', '❓': 'pregunta', '🎶': 'nota', '🥖': 'pan', '🧀': 'queso', '🍎': 'manzana', '🍺': 'tarro', '🪙': 'moneda', '🏦': 'moneda', '🍖': 'carne', '🧵': 'hilo', '🏺': 'vasija', '💧': 'gota', '🌱': 'brote', '🪑': 'silla', '🌻': 'girasol', '🍲': 'olla', '📣': 'cuerno', '🤝': 'mano', '✔': 'check', '✕': 'cruz', '⏭': 'flecha', '⇄': 'flechas', '🔊': 'cuerno', '🔇': 'cuerno-off', '🪵': 'madera', '🧱': 'ladrillo', '🐑': 'lana', '🌾': 'trigo', '🔩': 'mineral' };
const ic = (k, cls = '') => `<span class="m3 ${cls}" data-k="ic:${k}"></span>`;
function iconModel(k){
  const g = new THREE.Group(), A = (geo, c, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => { const m = mesh(geo, c.isMaterial ? c : icm(c), x, y, z, sx, sy, sz, false); m.rotation.set(rx, ry, rz); g.add(m); return m; };
  const gold = icm(0xd8a23a, { m: .45, r: .45 }), iron = icm(0x6a6660, { m: .4, r: .6 }), wood = icm(0x7a5232), dark = icm(0x3a2a1c);
  if (RES.includes(k)) return makeResourceItem(k);
  if (k.startsWith('cara:')){ const fm = faceMat(0xe0a880, 0x4a3020, { expr: k.slice(5), eye: 0x2b1d14 }), sk = icm(0xe0a880); const hd = new THREE.Mesh(PGEO.rbox, [sk, sk, sk, sk, fm, sk]); hd.scale.set(.6, .7, .6); g.add(hd); A(PGEO.rbox, 0x4a3020, 0, .3, -.03, .64, .2, .64); return g; }
  switch (k){
    case 'campana': return bellModel();
    case 'bomba': A(GEO.sphere, 0x24201e, 0, -.08, 0, .4, .4, .4); A(GEO.cyl, iron, .16, .3, 0, .1, .14, .1, 0, 0, -.5); A(GEO.box, 0xc8a070, .28, .44, 0, .03, .18, .03, 0, 0, -.7); A(GEO.sphere, icm(0xffb040, { e: 0xff6010, ei: 1 }), .36, .54, 0, .06, .06, .06); A(GEO.sphere, 0x4a4440, -.14, .08, .3, .08, .08, .04); break;
    case 'cuchillo': A(GEO.box, icm(0xc8ccd2, { m: .6, r: .3 }), 0, .05, 0, .1, .62, .025); A(GEO.cone4, icm(0xc8ccd2, { m: .6, r: .3 }), 0, .68, 0, .06, .14, .02); A(GEO.box, iron, 0, -.02, 0, .26, .05, .06); A(GEO.box, wood, 0, -.32, 0, .08, .3, .07); break;
    case 'martillo': A(GEO.box, wood, 0, -.5, 0, .1, .9, .1); A(GEO.box, iron, 0, .32, 0, .5, .2, .22); break;
    case 'pluma': { const v = A(GEO.cone4, 0xf2ece0, 0, 0, 0, .18, .9, .04); v.rotation.z = .5; A(GEO.box, 0x8a7a6a, .24, -.44, 0, .02, .5, .02, 0, 0, .5); break; }
    case 'calavera': A(GEO.sphere, 0xe8e2d2, 0, .1, 0, .34, .32, .3); A(GEO.box, 0xe8e2d2, 0, -.18, .02, .3, .16, .24); [-1, 1].forEach(s => A(GEO.sphere, 0x15100c, s*.12, .1, .26, .08, .09, .05)); A(GEO.box, 0x15100c, 0, -.02, .29, .04, .06, .02); break;
    case 'ojo': A(GEO.sphere, 0xf4efe6, 0, 0, 0, .42, .26, .2); A(GEO.sphere, 0x3a7a5a, 0, 0, .15, .16, .16, .08); A(GEO.sphere, 0x0c0806, 0, 0, .2, .08, .08, .05); break;
    case 'escudo': { const sh = A(GEO.cyl14, 0x7a5232, 0, 0, 0, .4, .06, .46, Math.PI/2); A(GEO.box, iron, 0, 0, .05, .08, .82, .04); A(GEO.box, iron, 0, .1, .05, .7, .08, .04); A(GEO.sphere, gold, 0, .1, .08, .07, .07, .05); break; }
    case 'camino': A(GEO.box, 0x8a6a48, 0, 0, 0, .9, .06, .34); for (let i=0;i<4;i++) A(GEO.box, 0xa8a090, -.33 + i*.22, .05, (i % 2 - .5)*.1, .14, .05, .12); A(GEO.box, wood, .38, .06, .2, .05, .84, .05); A(GEO.box, wood, .38, .5, .235, .3, .1, .03); break;
    case 'trofeo': A(GEO.box, dark, 0, -.5, 0, .4, .14, .3); A(GEO.cyl, gold, 0, -.36, 0, .06, .2, .06); { const cup = new THREE.Mesh(sg(new THREE.LatheGeometry([[0, 0], [.14, .02], [.26, .18], [.3, .42], [.28, .5]].map(([x, y]) => new THREE.Vector2(x, y)), 8)), gold); cup.position.y = -.18; g.add(cup); } [-1, 1].forEach(s => A(GEO.box, gold, s*.32, .08, 0, .06, .2, .05)); break;
    case 'trebol': [0, 1, 2, 3].forEach(i => { const a = i*Math.PI/2 + Math.PI/4; A(GEO.sphere, 0x3a9a3a, Math.cos(a)*.17, Math.sin(a)*.17 + .1, 0, .17, .17, .06); }); A(GEO.box, 0x2a6a2a, 0, -.25, 0, .04, .4, .03); break;
    case 'orbe': A(GEO.sphere, icm(0xb07aff, { e: 0x5a2aa8, ei: .8, r: .2 }), 0, .1, 0, .34, .34, .34); A(GEO.cyl14, gold, 0, -.28, 0, .26, .1, .26); break;
    case 'pergamino': A(GEO.box, 0xe8d6ae, 0, -.32, 0, .5, .64, .03); [-1, 1].forEach(s => A(GEO.cyl, 0xc9ae7c, .31, s*.32, 0, .08, .62, .08, 0, 0, Math.PI/2)); for (let i=0;i<4;i++) A(GEO.box, 0x6a4a2a, 0, .15 - i*.1, .02, .32 - (i % 2)*.1, .02, .01); break;
    case 'estrella': { const sh = new THREE.Shape(); for (let i=0;i<10;i++){ const r = i % 2 ? .18 : .45, a = i/10*Math.PI*2 + Math.PI/2; i ? sh.lineTo(Math.cos(a)*r, Math.sin(a)*r) : sh.moveTo(Math.cos(a)*r, Math.sin(a)*r); } const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .12, bevelEnabled: false }), icm(0xf2c23a, { e: 0x6a4a08, ei: .6 })); m.position.z = -.06; g.add(m); break; }
    case 'regalo': A(GEO.sphere, 0x9a7a4a, 0, -.08, 0, .4, .36, .36); A(GEO.cyl, 0x8a6a3a, 0, .25, 0, .12, .14, .12); A(GEO.box, 0xc8302a, 0, .3, 0, .3, .05, .05); break;
    case 'hierba': for (let i=0;i<5;i++){ const l = A(GEO.cone4, 0x4a9a3a, (i - 2)*.1, 0, 0, .08, .6 + (i % 2)*.2, .04); l.rotation.z = (i - 2)*.25; } break;
    case 'canasta': A(GEO.cyl14, 0xb08a4a, 0, -.1, 0, .4, .32, .32); A(GEO.sphere, 0xd9402a, -.12, .12, 0, .1, .1, .1); A(GEO.sphere, 0xe3c46a, .12, .12, .05, .1, .08, .1); { const h = new THREE.Mesh(new THREE.TorusGeometry(.3, .03, 4, 10, Math.PI), icm(0x8a6a3a)); h.position.y = .1; g.add(h); } break;
    case 'dado': return makeDie();
    case 'mapa': { const m = A(GEO.box, 0xd9c49a, 0, 0, 0, .8, .03, .6); A(GEO.box, 0x4a8a4a, -.12, .02, -.05, .3, .02, .22); A(GEO.box, 0x4a7aa8, .25, .02, .12, .2, .02, .18); A(GEO.box, 0xa8402a, .05, .025, .05, .05, .02, .05); g.rotation.x = .5; break; }
    case 'ancla': { const iron = icm(0xb8b4ac, { m: .4, r: .5 }); A(GEO.box, iron, 0, -.42, 0, .08, 1.22, .08); A(GEO.box, iron, 0, .28, 0, .4, .07, .07); { const h = new THREE.Mesh(new THREE.TorusGeometry(.3, .05, 4, 10, Math.PI), iron); h.rotation.z = Math.PI; h.position.y = -.12; g.add(h); const r = new THREE.Mesh(new THREE.TorusGeometry(.08, .03, 4, 8), iron); r.position.y = .46; g.add(r); } break; }
    case 'sol': A(GEO.sphere, icm(0xf2c23a, { e: 0x8a5a08, ei: .8 }), 0, 0, 0, .3, .3, .3); for (let i=0;i<8;i++){ const a = i/8*Math.PI*2; A(GEO.cone4, icm(0xf29a2a, { e: 0x6a3a08, ei: .6 }), Math.cos(a)*.42, Math.sin(a)*.42, 0, .07, .16, .05, 0, 0, a - Math.PI/2); } break;
    case 'amanecer': A(GEO.sphere, icm(0xf28a3a, { e: 0x8a3a08, ei: .7 }), 0, 0, 0, .32, .32, .32); A(GEO.box, 0x4a6a8a, 0, -.2, 0, .9, .3, .2); break;
    case 'nube': A(GEO.sphere, icm(0xf2c23a, { e: 0x8a5a08, ei: .8 }), .15, .15, -.1, .25, .25, .25); [-.2, 0, .2].forEach((x, i) => A(GEO.sphere, 0xe8ecf0, x, -.05 + (i === 1 ? .08 : 0), .05, .2, .17, .17)); break;
    case 'luna': { const m = new THREE.Mesh(new THREE.TorusGeometry(.28, .12, 5, 12, Math.PI*1.25), icm(0xe8e2c0, { e: 0x5a5a3a, ei: .5 })); m.rotation.z = 1.2; g.add(m); break; }
    case 'fuego': A(GEO.cone7, icm(0xd8401a, { e: 0x8a2008, ei: .9 }), 0, -.3, 0, .32, .8, .32); A(GEO.cone7, icm(0xf2c23a, { e: 0x8a6008, ei: .9 }), 0, -.3, .06, .18, .5, .18); break;
    case 'ola': for (let i=0;i<3;i++) A(GEO.sphere, 0x3a7aa8, (i - 1)*.28, -.05 + (i === 1 ? .08 : 0), 0, .2, .14, .2); A(GEO.box, 0x2a5a8a, 0, -.2, 0, .9, .1, .24); break;
    case 'montana': A(GEO.cone4, 0x8a8a90, -.1, -.4, 0, .45, .85, .45); A(GEO.cone4, 0x6a6a70, .25, -.4, .1, .3, .55, .3); A(GEO.cone4, 0xf2f2f2, -.1, .2, 0, .14, .25, .14); break;
    case 'frasco': A(GEO.sphere, icm(0x6aa83a, { e: 0x2a5a0a, ei: .6, r: .3 }), 0, -.1, 0, .3, .32, .3); A(GEO.cyl, 0xd8e8e0, 0, .18, 0, .09, .25, .09); A(GEO.cyl, wood, 0, .42, 0, .1, .08, .1); break;
    case 'arbol': A(GEO.box, wood, 0, -.45, 0, .1, .3, .1); A(GEO.cone7, 0x2a6a3a, 0, -.25, 0, .4, .5, .4); A(GEO.cone7, 0x3a7a3a, 0, .05, 0, .3, .45, .3); break;
    case 'cactus': A(GEO.box, 0x4a8a3a, 0, -.43, 0, .16, .88, .16); A(GEO.box, 0x4a8a3a, .13, -.05, 0, .1, .3, .1); A(GEO.box, 0x4a8a3a, -.13, -.15, 0, .1, .25, .1); A(GEO.box, 0xd9c49a, 0, -.48, 0, .6, .06, .4); break;
    case 'serrucho': A(GEO.box, iron, .1, 0, 0, .7, .2, .02); A(GEO.box, wood, -.35, .02, 0, .2, .26, .06); break;
    case 'pico': A(GEO.box, wood, 0, -.4, 0, .08, .9, .08); { const h = A(GEO.box, iron, 0, .38, 0, .7, .08, .08); h.rotation.z = .1; } break;
    case 'vaca': return makeAnimal('vaca', mulberry32(4)).g;
    case 'cana': A(GEO.box, 0x9a7a4a, 0, 0, 0, .04, 1, .04, 0, 0, -.5); A(GEO.box, 0xd8d8d0, .48, -.38, 0, .01, 1.26, .01); A(GEO.sphere, 0xd8302a, .48, -.42, 0, .05, .05, .05); break;
    case 'pez': A(GEO.sphere, 0x8ab0c8, 0, 0, 0, .4, .2, .1); A(GEO.cone4, 0x6a90a8, -.39, 0, 0, .14, .2, .05, 0, 0, Math.PI/2); A(GEO.sphere, 0x0c0806, .25, .05, .08, .03, .03, .03); break;
    case 'casa': A(GEO.box, 0xe8dcc0, 0, -.4, 0, .6, .45, .5); { const r = A(GEO.cone4, 0xa8503a, 0, .05, 0, .55, .4, .45); r.rotation.y = Math.PI/4; } A(GEO.box, wood, 0, -.4, .26, .14, .24, .02); break;
    case 'puerta': A(GEO.box, wood, 0, -.45, 0, .45, .9, .08); A(GEO.sphere, gold, .14, 0, .06, .04, .04, .04); [-.2, .2].forEach(y => A(GEO.box, iron, 0, y, .05, .45, .05, .02)); break;
    case 'globo': A(GEO.sphere, 0xf4efe6, 0, .08, 0, .45, .32, .12); A(GEO.cone4, 0xf4efe6, -.12, -.17, 0, .1, .2, .06, 0, 0, Math.PI*.85); [-1, 0, 1].forEach(i => A(GEO.sphere, 0x3a2a1c, i*.13, .08, .1, .04, .04, .03)); break;
    case 'mano': return handModel(0x8a6a48, true);
    case 'exclama': return exclaim();
    case 'pregunta': { const t = new THREE.Mesh(new THREE.TorusGeometry(.18, .06, 4, 8, Math.PI*1.4), icm(0xf2c23a, { e: 0x6a4a08, ei: .5 })); t.rotation.z = -.6; t.position.y = .22; g.add(t); A(GEO.box, icm(0xf2c23a), 0, -.15, 0, .09, .2, .09); A(GEO.sphere, icm(0xf2c23a), 0, -.38, 0, .07, .07, .07); break; }
    case 'nota': A(GEO.sphere, 0x2a2420, 0, -.3, 0, .17, .12, .1); A(GEO.box, 0x2a2420, .14, -.25, 0, .04, .7, .04); A(GEO.box, 0x2a2420, .24, .38, 0, .2, .06, .04, 0, 0, -.4); break;
    case 'pan': A(GEO.sphere, 0xd9a050, 0, 0, 0, .5, .18, .2); [-.2, 0, .2].forEach(x => A(GEO.box, 0xa86a2a, x, .15, 0, .04, .02, .16, 0, .6)); break;
    case 'queso': { const m = A(GEO.cyl14, 0xf2cc56, 0, -.1, 0, .4, .3, .4); A(GEO.sphere, 0xd8a83a, .15, .06, .2, .06, .06, .03); break; }
    case 'manzana': A(GEO.sphere, 0xd8302a, 0, 0, 0, .36, .34, .36); A(GEO.box, wood, 0, .3, 0, .04, .2, .04); A(GEO.sphere, 0x4a9a3a, .1, .4, 0, .1, .04, .06); break;
    case 'tarro': A(GEO.cyl14, 0xa87a4a, 0, -.3, 0, .26, .6, .26); A(GEO.cyl14, 0xf4efe0, 0, .28, 0, .27, .1, .27); { const h = new THREE.Mesh(new THREE.TorusGeometry(.15, .04, 4, 8), icm(0xa87a4a)); h.position.set(.3, 0, 0); g.add(h); } break;
    case 'moneda': [0, 1, 2].forEach(i => A(GEO.cyl14, gold, (i % 2)*.05, -.2 + i*.1, 0, .32, .1, .32)); break;
    case 'carne': A(GEO.sphere, 0xa84a3a, 0, 0, 0, .34, .3, .24); A(GEO.cyl, 0xf0e6d2, .32, .2, 0, .05, .3, .05, 0, 0, -.8); break;
    case 'hilo': A(GEO.cyl14, 0x8a2a5a, 0, -.2, 0, .26, .4, .26); [-1, 1].forEach(s => A(GEO.cyl14, wood, 0, s > 0 ? .2 : -.26, 0, .32, .06, .32)); break;
    case 'vasija': return makeSpecialItem('vasija');
    case 'gota': A(GEO.sphere, icm(0x4a8ad8, { r: .2 }), 0, -.1, 0, .3, .3, .3); A(GEO.cone7, icm(0x4a8ad8, { r: .2 }), 0, .1, 0, .2, .4, .2); break;
    case 'brote': A(GEO.box, 0x3a8a3a, 0, -.42, 0, .04, .72, .04); [-1, 1].forEach(s => A(GEO.sphere, 0x4aaa3a, s*.14, .1, 0, .14, .06, .08, 0, 0, s*.4)); A(GEO.cyl14, 0x6a4a2a, 0, -.5, 0, .3, .1, .3); break;
    case 'silla': A(GEO.box, wood, 0, -.1, 0, .5, .06, .5); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => A(GEO.box, wood, x*.2, -.45, z*.2, .05, .7, .05)); A(GEO.box, wood, 0, .2, -.22, .5, .55, .05); break;
    case 'girasol': A(GEO.box, 0x3a8a3a, 0, -.4, 0, .05, .7, .05); for (let i=0;i<8;i++){ const a = i/8*Math.PI*2; A(GEO.sphere, 0xf2c23a, Math.cos(a)*.22, .15 + Math.sin(a)*.22, 0, .1, .1, .04); } A(GEO.sphere, 0x5a3a1a, 0, .15, .03, .14, .14, .05); break;
    case 'olla': A(GEO.sphere, 0x3a3634, 0, -.1, 0, .4, .3, .4); A(GEO.cyl14, 0xd9a050, 0, .14, 0, .32, .04, .32); break;
    case 'engrane': { const W = new THREE.Group(); W.rotation.x = Math.PI/2; g.add(W); const ring = (geo, c, y, sx, sy, sz, ry = 0) => { const m = mesh(geo, c, 0, y, 0, sx, sy, sz, false); m.rotation.y = ry; W.add(m); };
      ring(GEO.cyl, gold, 0, .52, .16, .52); ring(GEO.cyl, dark, 0, .17, .18, .17);   // brass wheel with a dark hub hole
      for (let i=0;i<8;i++){ const a = i*Math.PI/4, m = mesh(GEO.box, gold, Math.cos(a)*.56, 0, Math.sin(a)*.56, .2, .16, .16, false); m.rotation.y = -a; W.add(m); }
      break; }
    case 'cuerno': case 'cuerno-off': { const h = A(GEO.cone7, gold, 0, -.35, 0, .3, .8, .3, 0, 0, Math.PI/2); if (k === 'cuerno-off'){ A(GEO.box, 0xa82a2a, 0, 0, .2, .9, .08, .04, 0, 0, .7); } break; }
    case 'check': A(GEO.box, 0x3a9a3a, -.04, -.3, 0, .12, .38, .1, 0, 0, .7); A(GEO.box, 0x3a9a3a, -.04, -.3, 0, .12, .7, .1, 0, 0, -.6); break;
    case 'cruz': A(GEO.box, 0xa82a2a, 0, -.3, 0, .12, .7, .1, 0, 0, .78); A(GEO.box, 0xa82a2a, 0, -.3, 0, .12, .7, .1, 0, 0, -.78); break;
    case 'flecha': { const fc = icm(0xf2c23a, { e: 0x5a3a08, ei: .5 }); A(GEO.box, fc, -.1, 0, 0, .62, .2, .12); A(GEO.cone4, fc, .2, 0, 0, .3, .38, .12, 0, 0, -Math.PI/2); break; }
    case 'flechas': [-1, 1].forEach(s => { A(GEO.box, 0xe8dcc0, 0, s*.15, 0, .6, .08, .06); A(GEO.cone4, 0xe8dcc0, s*.29, s*.15, 0, .14, .2, .06, 0, 0, -s*Math.PI/2); }); break;
    default: A(GEO.sphere, 0xd8a23a, 0, 0, 0, .3, .3, .3);
  }
  return g;
}
// emoji text → 3D icon spans
const EMO_RE = new RegExp(Object.keys(EMO).sort((a, b) => b.length - a.length).map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
const deEmo = html => String(html).replace(EMO_RE, m => ic(EMO[m]));
