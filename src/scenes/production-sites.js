// ================= PRODUCTION SITES =================
const SITE_INFO = {
  bosque: { name: 'Aserradero', icon: '🪚', rad: 11, role: 'leñador' },
  montana: { name: 'Cantera', icon: '⛏️', rad: 13, role: 'minero' },
  pradera: { name: 'Granja', icon: '🐄', rad: 12, role: 'pastor' },
  campo: { name: 'Trigales', icon: '🌾', rad: 12, role: 'campesino' },
  cerro: { name: 'Barrero y ladrillera', icon: '🧱', rad: 12, role: 'alfarero' },
  mar: { name: 'Muelle de pesca', icon: '🎣', rad: 8, role: 'pescador' },
};
// clay pit mound height (local radius from pit center)
function clayMoundH(rho){
  if (rho > 7.6) return 0;
  if (rho > 6.6) return (7.6 - rho)*1.5;
  if (rho > 5.2) return 1.5;
  if (rho > 3.8) return 1;
  if (rho > 2.4) return .5;
  return .06;
}
// builds a site group at (cx, cz) facing the village; returns { workSpots }
function buildSite(sc, type, cx, cz, face, rng, anims, S, ownerColor){
  const g = new THREE.Group(); g.position.set(cx, 0, cz); g.rotation.y = face; sc.add(g);
  const W = (lx, lz) => toWorld(cx, cz, face, lx, lz);
  const coll = (lx, lz, r) => { const [x, z] = W(lx, lz); addColl(x, z, r); };
  const A = (geo, c, x, y, z, sx, sy, sz, sh=true) => { const m = mesh(geo, c, x, y, z, sx, sy, sz, sh); g.add(m); return m; };
  const spots = [];
  const ground = (w, d, c, lx=0, lz=0) => { const m = A(GEO.box, c, lx, 0, lz, w, .06, d, false); m.receiveShadow = true; return m; };
  const logPile = (lx, lz, rot) => {
    const pg = new THREE.Group(); pg.position.set(lx, 0, lz); pg.rotation.y = rot; g.add(pg);
    for (let r=0;r<3;r++) for (let i=0;i<3-r;i++){ const l = new THREE.Mesh(GEO.cyl, mat(0x6b4a2f)); l.scale.set(.36, 4, .36); l.rotation.z = Math.PI/2; l.position.set(2, .36 + r*.64, -.74 + i*.74 + r*.37); l.castShadow = true; pg.add(l);
      [-2.02, 2.02].forEach(e => { const cap = new THREE.Mesh(GEO.cyl, mat(0xd9b98a)); cap.scale.set(.32, .04, .32); cap.rotation.z = Math.PI/2; cap.position.set(e + (e > 0 ? .04 : 0), .36 + r*.64, -.74 + i*.74 + r*.37); pg.add(cap); }); }
    coll(lx, lz, 2.4);
  };
  switch (type){
    case 'bosque': {
      ground(16, 14, 0x8a6a45);
      A(GEO.box, 0x9c7a4c, 0,0,-2, 9,.3,6);
      [[-4.2,-4.7],[4.2,-4.7],[0,-4.7],[-4.2,.7],[4.2,.7],[0,.7]].forEach(([x,z]) => A(GEO.box, 0x6b4a2f, x,.3,z, .3,3.2,.3));
      { const r = new THREE.Mesh(roofGeo(6, 9, 1.6, 0x7a5a3a, rng), LP_ROOF); r.rotation.y = Math.PI/2; r.position.set(0, 3.5, -2); r.castShadow = true; g.add(r); }
      A(GEO.box, 0x7a5232, 0,.3,-2, 4,.8,1.1);
      const blade = new THREE.Group(); blade.position.set(.5, 1.55, -2); g.add(blade);
      blade.add(new THREE.Mesh(new THREE.CylinderGeometry(.7,.7,.05,16).rotateX(Math.PI/2), mat(0xc8ced6, { metalness: .4, roughness: .4 })));
      anims.push(dt => { blade.rotation.z -= dt*9; });
      { const l = new THREE.Mesh(GEO.cyl, mat(0x6b4a2f)); l.scale.set(.32, 3.6, .32); l.rotation.z = Math.PI/2; l.position.set(1.6, 1.4, -2); l.castShadow = true; g.add(l); }
      for (let i=0;i<6;i++) A(GEO.box, 0xd9b98a, -3, .3 + i*.13, -3.5, 3,.12,.5);
      for (let i=0;i<5;i++) A(GEO.box, 0xc9a97a, -3, .3 + i*.13, -2.9, 3,.12,.5);
      logPile(-6.5, 4, .3); logPile(5.5, 4.5, -.2);
      [[3, 2.5], [-2.5, 3], [7, -2]].forEach(([x,z], i) => { A(GEO.cyl, 0x7a5232, x,0,z, .45,.5,.45); A(GEO.cyl, 0xd9b98a, x,.5,z, .4,.02,.4, false); if (i === 0){ const ax = A(GEO.box, 0x7a5232, x+.1,.85,z, .05,.7,.05, false); ax.rotation.z = .4; A(GEO.box, 0x9aa0a8, x-.05,.6,z, .04,.22,.2, false); } coll(x, z, .5); });
      coll(0, -2, 5.2);
      { const [x, z] = W(-6, -5); cart(sc, x, z, face + .5, rng); }
      spots.push([3.4, 3.4], [-1.5, 1.5], [6, 1]);
      break; }
    case 'montana': {
      ground(22, 18, 0x9a9488);
      [[0,-8.5,18,2.6,3.5],[0,-10.5,15,5.2,3],[0,-12.4,12,7.6,3]].forEach(([x,z,w,h,d]) => { const m = A(GEO.box, 0x8f95a0, x,0,z, w,h,d); m.receiveShadow = true; });
      for (let i=0;i<12;i++){ const r = A(pick(GEO.rocks, rng), pick([0x7f8794, 0x9aa1ad], rng), (rng() - .5)*16, 2.4 + Math.floor(rng()*3)*2.5, -8 - rng()*5, .8 + rng()*.8, .6 + rng()*.5, .8 + rng()*.6); r.rotation.y = rng()*6; }
      coll(0, -10, 8); coll(-6, -9, 4); coll(6, -9, 4);
      // mine entrance
      A(GEO.box, 0x15120f, 0,0,-6.7, 2.4,3,.3, false);
      [-1.4, 1.4].forEach(x => A(GEO.box, 0x6b4a2f, x,0,-6.6, .3,3.2,.3)); A(GEO.box, 0x6b4a2f, 0,3.1,-6.6, 3.2,.35,.35);
      A(GEO.box, LAMP_MAT, 1.3,2.5,-6.3, .2,.3,.2, false);
      // rails & cart
      [-.5,.5].forEach(x => A(GEO.box, 0x5a5a5a, x,.05,-1.5, .08,.08,10, false));
      for (let i=0;i<12;i++) A(GEO.box, 0x6b4a2f, 0,0,-6.3 + i*.85, 1.5,.06,.25, false);
      const mc = new THREE.Group(); g.add(mc);
      mc.add(mesh(GEO.box, 0x6a5a4a, 0,.3,0, 1.2,.8,1.6)); [-1,1].forEach(s => [-1,1].forEach(t => { const w = new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.1,8).rotateZ(Math.PI/2), mat(0x3a3632)); w.position.set(s*.55,.22,t*.55); mc.add(w); }));
      for (let i=0;i<4;i++) mc.add(mesh(GEO.rocks[i % 3], i % 2 ? 0x5f7fa0 : 0x7f8794, (rng() - .5)*.6, 1.15, (rng() - .5)*.8, .3,.25,.3));
      anims.push((dt, t) => { mc.position.z = -5 + (Math.sin(t*.35)*.5 + .5)*8; });
      // cut stone blocks
      for (let r=0;r<2;r++) for (let i=0;i<3-r;i++) A(GEO.box, 0xc9ccd2, 5 + i*1.15 + r*.57, r*1.1, -1, 1.1,1.1,1.1);
      for (let i=0;i<3;i++) A(GEO.box, 0xbfc3ca, 5.5 + i*1.2, 0, 2, 1.1,1.1,1.1);
      coll(6, -.8, 2.2); coll(6.7, 2, 2);
      // ore pile with crystals
      A(GEO.cone7, 0x6a7280, -6,0,1.5, 2.2,1.6,2.2);
      for (let i=0;i<8;i++){ const c = A(GEO.cone4, mat(0x7fe0ff, { emissive: 0x2fb0e0, emissiveIntensity: .7 }), -6 + (rng() - .5)*2.4, .4 + rng()*.6, 1.5 + (rng() - .5)*2.4, .12,.45,.12, false); c.rotation.set(rng()*.6, rng()*3, rng()*.6); }
      coll(-6, 1.5, 2.2);
      // crane
      const crane = new THREE.Group(); crane.position.set(-5, 0, -3); g.add(crane);
      [-1,1].forEach(s => { const b = mesh(GEO.box, 0x6b4a2f, s*.9,0,0, .3,6.2,.3); b.rotation.z = -s*.15; crane.add(b); });
      const boom = new THREE.Group(); boom.position.y = 6; crane.add(boom);
      boom.add(mesh(GEO.box, 0x7a5232, 2.6,0,0, 6,.3,.3)); boom.add(mesh(GEO.box, 0xe8e0cc, 5,-2.5,0, .04,2.5,.04, false)); boom.add(mesh(GEO.box, 0xc9ccd2, 5,-3.4,0, .9,.9,.9));
      anims.push((dt, t) => { boom.rotation.y = Math.sin(t*.25)*1.1 - .3; });
      coll(-5, -3, 1.4);
      spots.push([-1.5, -4.8], [2, -4.6], [4, 0.5]);
      break; }
    case 'pradera': {
      ground(22, 20, 0x8aa858);
      // barn
      const bw = 7, bd = 5.5, bh = 3.6;
      A(GEO.box, 0xb5452f, 0,0,-6, bw,bh,bd);
      { const r = new THREE.Mesh(roofGeo(bw, bd, 2.6, 0x5a3a2a, rng), LP_ROOF); r.position.set(0, bh, -6); r.castShadow = true; g.add(r); }
      [-1,1].forEach(s => A(GEO.box, 0xf4f1ea, s*bw/2, 0, -6 + bd/2 + .02, .18, bh, .06, false));
      A(GEO.box, 0x8a2f22, 0,0,-6 + bd/2 + .03, 2.6,2.8,.06, false);
      [-1,1].forEach(s => { const d = A(GEO.box, 0xf4f1ea, 0,1.4,-6 + bd/2 + .07, .14,3.6,.04, false); d.rotation.z = s*.75; d.position.y = .05; });
      A(GEO.box, 0xf4f1ea, 0,2.8,-6 + bd/2 + .05, 2.8,.14,.05, false);
      A(GEO.box, 0x2b2522, 0,bh + .5,-6 + bd/2 + .1, .9,.8,.06, false);
      coll(0, -6, 4.3);
      // silo
      A(GEO.cyl14, 0xd9d2c4, 5.2,0,-6, 1.4,6.5,1.4); A(GEO.sphere, 0x7a8a9a, 5.2,6.5,-6, 1.45,1,1.45); [1.5, 3.2, 5].forEach(y => A(GEO.cyl14, 0xa0988a, 5.2,y,-6, 1.45,.1,1.45, false)); coll(5.2, -6, 1.6);
      // round corral
      const pcx = -1, pcz = 4.5, pr = 6.5;
      let prev = null;
      for (let a = .35; a <= Math.PI*2 - .35 + .01; a += .28){
        const x = pcx + Math.sin(a)*pr, z = pcz + Math.cos(a)*pr;
        A(GEO.box, 0x7a5a3a, x,0,z, .2,1.3,.2); coll(x, z, .35);
        if (prev){ [.55, 1.05].forEach(y => { const r = A(GEO.box, 0x8a6a48, (x + prev[0])/2, y, (z + prev[1])/2, Math.hypot(x - prev[0], z - prev[1]), .1, .08, false); r.rotation.y = Math.atan2(-(z - prev[1]), x - prev[0]); }); }
        prev = [x, z];
      }
      A(GEO.box, 0x7a5232, pcx + 2.5,0,pcz - 2, 2.2,.6,.7); A(GEO.box, 0x4a8ac0, pcx + 2.5,.55,pcz - 2, 2,.06,.5, false);
      [[4.5,-1.5],[6,0],[5,1.6]].forEach(([x,z]) => { const b = A(GEO.cyl14, 0xe3c46a, x,.7,z, .7,1.2,.7); b.rotation.z = Math.PI/2; b.position.x += .6; coll(x, z, .9); });
      { const [wx, wz] = W(pcx, pcz); const kinds = ['vaca','vaca','vaca','cerdo','cerdo','oveja','oveja','oveja','oveja','caballo'];
        kinds.forEach(k => { const an = rng()*6.28, r = rng()*3.5; addAnimal(sc, k, wx + Math.cos(an)*r, wz + Math.sin(an)*r, anims, rng, { hx: wx, hz: wz, rad: 4.2 }); }); }
      { const [wx, wz] = W(4, -2.5); for (let i=0;i<6;i++) addAnimal(sc, 'gallina', wx + (rng() - .5)*3, wz + (rng() - .5)*3, anims, rng, { hx: wx, hz: wz, rad: 3.5 }); }
      spots.push([2.5, -1.5], [-5, -2], [3, 3.5]);
      break; }
    case 'campo': {
      const plots = [[-5,-4.5, 8,6], [5,-4.5, 8,6], [-5,4, 8,6], [5,4, 8,6]];
      plots.forEach(([px,pz,pw,pd], pi) => {
        ground(pw + .4, pd + .4, 0x7a5a38, px, pz);
        const harvested = pi === 3;
        for (let ix=0; ix*0.5 < pw; ix++) for (let iz=0; iz*0.55 < pd; iz++){
          const lx = px - pw/2 + .25 + ix*.5, lz = pz - pd/2 + .3 + iz*.55;
          const [x, z] = W(lx, lz);
          if (harvested) { if (rng() < .5) S.add('tuft', x, .05, z, .5, rng()*6, jc(0xd9bf6a, rng(), .1)); }
          else S.add('wheat', x, .05, z, .9 + rng()*.25, rng()*6, jc(pick([0xe6c04a, 0xd9ad3a, 0xf0d06a], rng), rng(), .08), .85 + rng()*.3);
        }
        coll(px, pz, 2.6);
      });
      [[3.5,3],[6.5,5.5],[4.5,6]].forEach(([x,z]) => { const b = A(GEO.cyl14, 0xe3c46a, x,.75,z, .75,1.3,.75); b.rotation.z = Math.PI/2; b.position.x += .65; });
      for (let r=0;r<3;r++) for (let i=0;i<4-r;i++) A(GEO.box, 0xe8cd72, -1 + i*1.25 + r*.62, r*.6, 9.5, 1.2,.6,.65);
      coll(.8, 9.5, 2.6);
      // scarecrow
      { const sx = -5, sz = -4.5; A(GEO.box, 0x6b4a2f, sx,0,sz, .12,2.4,.12); A(GEO.box, 0x6b4a2f, sx,1.8,sz, 1.6,.1,.1); A(GEO.box, pick([0x3d5a8a, 0xb8322a], rng), sx,1.2,sz, .6,.8,.3); A(GEO.sphere, 0xd9c48a, sx,2.35,sz, .24,.26,.24); A(GEO.cyl14, 0xe3c77a, sx,2.5,sz, .45,.04,.45); A(GEO.cyl14, 0xd9b864, sx,2.52,sz, .2,.2,.2); }
      { const [x, z] = W(0, -11); windmill(sc, x, z, face, anims); }
      { const [x, z] = W(-9, 9); house(sc, x, z, 3.4, 3, 2.6, '#e8dcc0', 0xd9a63a, face + Math.PI/2, rng); addColl(x, z, 2.4); }
      { const [x, z] = W(9, 9.5); cart(sc, x, z, face - .6, rng, 0xe3c46a); }
      spots.push([0, -.2], [-1, 6], [1, -6.5]);
      break; }
    case 'cerro': {
      // the pit mound itself is terrain built by the village (centered at local -4,-1)
      A(GEO.cyl14, 0x5f7f96, -4,.07,-1, 1.5,.03,1.1, false);
      [[-5,-2],[-3,.2]].forEach(([x,z]) => A(GEO.cone7, 0x9c5a3a, x,.06,z, .7,.6,.7));
      ground(8, 6, 0xb59a6a, 7.5, 5);
      for (let p=0;p<3;p++){
        const pz = 3 + p*2;
        A(GEO.box, 0x8a6a48, 7.5, 0, pz, 4.8,.15,1.4, false);
        for (let i=0;i<8;i++) for (let j=0;j<2;j++){ const [x, z] = W(5.6 + i*.55, pz - .3 + j*.6); S.add('brick', x, .15, z, .32, face, jc(p === 2 ? 0xb5523b : 0x9c6a4a, rng(), .1), .16); }
        coll(7.5, pz, 1.8);
      }
      { const [x, z] = W(6, -4); kiln(sc, x, z, anims); }
      [[-1.5,-7],[1.5,-7],[-1.5,-4.5],[1.5,-4.5]].forEach(([x,z]) => A(GEO.box, 0x6b4a2f, x+9.5,0,z, .2,2.6,.2));
      { const r = new THREE.Mesh(roofGeo(3.4, 3, .9, 0x8a5a3a, rng), LP_ROOF); r.position.set(9.5, 2.6, -5.75); r.castShadow = true; g.add(r); }
      A(GEO.box, 0x7a5232, 9.5,0,-5.75, 2.4,.9,1.2); coll(9.5, -5.75, 2);
      { const [x, z] = W(3.5, -7); cart(sc, x, z, face + 1.2, rng, 0x9c5a3a); }
      spots.push([-4, -.2], [-3.2, -1.8], [7.5, 8.6]);
      break; }
    case 'mar': {
      const dock = A(GEO.box, 0x7a5a3a, 0,-.1,-1, 2.4,.3,14);
      [[-1.4,1],[1.4,1],[-1.4,-3],[1.4,-3],[-1.4,-7],[1.4,-7]].forEach(([x,z]) => A(GEO.cyl, 0x5a3b26, x,-2.6,z, .16,2.8,.16));
      [[-.7,5],[.6,5.4],[1,4.6]].forEach(([x,z]) => { const [wx, wz] = W(x, z); barrel(sc, wx, wz, rng); });
      [-3, -1].forEach((x, i) => { A(GEO.box, 0x6b4a2f, x - 2.4,0,6 + i*.01, .12,2,.12); });
      A(GEO.box, 0x6b4a2f, -4.4,0,6, .12,2,.12); A(GEO.box, 0x6b4a2f, -6.4,0,6, .12,2,.12);
      { const net = new THREE.Mesh(new THREE.PlaneGeometry(2,1.5, 4, 3), new THREE.MeshStandardMaterial({ color: 0x3a4a4a, wireframe: true })); net.position.set(-5.4, 1.2, 6); g.add(net); }
      A(GEO.box, 0x6b4a2f, -5.4,1.95,6, 2.2,.06,.06, false);
      { const [x, z] = W(-1.8, -7); boat(sc, x, z, face + .2, anims, -.6); }
      dock.receiveShadow = true;
      spots.push([0, -5], [.4, 3], [-4, 4.5]);
      break; }
  }
  return { spots: spots.map(([lx, lz]) => W(lx, lz)) };
}

