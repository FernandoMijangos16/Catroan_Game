// ================= ULISES, THE TRAVELLER: the tutorial's guide =================
// A villager model (people.js) who has walked the whole board: wide leather hat, grey beard, staff, and a big pack on
// his back with a bedroll, a rolled map, a pot and a lantern. Fixed seed, so he always looks the same.
const TRAVELER = { name: 'Ulises', s: 4242, o: { hat: 'viajero', beard: true, must: false, expr: 'sonrisa', skin: 0xc8946a, hair: 0x9a9088, shirt: 0x5a7a96, pants: 0x4e4234 } };
function travelerModel(){
  const p = makePerson(mulberry32(TRAVELER.s), 'pastor', 'm', null, TRAVELER.o);
  const b = p.body, A = (geo, c, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0) => { const m = mesh(geo, c, x, y, z, sx, sy, sz, true); m.rotation.set(rx, ry, rz); b.add(m); return m; };
  // the pack: canvas body, a darker flap, side pockets, shoulder straps over the chest
  A(PGEO.rbox, 0x6e5434, 0, 1.06, -.25, .36, .48, .22);
  A(PGEO.rbox, 0x54402a, 0, 1.25, -.22, .38, .14, .25);
  [-1, 1].forEach(s => A(PGEO.rbox, 0x5e472c, s*.2, .96, -.25, .07, .2, .16));
  [-1, 1].forEach(s => { A(GEO.box, 0x3e2c1c, s*.1, 1.2, .135, .05, .36, .02); A(GEO.box, 0x3e2c1c, s*.1, 1.4, -.03, .05, .04, .3); });
  A(GEO.box, 0xc8a040, 0, 1.2, -.36, .06, .05, .02);                                   // brass buckle
  // bedroll on top, tied with two cords
  A(GEO.cyl, 0x8a3a2a, 0, 1.4, -.24, .1, .4, .1, 0, 0, Math.PI/2);
  [-.11, .11].forEach(x => A(GEO.cyl, 0x2b2018, x, 1.4, -.24, .107, .025, .107, 0, 0, Math.PI/2));
  // the rolled map sticking out on one side, the pot and the lantern hanging on the other
  A(GEO.cyl, 0xe8d8b0, -.22, 1.24, -.32, .035, .34, .035, .25);
  A(GEO.cyl, 0xb04a3a, -.22, 1.4, -.28, .038, .02, .038, .25);
  A(GEO.cyl, 0x4a4640, .25, .86, -.24, .075, .09, .075);
  A(GEO.box, 0x2b2522, .25, .93, -.24, .008, .06, .1);
  A(GEO.box, 0x3a3632, .24, 1.06, -.36, .07, .1, .07);
  A(GEO.box, mat(0xffd27a, { emissive: 0xffb040, emissiveIntensity: .8 }), .24, 1.06, -.36, .05, .07, .075);
  return p;
}
