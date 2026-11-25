const NAMES_M = ['Linus','Alan','Guido','Dennis','Ken','Bjarne','Mario','Luigi','Link','Pixel','Byte','Kernel','Glitch','Chuy','Toño','Beto','Pancho','Ramiro','Memo','Nacho','Rigo','Quique','Lalo','Mateo','Julián','Andrés','Rubén','Hugo','Saúl','Tomás','Goyo'];
const NAMES_F = ['Ada','Grace','Margaret','Hedy','Zelda','Samus','Lara','Ruby','Lua','Cache','Rosa','Lupita','Marisol','Juanita','Elena','Sofía','Carmen','Paty','Chela','Tere','Lucía','Valeria','Inés','Rocío','Maru','Pilar','Nati','Cuca'];
const ROLE_LABEL = {
  campesino: ['campesino','campesina'], leñador: ['leñador','leñadora'], minero: ['minero','minera'], pastor: ['pastor','pastora'],
  alfarero: ['ladrillero','ladrillera'], pescador: ['pescador','pescadora'], herrero: ['herrero','herrera'], panadero: ['panadero','panadera'],
  comerciante: ['comerciante','comerciante'], brujo: ['brujo','bruja'], doctor: ['doctor','doctora'], carnicero: ['carnicero','carnicera'], carpintero: ['carpintero','carpintera'], guardia: ['guardia','guardia'], vecino: ['vecino','vecina'], niño: ['niño','niña'], anciano: ['abuelo','abuela'],
};
const LINES = {
  bosque: ['El bosque de aquí da la mejor madera de la isla.','Si vas al bosque, no te salgas del sendero: hay ciervos que se espantan fácil.'],
  pradera: ['Las ovejas andan gordas este año, va a haber buena lana.','En la granja nacieron tres becerros esta semana.'],
  campo: ['Si el clima ayuda, la cosecha de trigo va a estar enorme.','El molino no ha parado en toda la semana.'],
  cerro: ['Del barrero sale la arcilla para los ladrillos de todo el pueblo.','El horno de ladrillos trabaja día y noche.'],
  montana: ['Los mineros bajaron de la cantera con un buen cargamento.','Dicen que en la montaña hay vetas que nadie ha encontrado.'],
  desierto: ['Aquí junto al desierto no crece nada, pero los atardeceres son preciosos.'],
  mar: ['Desde el muelle se ven los barcos que van y vienen.','El mar anda tranquilo hoy, buen día para pescar.'],
  generic: ['¡Buen día, viajero!','Hace falta otro camino para llegar más rápido al resto de la isla.','Ojalá el ladrón no venga por este lado de la isla.','¿Ya viste lo que están construyendo los vecinos?','Aquí todos nos conocemos.'],
};
const ROLE_LINES = {
  campesino: ['Hay que levantarse antes que el sol para trabajar el campo.','Este año la paja salió dorada como nunca.'],
  leñador: ['En el aserradero no paramos: siempre hace falta madera.','Por cada árbol que cortamos, plantamos otro.'],
  minero: ['La cantera nos da piedra y metal para las ciudades.','Allá adentro de la mina no se ve nada sin lámpara.'],
  pastor: ['Mis ovejas conocen mi silbido.','Con esta lana se tejen los mejores sarapes.'],
  alfarero: ['Sacamos el barro del barrero, lo moldeamos y lo cocemos en el horno.','Un buen ladrillo necesita tres días secándose al sol.'],
  pescador: ['Hoy los peces andan mordiendo.','El mar da, pero también se cobra.'],
  herrero: ['Si se te rompe una herramienta, ya sabes dónde encontrarme.'],
  panadero: ['El pan sale a las seis, ¡no llegues tarde!','Con el trigo del campo hago el mejor pan de la isla.'],
  comerciante: ['Compro barato, vendo justo.','Traigo telas de los pueblos del otro lado de la isla.'],
  guardia: ['Todo tranquilo por aquí.','Vigilamos que el ladrón no se acerque al pueblo.'],
  niño: ['¡Juguemos a las escondidas!','¡El perro me sigue a todos lados!','Cuando sea grande voy a construir caminos.'],
  anciano: ['Cuando yo era joven, aquí no había ni un camino.','Esta isla ha cambiado mucho, muchacho.'],
  vecino: ['Hoy hay mercado en la plaza.','¿Ya probaste el pan de la panadería?'],
};
const DRESS = [0x8e44ad, 0xc0392b, 0x2e86c1, 0x16a085, 0xd35400, 0xe67e22, 0x6a2a6a, 0x3f7a45, 0xd9a0b0, 0x5fa8f0];
const PGEO = {
  limb: sg(new THREE.CylinderGeometry(1, .85, 1, 8).translate(0, -.5, 0)),
  joint: sg(new THREE.SphereGeometry(1, 10, 8)),
  head: sg(new THREE.SphereGeometry(1, 14, 10)),
  chest: sg(new THREE.CylinderGeometry(1, .8, 1, 10).translate(0, .5, 0)),
  belly: sg(new THREE.CylinderGeometry(.84, 1, 1, 10).translate(0, .5, 0)),
  skirt: sg(new THREE.CylinderGeometry(.46, 1, 1, 12).translate(0, .5, 0)),
  brim: sg(new THREE.CylinderGeometry(1, 1, 1, 16).translate(0, .5, 0)),
  crown: sg(new THREE.CylinderGeometry(.9, 1, 1, 14).translate(0, .5, 0)),
  rbox: sg((() => { const b = new THREE.BoxGeometry(1, 1, 1, 3, 3, 3), p = b.attributes.position, v = new THREE.Vector3(), n = new THREE.Vector3();
    for (let i=0;i<p.count;i++){ v.fromBufferAttribute(p, i); n.copy(v).normalize().multiplyScalar(.62); v.lerp(n, .42); p.setXYZ(i, v.x, v.y, v.z); }
    b.computeVertexNormals(); return b; })()),
};
const FACE_CACHE = new Map();
function faceMat(skin, hair, o){
  const ex = o.expr || 'sonrisa', key = [skin, hair, o.f, o.kid, o.old, o.beard, o.must, o.eye, ex].join('|');
  if (FACE_CACHE.has(key)) return FACE_CACHE.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = 16; const c = cv.getContext('2d');
  const hex = n => '#' + n.toString(16).padStart(6, '0');
  const sk = new THREE.Color(skin), dk = sk.clone().multiplyScalar(.82), hr = hex(hair);
  const P = (x, y, col, w=1, h=1) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  P(0, 0, hex(skin), 16, 16);
  P(0, 0, hr, 16, 2); [1,4,6,9,11,14].forEach(x => P(x, 2, hr));
  const dkh = '#' + dk.getHexString(), lid = '#' + dk.clone().multiplyScalar(.85).getHexString();
  // brows tell most of the mood
  if (ex === 'enojo' || ex === 'serio'){ P(3, 4, hr); P(4, 5, hr, 2); P(12, 4, hr); P(10, 5, hr, 2); if (ex === 'enojo'){ P(6, 5, hr); P(9, 5, hr); } }
  else if (ex === 'sorpresa' || ex === 'duda'){ P(3, 4, hr, 3); if (ex === 'duda') P(10, 5, hr, 3); else P(10, 4, hr, 3); }
  else if (ex === 'triste'){ P(3, 5, hr); P(4, 4, hr, 2); P(10, 4, hr, 2); P(12, 5, hr); }
  else { P(3, 5, hr, 3); P(10, 5, hr, 3); }
  if (o.f && !o.kid) { P(3, 6, '#2a1d18'); P(12, 6, '#2a1d18'); }
  const eye = (x, closed, half) => { if (closed){ P(x, 7, '#2a1d18', 2, 1); return; } if (half){ P(x, 6, lid, 2, 1); P(x, 7, '#ffffff', 2, 1); P(x === 4 ? 5 : 10, 7, hex(o.eye)); return; } P(x, 6, '#ffffff', 2, 2); P(x === 4 ? 5 : 10, 6, hex(o.eye), 1, 2); };
  eye(4, false, ex === 'cansado' || ex === 'serio'); eye(10, ex === 'guiño', ex === 'cansado' || ex === 'serio');
  if (ex === 'cansado') { P(4, 8, dkh, 2, 1); P(10, 8, dkh, 2, 1); }
  P(7, 8, '#' + dk.getHexString(), 2, 2); P(7, 9, '#' + dk.clone().multiplyScalar(.9).getHexString(), 2, 1);
  if (o.f || o.kid) { P(2, 9, '#e8908a', 2, 1); P(12, 9, '#e8908a', 2, 1); }
  if (o.old) { P(3, 4, '#' + dk.getHexString(), 3); P(10, 4, '#' + dk.getHexString(), 3); P(3, 9, '#' + dk.getHexString()); P(12, 9, '#' + dk.getHexString()); }
  if (o.beard) { P(2, 10, hr, 12, 6); P(3, 9, hr, 1); P(12, 9, hr, 1); P(6, 11, '#' + sk.getHexString(), 4, 1); }
  if (o.must) P(5, 10, hr, 6, 1);
  const lip = '#8a3a32';
  switch (ex){
    case 'risa': P(5, 10, lip, 6, 2); P(6, 10, '#f4efe4', 4, 1); P(6, 12, lip, 4, 1); break;                 // big open laugh, teeth showing
    case 'serio': case 'cansado': P(6, 11, lip, 4, 1); break;
    case 'triste': P(6, 10, lip, 4, 1); P(5, 11, lip); P(10, 11, lip); break;
    case 'enojo': P(5, 11, lip, 6, 1); P(6, 10, lip, 4, 1); break;
    case 'sorpresa': P(7, 10, '#3a1410', 2, 2); P(6, 10, lip); P(9, 11, lip); break;
    case 'duda': P(6, 11, lip, 3, 1); P(9, 10, lip); break;
    case 'guiño': P(6, 11, lip, 4, 1); P(10, 10, lip); break;
    default: P(6, 11, lip, 4, 1); P(5, 10, lip); P(10, 10, lip);
  }
  if (o.beard) P(6, 12, '#' + new THREE.Color(hair).multiplyScalar(.8).getHexString(), 4, 1);
  const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: .85, flatShading: false }); CACHED_MATS.add(m);
  FACE_CACHE.set(key, m); return m;
}
// ---- rustic fabrics: weave, creases and folds baked into a tiny texture; patches with stitches
const FAB = new Map();
function fabricMat(color, kind = 'cloth', v = 0){
  const key = color + kind + v; if (FAB.has(key)) return FAB.get(key);
  const C = new THREE.Color(color);
  const tex = pxTex(16, 16, c => {
    for (let y=0;y<16;y++) for (let x=0;x<16;x++){
      const n = hash2(x, y, 17 + v), weave = kind === 'wool' ? .88 + n*.22 : ((x + y) % 2 ? .93 : 1)*(.95 + n*.08);
      const crease = (x === (3 + v*5) % 16 || x === (11 + v*3) % 16) ? .8 : (x === (4 + v*5) % 16 || x === (12 + v*3) % 16) ? 1.07 : 1, fold = y === (6 + v) % 16 ? .88 : y === (7 + v) % 16 ? 1.05 : 1, wear = hash2(x >> 2, y >> 2, 23 + v) > .85 ? .9 : 1;
      c.fillStyle = '#' + C.clone().multiplyScalar(weave*crease*fold*wear).getHexString(); c.fillRect(x, y, 1, 1);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1.5, 2);
  const m = keepMat(new THREE.MeshStandardMaterial({ map: tex, roughness: .96, flatShading: true })); FAB.set(key, m); return m;
}
function patchMat(color){
  const key = 'patch' + color; if (FAB.has(key)) return FAB.get(key);
  const C = new THREE.Color(color), tex = pxTex(8, 8, c => { for (let y=0;y<8;y++) for (let x=0;x<8;x++){ const edge = x === 0 || y === 0 || x === 7 || y === 7, st = edge && (x + y) % 2 === 0; c.fillStyle = st ? '#e8dcc0' : '#' + C.clone().multiplyScalar(edge ? .7 : .92 + hash2(x, y, 5)*.12).getHexString(); c.fillRect(x, y, 1, 1); } });
  const m = keepMat(new THREE.MeshStandardMaterial({ map: tex, roughness: 1, flatShading: true })); FAB.set(key, m); return m;
}
const RING_G = {};
const RUSTIC = [0xc9b48a, 0xa08a68, 0x7a5a3a, 0x8a3a2a, 0x5a6a3a, 0x4a5a6a, 0xd8c8a8, 0x6a4a5a, 0x9a7a4a, 0xb09070, 0x6a5040, 0x7a6a50];
const VESTS = [0x5a3a22, 0x4a3a2a, 0x3a4a3a, 0x6a2a22, 0x2a3a4a, 0x7a5a32];
function makePerson(rng, role, gender, ownerColor, opt = {}){
  const kid = role === 'niño', old = role === 'anciano' || !!opt.old, f = gender === 'f';
  const S = kid ? .6 + rng()*.1 : old ? .92 + rng()*.05 : (f ? .93 : .99) + rng()*.09;
  const g = new THREE.Group(), body = new THREE.Group(); body.scale.setScalar(S); g.add(body);
  const skin0 = pick(SKIN, rng), skin = opt.skin != null ? opt.skin : skin0;
  const hairC0 = role === 'brujo' ? 0xe8e4dc : old ? pick([0xd8d4cc, 0xbdb8b0, 0xeeeeee], rng) : pick([0x2b1d14, 0x4a3020, 0x111111, 0x8a6a3a, 0xb5651d, 0xd9b26a], rng), hairC = opt.hair != null ? opt.hair : hairC0;
  let shirt = rng() < .65 ? pick(RUSTIC, rng) : pick(CLOTH, rng), pants = pick([0x3b3229, 0x4a4f63, 0x5a4632, 0x2f3b4f, 0x5a4a3a, 0x4a3a2a], rng), apron = null, hat = null, tool = null, longSleeve = rng() < .6;
  let dress = f && rng() < .7;
  switch (role){
    case 'campesino': shirt = pick([0xf0e6d2, 0xd9c7a0, 0xa9c7e0], rng); pants = 0x3d5a8a; hat = 'paja'; tool = pick(['horca','oz'], rng); break;
    case 'leñador': shirt = pick([0xb8322a, 0x9b2f24, 0x2f6b3a], rng); pants = 0x4a3a2a; hat = 'gorro'; tool = 'hacha'; dress = false; longSleeve = true; break;
    case 'minero': shirt = 0x6a6660; pants = 0x3a3632; hat = 'casco'; tool = 'pico'; dress = false; break;
    case 'pastor': shirt = 0x8a6a48; pants = 0x5a4632; hat = rng() < .5 ? 'paja' : null; tool = 'cayado'; longSleeve = true; break;
    case 'alfarero': shirt = 0xd9c7a0; pants = 0x6b4a2f; apron = 0x8a5a3a; tool = 'pala'; hat = rng() < .5 ? 'paliacate' : null; longSleeve = false; break;
    case 'pescador': shirt = 0x3a6a8a; pants = 0x2f3b4f; hat = 'impermeable'; tool = 'cana'; dress = false; break;
    case 'herrero': shirt = 0x4a4540; apron = 0x5a3b26; tool = 'martillo'; dress = false; longSleeve = false; break;
    case 'panadero': shirt = 0xf5f1e8; apron = 0xffffff; hat = 'chef'; break;
    case 'comerciante': shirt = pick([0x6a2a6a, 0x2a5a6a, 0x8a5a1a], rng); hat = 'pluma'; longSleeve = true; break;
    case 'guardia': shirt = 0x6a6e76; pants = 0x3a3632; hat = 'yelmo'; tool = 'lanza'; dress = false; longSleeve = true; break;
    case 'anciano': tool = 'baston'; shirt = pick([0x8a7a6a, 0x6a5a7a, 0x7a6a4a, 0xa08a7a], rng); longSleeve = true; break;
    case 'niño': shirt = pick([0xf1c40f, 0xe74c3c, 0x3498db, 0x2ecc71, 0xe67e22, 0xff8fb0], rng); break;
    case 'brujo': shirt = 0x3a2a5a; pants = 0x2a2030; dress = true; hat = 'brujo'; tool = 'baston'; longSleeve = true; break;
    case 'doctor': shirt = 0xe8e4da; pants = 0x3a3632; apron = 0xf4f2ec; longSleeve = true; dress = false; hat = rng() < .5 ? 'paliacate' : null; break;
    case 'carnicero': shirt = 0xc9b48a; pants = 0x4a3a2a; apron = 0xe8e0d0; longSleeve = false; dress = false; break;
    case 'carpintero': shirt = 0x8a6a48; pants = 0x4a3a2a; apron = 0x7a5a3a; hat = 'paliacate'; tool = 'martillo'; dress = false; longSleeve = rng() < .5; break;
  }
  if (opt.hat !== undefined) hat = opt.hat;
  if (opt.dress !== undefined) dress = opt.dress;
  const dressC = role === 'panadero' ? 0xf5f1e8 : role === 'brujo' ? 0x3a2a5a : pick(DRESS, rng);
  const topC = dress ? dressC : shirt, legC = dress ? (old ? 0x4a3a30 : 0x3a2f28) : pants;
  const add = (par, geo, c, x, y, z, sx, sy, sz) => { const m = mesh(geo, c, x, y, z, sx, sy, sz, true); par.add(m); return m; };
  const fv = Math.floor(rng()*3), legM = fabricMat(legC, 'cloth', fv), topM = fabricMat(topC, dress ? 'linen' : rng() < .3 ? 'wool' : 'cloth', fv), shirtM = fabricMat(shirt, 'cloth', fv), dressM = fabricMat(dressC, 'linen', fv), apronM = apron != null ? fabricMat(apron, 'cloth', 2) : null;
  const dk = (c, k = .72) => new THREE.Color(c).multiplyScalar(k).getHex(), patched = !kid && rng() < .38, patchC = pick(RUSTIC, rng);
  const ring = (par, c, y, r, t = .016) => { const tk = (t/r).toFixed(2), o = new THREE.Mesh(RING_G[tk] || (RING_G[tk] = sg(new THREE.TorusGeometry(1, +tk, 4, 8))), c.isMaterial ? c : mat(c)); o.rotation.x = Math.PI/2; o.position.y = y; o.scale.setScalar(r); o.castShadow = true; par.add(o); return o; };
  // ---- legs: hip -> thigh -> knee -> shin -> foot
  const leg = x => {
    const hip = new THREE.Group(); hip.position.set(x, .92, 0); body.add(hip);
    add(hip, PGEO.limb, legM, 0, .04, 0, .078, .48, .082);
    const knee = new THREE.Group(); knee.position.y = -.44; hip.add(knee);
    add(knee, PGEO.joint, legM, 0, 0, 0, .066, .068, .07);
    add(knee, PGEO.limb, legM, 0, 0, 0, .062, .41, .066);
    if (!dress){ ring(knee, dk(legC, .8), -.32, .068, .014); if (rng() < .5) add(knee, PGEO.joint, legM, 0, -.3, 0, .07, .04, .072); }   // baggy cuff over the boot
    if (patched && !dress && rng() < .6) add(knee, GEO.box, patchMat(patchC), 0, -.06, .056, .07, .08, .012);
    add(knee, PGEO.joint, 0x2a1d14, 0, -.41, 0, .055, .05, .06);
    add(knee, GEO.box, 0x2a1d14, 0, -.48, .045, .11, .085, .24);
    hip.knee = knee; return hip;
  };
  const legL = leg(-.095), legR = leg(.095);
  add(body, PGEO.rbox, legM, 0, .96, 0, f ? .35 : .33, .2, .22);
  // ---- torso
  const chestW = f ? .19 : .22;
  if (dress){ add(body, PGEO.skirt, dressM, 0, .34, 0, .37, .66, .3); add(body, PGEO.belly, dressM, 0, .98, 0, .155, .2, .12); add(body, PGEO.skirt, fabricMat(dk(dressC, .85), 'linen', fv), 0, .3, 0, .38, .12, .31); }
  else add(body, PGEO.belly, shirtM, 0, .97, 0, .16, .22, .12);
  add(body, PGEO.chest, topM, 0, 1.15, 0, chestW, .32, .14);
  // loose layers so clothes hang instead of looking painted on
  if (!dress && rng() < .65) add(body, PGEO.skirt, shirtM, 0, .82, 0, .2, .19, .155);                       // tunic hem over the belt
  if (!dress && !apron && rng() < .32){ const vc = pick(VESTS, rng), vm = fabricMat(vc, 'wool', fv); add(body, PGEO.chest, vm, 0, 1.14, -.004, chestW*1.07, .3, .148); add(body, GEO.box, shirtM, 0, 1.0, .138, .045, .3, .012); }
  if (f && rng() < .35){ const sc2 = pick([0x8a3a2a, 0x5a6a3a, 0xc9b48a, 0x4a5a6a, 0x7a5a3a], rng); add(body, GEO.cone7, fabricMat(sc2, 'wool', 1), 0, 1.2, 0, .27, .3, .2); }      // shawl
  [[-1, .2], [1, -.25]].forEach(([sd, rz]) => { if (rng() < .7){ const cr = add(body, GEO.box, dk(topC, .8), sd*.1, 1.06, .128, .012, .16, .01); cr.rotation.z = rz; } });   // creases
  if (!dress && rng() < .45) add(body, PGEO.rbox, 0x6a4a2a, -.17, .9, .05, .06, .08, .045);            // pouch on the belt
  if (patched && rng() < .5) add(body, GEO.box, patchMat(patchC), .07, 1.1, .14, .07, .07, .012);
  add(body, PGEO.crown, dress ? new THREE.Color(dressC).multiplyScalar(.7).getHex() : 0x3a2a1a, 0, .99, 0, .17, .05, .13);
  if (!dress) add(body, GEO.box, 0xc9a040, 0, .99, .125, .05, .045, .02);
  add(body, PGEO.crown, new THREE.Color(topC).multiplyScalar(.85).getHex(), 0, 1.45, 0, .08, .05, .07);
  if (apron){ add(body, GEO.box, apronM, 0, .62, .13, .3, .6, .03); add(body, GEO.box, apronM, 0, 1.15, .15, .22, .2, .03); add(body, GEO.box, dk(apron, .7), 0, .98, .148, .3, .03, .02); }
  if (role === 'campesino' && !dress) [-1,1].forEach(s => add(body, GEO.box, 0x3d5a8a, s*.09, 1.0, .145, .045, .44, .02));
  if (role === 'guardia'){ add(body, GEO.box, ownerColor, 0, .7, .14, .3, .74, .03); add(body, GEO.box, ownerColor, 0, .7, -.14, .3, .74, .03); [-1,1].forEach(s => add(body, PGEO.joint, 0x9aa0a8, s*.2, 1.43, 0, .09, .06, .09)); }
  if (role === 'comerciante') add(body, GEO.box, 0x2b2522, 0, 1.0, .135, .28, .42, .02);
  if (!apron && !dress && rng() < .5) [1.08, 1.2, 1.32].forEach(y => add(body, PGEO.joint, 0xe8e0cc, 0, y, .14 - (y - 1.08)*.12, .012, .012, .01));
  // ---- arms: shoulder -> upper arm -> elbow -> forearm -> hand
  const arm = x => {
    const sh = new THREE.Group(); sh.position.set(x, 1.42, 0); body.add(sh);
    add(sh, PGEO.joint, topM, 0, 0, 0, .074, .074, .074);
    add(sh, PGEO.limb, topM, 0, .01, 0, .055, .3, .058);
    const el = new THREE.Group(); el.position.y = -.29; sh.add(el);
    add(el, PGEO.joint, longSleeve ? topM : skin, 0, 0, 0, longSleeve ? .052 : .047, longSleeve ? .05 : .047, longSleeve ? .052 : .047);
    add(el, PGEO.limb, longSleeve ? topM : skin, 0, 0, 0, longSleeve ? .048 : .045, longSleeve ? .2 : .25, longSleeve ? .05 : .047);
    if (longSleeve){ add(el, PGEO.limb, skin, 0, -.19, 0, .04, .07, .042); ring(el, dk(topC, .78), -.18, .05, .014); }
    else ring(sh, dk(topC, .8), -.26, .062, .016);       // rolled sleeve
    if (patched && rng() < .4) add(el, GEO.box, patchMat(patchC), 0, -.02, -.05, .055, .06, .01);
    add(el, PGEO.rbox, skin, 0, -.31, .005, .055, .1, .045);
    sh.elbow = el; return sh;
  };
  const armX = f ? .2 : .225;
  const armL = arm(-armX), armR = arm(armX);
  // ---- neck & head
  const head = new THREE.Group(); head.position.set(0, 1.45, 0); body.add(head);
  if (kid) head.scale.setScalar(1.18);
  add(head, PGEO.crown, skin, 0, 0, 0, .05, .14, .05);
  const bR = rng(), mR = rng(), beard = opt.beard !== undefined ? opt.beard : (role === 'brujo' && !f) || (!f && !kid && bR < .3), must = opt.must !== undefined ? opt.must : !f && !kid && !beard && mR < .3;
  const MOODS = ['sonrisa', 'sonrisa', 'serio', 'serio', 'risa', 'cansado', 'duda', 'triste', 'sorpresa', 'guiño', 'enojo'];
  const eyeC = pick([0x2b1d14, 0x3a5a8a, 0x3f6a3a, 0x5a3a20], rng), expr = opt.expr || (role === 'brujo' ? 'serio' : role === 'guardia' ? pick(['serio', 'enojo', 'cansado'], rng) : pick(MOODS, rng));
  const fm = faceMat(skin, hairC, { f, kid, old, beard, must, eye: eyeC, expr });
  const sm = mat(skin);
  const hd = new THREE.Mesh(PGEO.rbox, [sm, sm, sm, sm, fm, sm]); hd.position.set(0, .26, 0); hd.scale.set(.24, .29, .25); hd.castShadow = true; head.add(hd);
  [-1,1].forEach(s => add(head, PGEO.joint, skin, s*.125, .25, -.01, .025, .045, .03));
  const T = .405;
  const capM = mat(hairC);
  if (!hat || f){ const cap = add(head, PGEO.rbox, hairC, 0, T - .025, -.012, f ? .262 : .258, .12, .268); }
  if (f){
    const style = old ? 'chongo' : pick(['largo','trenzas','chongo','coleta','corto'], rng);
    if (style === 'largo') add(head, PGEO.rbox, hairC, 0, .18, -.08, .26, .3, .12);
    else if (style === 'trenzas') [-1,1].forEach(s => { add(head, PGEO.limb, hairC, s*.12, .22, -.05, .035, .3, .035); add(head, PGEO.joint, 0xc0392b, s*.12, -.09, -.05, .035, .03, .035); });
    else if (style === 'chongo') add(head, PGEO.joint, hairC, 0, T - .02, -.13, .085, .085, .085);
    else if (style === 'coleta') { add(head, PGEO.joint, hairC, 0, .3, -.14, .05, .05, .05); add(head, PGEO.limb, hairC, 0, .29, -.16, .04, .26, .04); }
    else add(head, PGEO.rbox, hairC, 0, .24, -.07, .26, .16, .14);
    if (!hat && rng() < .35) add(head, PGEO.joint, pick([0xe85d75, 0xf7d046, 0x5fa8f0], rng), .11, T - .02, .04, .035, .035, .035);
  }
  const H = (geo, c, y, r, h) => add(head, geo, c, 0, y, 0, r, h, r);
  switch (hat){
    case 'paja': H(PGEO.brim, 0xe3c77a, T - .08, .36, .025); H(PGEO.crown, 0xd9b864, T - .08, .145, .15); H(PGEO.brim, 0x8a3a2a, T - .05, .148, .03); break;
    case 'gorro': add(head, PGEO.rbox, pick([0xb8322a, 0x2f6b3a, 0x3a4a6a], rng), 0, T - .01, -.012, .27, .15, .28); H(PGEO.brim, 0xd9d2c4, T - .12, .145, .05); break;
    case 'casco': add(head, PGEO.head, 0xd9a520, 0, T - .03, -.005, .15, .11, .16); H(PGEO.brim, 0xc99515, T - .1, .18, .025); add(head, GEO.box, mat(0xfff2b0, { emissive: 0xffd060, emissiveIntensity: 1 }), 0, T - .02, .15, .06, .05, .04); break;
    case 'impermeable': add(head, PGEO.head, 0xf2c230, 0, T - .03, -.005, .148, .1, .158); { const b = H(PGEO.brim, 0xf2c230, T - .09, .25, .025); b.rotation.x = -.12; } break;
    case 'chef': H(PGEO.crown, 0xffffff, T - .07, .14, .2); add(head, PGEO.head, 0xffffff, 0, T + .15, 0, .17, .09, .17); break;
    case 'pluma': H(PGEO.brim, 0x2b2522, T - .06, .24, .025); H(PGEO.crown, 0x2b2522, T - .06, .14, .13); { const fe = add(head, GEO.box, pick([0xe85d75, 0x5fa8f0, 0xf7d046], rng), .12, T, -.03, .03, .24, .06); fe.rotation.z = -.55; } break;
    case 'yelmo': add(head, PGEO.head, 0x9aa0a8, 0, T - .04, -.005, .15, .13, .158); add(head, GEO.cone7, 0x9aa0a8, 0, T + .05, 0, .05, .1, .05); add(head, GEO.box, 0x9aa0a8, 0, .16, .13, .03, .15, .03); H(PGEO.brim, 0x8a9098, T - .17, .158, .03); break;
    case 'brujo': { H(PGEO.brim, 0x2a1e3a, T - .07, .32, .025); const c1 = add(head, GEO.cone7, 0x2a1e3a, .02, T - .07, -.01, .17, .5, .17); c1.rotation.z = -.18; add(head, GEO.box, 0xc89a40, 0, T - .03, .16, .06, .05, .01); break; }
    case 'paliacate': add(head, PGEO.rbox, 0xc0392b, 0, T - .02, -.012, .262, .12, .272); add(head, PGEO.joint, 0xc0392b, 0, T - .07, -.15, .045, .04, .04); break;
  }
  // ---- tools held in the right hand
  if (tool){
    const tg = new THREE.Group(); tg.position.set(0, -.32, .02); armR.elbow.add(tg);
    const Hd = (len, c=0x7a5232) => { const m = mesh(PGEO.brim, c, 0, 0, 0, .022, len, .022, true); m.rotation.x = Math.PI/2; m.position.z = -.12; tg.add(m); return m; };
    switch (tool){
      case 'hacha': Hd(.8); tg.add(mesh(GEO.box, 0x9aa0a8, 0, -.1, .56, .035, .22, .17, true)); break;
      case 'pico': Hd(.8); tg.add(mesh(GEO.box, 0x8a9098, 0, -.26, .6, .045, .52, .045, true)); break;
      case 'horca': Hd(1.4); [-.07, 0, .07].forEach(o => tg.add(mesh(GEO.box, 0x9aa0a8, o, -.01, 1.24, .018, .018, .26, true))); tg.add(mesh(GEO.box, 0x9aa0a8, 0, -.01, 1.24, .17, .02, .02, true)); break;
      case 'oz': Hd(1.2); { const m = mesh(GEO.box, 0xb8bec6, .2, -.01, 1.03, .42, .02, .06, true); m.rotation.y = .4; tg.add(m); } break;
      case 'pala': Hd(1.1); tg.add(mesh(GEO.box, 0x8a9098, 0, -.11, .96, .21, .26, .02, true)); break;
      case 'martillo': Hd(.48); tg.add(mesh(GEO.box, 0x5a5a5a, 0, -.05, .32, .09, .1, .16, true)); break;
      case 'cana': Hd(2.2, 0x9a7a4a); break;
      case 'lanza': tg.add(mesh(PGEO.brim, 0x6b4a2f, 0, -.5, 0, .022, 2.2, .022, true)); tg.add(mesh(GEO.cone4, 0xb8bec6, 0, 1.7, 0, .05, .22, .05, true)); break;
      case 'baston': case 'cayado': tg.add(mesh(PGEO.brim, 0x6b4a2f, 0, -.62, .05, .022, 1.24, .022, true)); if (role === 'brujo') tg.add(mesh(GEO.sphere, keepMat(new THREE.MeshStandardMaterial({ color: 0xb07aff, emissive: 0x7a3ac8, emissiveIntensity: 1, flatShading: true })), 0, .66, .05, .06, .08, .06, false)); if (tool === 'cayado') tg.add(mesh(GEO.box, 0x6b4a2f, 0, .62, .12, .035, .035, .18, true)); break;
    }
  }
  if (old) body.rotation.x = .1;
  const names = f ? NAMES_F : NAMES_M;
  let name = pick(names, rng);
  if (old) name = (f ? 'Doña ' : 'Don ') + name; else if (!kid && rng() < .25) name = (f ? 'Doña ' : 'Don ') + name;
  return { g, body, head, legL, legR, armL, armR, kneeL: legL.knee, kneeR: legR.knee, elbowL: armL.elbow, elbowR: armR.elbow, ph: rng()*6, role, gender, name, label: ROLE_LABEL[role][f ? 1 : 0], kid, old, tool, S, spd: 0 };
}
