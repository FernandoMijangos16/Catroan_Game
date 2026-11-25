function legs4(g, color, w, top, xs, zs, hoof){
  const legs = [];
  [[-xs,-zs],[xs,-zs],[-xs,zs],[xs,zs]].forEach(([lx,lz]) => {
    const p = new THREE.Group(); p.position.set(lx, top, lz);
    const up = top*.5;
    p.add(mesh(PGEO.limb, color, 0, .02, 0, w*1.15, up + .02, w*1.15));
    const k = new THREE.Group(); k.position.y = -up; p.add(k);
    k.add(mesh(PGEO.joint, color, 0, 0, 0, w, w, w));
    k.add(mesh(PGEO.limb, color, 0, 0, 0, w*.85, top - up, w*.85));
    if (hoof) k.add(mesh(GEO.box, hoof, 0, -(top - up), .01, w*1.9, Math.min(.14, top*.15), w*2.1));
    p.knee = k; g.add(p); legs.push(p);
  });
  return legs;
}
function makeAnimal(kind, rng){
  const g = new THREE.Group(); let legs = [], extra = {};
  const grp = (par, x, y, z) => { const h = new THREE.Group(); h.position.set(x, y, z); par.add(h); return h; };
  // rounded low-poly parts: ellipsoids, tapered limbs
  const E = (par, c, x, y, z, sx, sy, sz, rx=0, ry=0, rz=0) => { const m = mesh(PGEO.joint, c, x, y, z, sx, sy, sz); m.rotation.set(rx, ry, rz); par.add(m); return m; };
  const L = (par, c, x, y, z, r, len, rx=0, ry=0, rz=0) => { const m = mesh(PGEO.limb, c, x, y, z, r, len, r); m.rotation.set(rx, ry, rz, 'YXZ'); par.add(m); return m; };
  const eyes = (par, x, y, z, s=.022, col=0x15120f) => [-1,1].forEach(k => E(par, col, k*x, y, z, s, s, s*.6));
  switch (kind){
    case 'oveja': {
      const w = 0xf2eee4;
      E(g, w, 0, .8, 0, .46, .4, .66);
      [[.24,.86,.14,.27],[-.24,.86,.1,.27],[0,1,-.1,.3],[0,.84,-.44,.3],[0,.92,.34,.29],[.18,.95,-.28,.24],[-.18,.95,-.3,.24]].forEach(([x,y,z,r], k) => { const b = mesh(GEO.blobs[k % 3], w, x, y, z, r, r*.9, r); g.add(b); });
      extra.head = grp(g, 0, .96, .6);
      E(extra.head, 0x2e2a28, 0, -.06, .14, .12, .14, .2, .55);
      E(extra.head, w, 0, .08, .0, .16, .12, .15);
      [-1,1].forEach(k => E(extra.head, 0x3a3430, k*.14, .01, .04, .09, .03, .045, 0, 0, k*.45));
      eyes(extra.head, .08, .01, .17, .018, 0xd9c060);
      legs = legs4(g, 0x2e2a28, .042, .52, .2, .34, 0x1d1a18); extra.speed = .7; break; }
    case 'cabra': {
      const c = pick([0xf2eee4, 0x8a6a48, 0x5a4a3a], rng);
      E(g, c, 0, .7, 0, .22, .25, .46); E(g, c, 0, .7, .26, .21, .25, .22);
      E(g, c, 0, .86, .4, .09, .15, .11, -.5);
      extra.head = grp(g, 0, .98, .46);
      E(extra.head, c, 0, 0, .07, .09, .1, .16, .5); E(extra.head, 0xd9d2c4, 0, -.13, .14, .03, .07, .03);
      [-1,1].forEach(k => { L(extra.head, 0x5a5048, k*.04, .07, -.02, .02, .22, 2.5, 0, k*.25); E(extra.head, c, k*.1, .03, 0, .06, .025, .04, 0, 0, k*.4); });
      eyes(extra.head, .06, .03, .12, .015, 0xd9c060);
      extra.tail = grp(g, 0, .8, -.44); L(extra.tail, c, 0, 0, 0, .025, .12, 2.4);
      legs = legs4(g, c, .034, .52, .12, .3, 0x2b2522); extra.speed = .9; break; }
    case 'vaca': {
      const spot = 0x2b2522, wht = 0xf2eee6;
      E(g, wht, 0, 1.08, 0, .48, .46, 1.0); E(g, wht, 0, .96, .12, .45, .4, .78);
      E(g, spot, .36, 1.22, .25, .16, .22, .28); E(g, spot, -.32, 1.12, -.42, .18, .24, .3); E(g, spot, .05, 1.48, -.18, .24, .08, .3);
      E(g, 0xe8a0a0, 0, .66, -.42, .16, .12, .16);
      E(g, wht, 0, 1.24, .86, .25, .3, .32);
      extra.head = grp(g, 0, 1.3, 1.12);
      E(extra.head, wht, 0, 0, .08, .21, .24, .3); E(extra.head, spot, .1, .08, .05, .1, .1, .14);
      E(extra.head, 0xe8a0a0, 0, -.12, .34, .18, .13, .12);
      [-1,1].forEach(k => { E(extra.head, 0x8a4a4a, k*.06, -.1, .45, .025, .02, .01); E(extra.head, wht, k*.24, .08, -.02, .11, .04, .07, 0, 0, k*.3); L(extra.head, 0xe0d8c0, k*.12, .2, 0, .028, .2, 0, 0, k*2.3); });
      eyes(extra.head, .15, .06, .18);
      extra.tail = grp(g, 0, 1.42, -.98); L(extra.tail, wht, 0, 0, 0, .025, .8, .18); E(extra.tail, spot, 0, -.82, .14, .05, .1, .05);
      legs = legs4(g, wht, .085, .9, .3, .7, 0x3a2f28); extra.speed = .55; break; }
    case 'cerdo': {
      const pk = 0xf0a5a8, dk = 0xe58c90;
      E(g, pk, 0, .5, 0, .36, .34, .64); E(g, pk, 0, .52, .4, .3, .3, .3);
      extra.head = grp(g, 0, .55, .6);
      E(extra.head, pk, 0, 0, .02, .22, .2, .2);
      { const sn = mesh(GEO.cyl14, dk, 0, -.03, .14, .1, .1, .1); sn.rotation.x = Math.PI/2; extra.head.add(sn); }
      [-1,1].forEach(k => { E(extra.head, 0x8a4a4a, k*.035, -.03, .25, .02, .025, .01); E(extra.head, dk, k*.12, .15, .04, .08, .1, .025, -.6, 0, k*.35); });
      [-1,1].forEach(k => { E(extra.head, 0xf6f0e8, k*.09, .07, .172, .03, .028, .012); E(extra.head, 0x15120f, k*.092, .068, .181, .016, .018, .008); });
      E(extra.head, 0xd47a80, 0, .115, .17, .13, .02, .02);
      extra.tail = grp(g, 0, .62, -.64); { const tl = new THREE.Mesh(new THREE.TorusGeometry(.04, .012, 4, 8), mat(dk)); tl.rotation.y = Math.PI/2; extra.tail.add(tl); }
      legs = legs4(g, dk, .045, .32, .18, .4, 0x8a5a5a); extra.speed = .6; break; }
    case 'gallina': {
      const c = pick([0xf6f2ea, 0xb5651d, 0x8a4a22, 0x2b2522], rng);
      E(g, c, 0, .4, 0, .19, .19, .26, -.15); E(g, c, 0, .4, .12, .16, .17, .15);
      [-1, 0, 1].forEach(k => E(g, k ? c : 0x3a3a3a, k*.05, .56, -.24, .035, .14, .08, -.5, 0, k*.2));
      [-1,1].forEach(k => { const w = E(g, c, k*.165, .42, -.02, .05, .12, .18, 0, 0, k*.1); extra[k < 0 ? 'wingL' : 'wingR'] = w; });
      E(g, c, 0, .55, .16, .085, .12, .085, -.3);
      extra.head = grp(g, 0, .66, .19);
      E(extra.head, c, 0, 0, 0, .1, .1, .1);
      [-.03, .01, .05].forEach((z, k) => E(extra.head, 0xd9332a, 0, .1 + (k === 1 ? .02 : 0), z, .02, .04, .025));
      { const bk = mesh(GEO.cone4, 0xf2b630, 0, -.01, .09, .03, .08, .03); bk.rotation.x = Math.PI/2; extra.head.add(bk); }
      E(extra.head, 0xd9332a, 0, -.08, .07, .025, .04, .02);
      eyes(extra.head, .07, .02, .06, .015);
      legs = [-1,1].map(s => { const p = new THREE.Group(); p.position.set(s*.07, .3, .02); p.add(mesh(PGEO.limb, 0xf2b630, 0,0,0, .02,.3,.02)); [-.4, 0, .4].forEach(a => { const t = mesh(GEO.box, 0xf2b630, 0, -.3, 0, .015, .012, .09); t.rotation.y = a; t.position.z = Math.cos(a)*.04; t.position.x = Math.sin(a)*.04; p.add(t); }); g.add(p); return p; });
      extra.speed = .9; extra.peck = true; break; }
    case 'caballo': {
      const c = pick([0x7a4a2a, 0x4a3020, 0xd9c7a0, 0x2b2522, 0x9a6a3a], rng), mane = pick([0x2b1d14, 0xe8e0cc, 0x4a3020], rng);
      E(g, c, 0, 1.45, 0, .36, .4, .92); E(g, c, 0, 1.42, .58, .34, .4, .4); E(g, c, 0, 1.52, -.58, .36, .4, .42);
      L(g, c, 0, 1.6, .74, .2, 1, -2.5);
      { const mn = E(g, mane, 0, 2.02, .98, .05, .52, .14, -.65); }
      extra.head = grp(g, 0, 2.3, 1.36);
      E(extra.head, c, 0, -.06, .16, .14, .17, .34, .6); E(extra.head, c, 0, .02, 0, .14, .16, .16);
      E(extra.head, 0x2b2522, 0, -.24, .4, .12, .11, .13, .6);
      [-1,1].forEach(k => { const ear = mesh(GEO.cone4, c, k*.07, .12, -.04, .04, .14, .03); ear.rotation.z = -k*.2; extra.head.add(ear); });
      E(extra.head, mane, 0, .1, .05, .05, .06, .1);
      eyes(extra.head, .13, -.02, .14, .022);
      extra.tail = grp(g, 0, 1.75, -.98); L(extra.tail, mane, 0, 0, 0, .07, .95, .3); E(extra.tail, mane, 0, -.95, .3, .06, .12, .06);
      legs = legs4(g, c, .065, 1.25, .22, .64, 0x2b2522); extra.speed = .9; break; }
    case 'perro': {
      const c = pick([0xb5651d, 0x2b2522, 0xd9c7a0, 0x8a6a48], rng), c2 = new THREE.Color(c).multiplyScalar(.75).getHex();
      E(g, c, 0, .58, 0, .17, .19, .4); E(g, c, 0, .6, .24, .17, .2, .2);
      E(g, c, 0, .72, .35, .1, .13, .12, -.4);
      extra.head = grp(g, 0, .84, .42);
      E(extra.head, c, 0, 0, 0, .13, .13, .14); E(extra.head, c, 0, -.04, .14, .075, .07, .11); E(extra.head, 0x15120f, 0, -.02, .25, .025, .02, .02);
      [-1,1].forEach(k => E(extra.head, c2, k*.11, .01, -.02, .03, .1, .06, 0, 0, k*.25));
      eyes(extra.head, .06, .03, .11, .018);
      extra.tail = grp(g, 0, .68, -.38); L(extra.tail, c, 0, 0, 0, .025, .3, 2.3);
      legs = legs4(g, c, .042, .45, .1, .26); extra.speed = 2.2; break; }
    case 'gato': {
      const c = pick([0x2b2522, 0xe0a050, 0x9a9a9a, 0xf4f1ea], rng);
      E(g, c, 0, .33, 0, .11, .12, .26);
      extra.head = grp(g, 0, .46, .26);
      E(extra.head, c, 0, 0, 0, .1, .09, .09); E(extra.head, c, 0, -.03, .07, .05, .04, .04);
      [-1,1].forEach(k => { const ear = mesh(GEO.cone4, c, k*.055, .06, -.01, .035, .07, .025); ear.rotation.z = -k*.15; extra.head.add(ear); });
      eyes(extra.head, .04, .01, .08, .014, 0x9ad04a);
      extra.tail = grp(g, 0, .38, -.25); L(extra.tail, c, 0, 0, 0, .018, .38, 2.6);
      legs = legs4(g, c, .026, .26, .06, .17); extra.speed = 1.1; break; }
    case 'ciervo': {
      const c = 0x9a6a3a;
      E(g, c, 0, 1.3, 0, .26, .3, .68); E(g, c, 0, 1.32, .42, .25, .3, .3); E(g, 0xe8dcc8, 0, 1.12, .05, .2, .12, .5);
      L(g, c, 0, 1.45, .55, .12, .82, -2.6);
      extra.head = grp(g, 0, 2.13, .98);
      E(extra.head, c, 0, 0, .08, .1, .11, .22, .5); E(extra.head, c, 0, .03, -.02, .1, .1, .1);
      E(extra.head, 0x2b2522, 0, -.1, .27, .045, .04, .04);
      [-1,1].forEach(k => E(extra.head, c, k*.12, .08, -.02, .08, .03, .045, 0, 0, k*.4));
      eyes(extra.head, .09, .03, .1, .018);
      if (rng() < .6) [-1,1].forEach(k => { const a = L(extra.head, 0xd9c7a0, k*.05, .1, -.02, .02, .5, 2.8, 0, k*.4); const b = mesh(PGEO.limb, 0xd9c7a0, 0, -.28, 0, .015, .22, .015); b.rotation.set(-.9, 0, 0); a.add(b); const b2 = mesh(PGEO.limb, 0xd9c7a0, 0, -.42, 0, .012, .18, .012); b2.rotation.set(.9, 0, k*.3); a.add(b2); });
      E(g, 0xf4f1ea, 0, 1.44, -.7, .06, .08, .04);
      legs = legs4(g, c, .038, 1.15, .16, .5, 0x2b2522); extra.speed = 1; extra.flee = true; break; }
    case 'conejo': {
      const c = pick([0x9a8a7a, 0xd9c7a0, 0xf4f1ea], rng);
      E(g, c, 0, .18, 0, .13, .13, .18);
      E(g, c, 0, .3, .15, .09, .09, .1);
      [-1,1].forEach(k => E(g, c, k*.035, .44, .12, .025, .1, .016, -.2));
      eyes(g, .06, .32, .22, .014);
      E(g, 0xf4f1ea, 0, .2, -.18, .05, .05, .05);
      extra.speed = 1.4; extra.hop = true; extra.flee = true; break; }
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return { g, legs, ...extra, kindName: kind };
}
function addAnimal(sc, kind, x, z, anims, rng, opts={}){
  const gh = GH, coll = CUR_COLL;
  const a = makeAnimal(kind, rng);
  a.g.position.set(x, gh(x, z), z); a.g.rotation.y = rng()*6.28; if (opts.scale) a.g.scale.setScalar(opts.scale); if (opts.noFlee) a.flee = false; const spMul = opts.speedMul || 1;
  const st = { hx: opts.hx ?? x, hz: opts.hz ?? z, rad: opts.rad ?? 8, tx: x, tz: z, w: rng()*3, ph: rng()*6, follow: !!opts.follow, fleeing: 0 };
  sc.add(a.g); if (CUR_ANIMALS) CUR_ANIMALS.push(a);
  const pickT = () => { const an = Math.random()*6.28, r = Math.sqrt(Math.random())*st.rad; st.tx = st.hx + Math.cos(an)*r; st.tz = st.hz + Math.sin(an)*r; };
  anims.push((dt, t) => {
    const p = a.g.position, cam = camera.position;
    const pdx = p.x - cam.x, pdz = p.z - cam.z, pd = Math.hypot(pdx, pdz);
    let speed = a.speed*spMul;
    if (a.flee && pd < 10){ st.tx = p.x + pdx/pd*8; st.tz = p.z + pdz/pd*8; st.w = 0; speed *= 4; st.fleeing = 1; }
    else if (st.follow && mode === 'village' && pd > 3.5 && pd < 30){ st.tx = cam.x + Math.sin(t*.7)*1.5; st.tz = cam.z + Math.cos(t*.7)*1.5; st.w = 0; speed = pd > 8 ? 4.5 : 2.4; }
    else if (st.fleeing){ st.fleeing = 0; pickT(); }
    if (a.tail) a.tail.rotation.z = Math.sin(t*(st.follow ? 14 : 4) + st.ph)*.5;
    if (a.wingL){ const fl = Math.max(0, Math.sin(t*1.3 + st.ph*3)) > .97 ? Math.sin(t*30)*.5 : 0; a.wingL.rotation.z = -fl; a.wingR.rotation.z = fl; }
    if (st.w > 0){
      st.w -= dt;
      a.legs.forEach(l => { l.rotation.x *= .85; if (l.knee) l.knee.rotation.x *= .85; });
      if (a.peck && a.head) a.head.rotation.x = Math.max(0, Math.sin(t*6 + st.ph))*.9;
      else if (a.head) a.head.rotation.x = Math.sin(t*.8 + st.ph)*.15 + .25;
      if (st.w <= 0) pickT();
      return;
    }
    const dx = st.tx - p.x, dz = st.tz - p.z, d = Math.hypot(dx, dz);
    if (d < .3){ st.w = (st.follow && pd <= 3.5) ? .2 : 1 + Math.random()*5; return; }
    const step = Math.min(d, speed*dt);
    p.x += dx/d*step; p.z += dz/d*step;
    if (coll) for (const h of coll){ const ex = p.x - h.x, ez = p.z - h.z; if (Math.abs(ex) > h.r + .6 || Math.abs(ez) > h.r + .6) continue; const e = Math.hypot(ex, ez), mn = h.r + .35; if (e < mn && e > 1e-4){ p.x = h.x + ex/e*mn; p.z = h.z + ez/e*mn; } }
    { const want = Math.atan2(dx, dz), cur = a.g.rotation.y; a.g.rotation.y = cur + Math.atan2(Math.sin(want - cur), Math.cos(want - cur))*Math.min(1, dt*6); }
    if (a.head && !a.peck) a.head.rotation.x = Math.sin(st.ph*2)*.06;
    st.ph += dt*speed*6;
    const s = Math.sin(st.ph)*.55;
    a.legs.forEach((l, i) => { const sg = (i % 2 === 0 ? 1 : -1) * (i < 2 ? 1 : -1); l.rotation.x = s*sg; if (l.knee) l.knee.rotation.x = Math.max(0, Math.cos(st.ph)*sg)*.75; });
    p.y = gh(p.x, p.z) + (a.hop ? Math.abs(Math.sin(st.ph*.8))*.3 : 0);
  });
  return a;
}
// ---- birds, butterflies, pollen
function birdFlock(sc, anims, rng, cx, cz, opts={}){
  const n = opts.n || 6, R = opts.r || 30, h = opts.h || 28, color = opts.color || 0x2b2a30, sp = opts.speed || .25;
  const flock = new THREE.Group(); sc.add(flock);
  const birds = [];
  for (let i=0;i<n;i++){
    const b = new THREE.Group(); b.position.set((rng() - .5)*6, (rng() - .5)*3, (rng() - .5)*6);
    b.add(mesh(GEO.box, color, 0,0,0, .18,.14,.6, false));
    const wl = new THREE.Group(), wr = new THREE.Group();
    wl.add(mesh(GEO.box, color, -.45,0,0, .9,.04,.32, false)); wr.add(mesh(GEO.box, color, .45,0,0, .9,.04,.32, false));
    b.add(wl, wr); flock.add(b); birds.push({ b, wl, wr, ph: rng()*6 });
  }
  const ph0 = rng()*6;
  anims.push((dt, t) => {
    const a = t*sp + ph0;
    flock.position.set(cx + Math.cos(a)*R, h + Math.sin(t*.5 + ph0)*3, cz + Math.sin(a)*R);
    flock.rotation.y = -a;
    birds.forEach(o => { const f = Math.sin(t*9 + o.ph)*.7; o.wl.rotation.z = f; o.wr.rotation.z = -f; o.b.position.y += Math.sin(t*2 + o.ph)*dt*.3; });
  });
}
function butterflies(sc, anims, rng, cx, cz, n, rad){
  const gh = GH;
  for (let i=0;i<n;i++){
    const g = new THREE.Group(), c = pick([0xf7d046, 0xf4f1ea, 0xe85d75, 0x5fa8f0, 0xff9f43], rng);
    const wl = new THREE.Mesh(new THREE.PlaneGeometry(.22,.18).translate(-.11,0,0), mat(c, { side: THREE.DoubleSide })), wr = new THREE.Mesh(new THREE.PlaneGeometry(.22,.18).translate(.11,0,0), mat(c, { side: THREE.DoubleSide }));
    wl.rotation.x = wr.rotation.x = -Math.PI/2; const pl = new THREE.Group(), pr = new THREE.Group(); pl.add(wl); pr.add(wr); g.add(pl, pr); sc.add(g);
    const hx = cx + (rng() - .5)*rad*2, hz = cz + (rng() - .5)*rad*2, ph = rng()*20;
    anims.push((dt, t) => {
      const k = t*.35 + ph;
      const x = hx + Math.sin(k*1.3)*3 + Math.sin(k*3.1)*.8, z = hz + Math.cos(k*1.1)*3;
      g.position.set(x, gh(x, z) + .7 + Math.abs(Math.sin(k*2.3))*1.1, z);
      g.rotation.y = Math.atan2(Math.cos(k*1.3), -Math.sin(k*1.1));
      const f = Math.sin(t*22 + ph)*.9; pl.rotation.z = f; pr.rotation.z = -f;
    });
  }
}
function pollen(sc, anims){
  const N = 280, geo = new THREE.BufferGeometry(), pos = new Float32Array(N*3);
  for (let i=0;i<N;i++){ pos[i*3] = (Math.random() - .5)*60; pos[i*3+1] = Math.random()*9; pos[i*3+2] = (Math.random() - .5)*60; }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const cv = document.createElement('canvas'); cv.width = cv.height = 32; const cx = cv.getContext('2d'); const gr = cx.createRadialGradient(16,16,0,16,16,16); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.4,'rgba(255,250,220,.8)'); gr.addColorStop(1,'rgba(255,250,220,0)'); cx.fillStyle = gr; cx.fillRect(0,0,32,32);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xfff4c8, size: .07, map: new THREE.CanvasTexture(cv), transparent: true, opacity: .85, depthWrite: false }));
  pts.frustumCulled = false; sc.add(pts);
  anims.push((dt, t) => {
    const c = camera.position;
    for (let i=0;i<N;i++){
      pos[i*3] += (Math.sin(t*.5 + i) *.3 + .25)*dt; pos[i*3+1] += Math.sin(t*.8 + i*1.7)*dt*.15; pos[i*3+2] += Math.cos(t*.4 + i)*dt*.3;
      const dx = pos[i*3] - c.x, dz = pos[i*3+2] - c.z, dy = pos[i*3+1] - c.y;
      if (dx > 30) pos[i*3] -= 60; else if (dx < -30) pos[i*3] += 60;
      if (dz > 30) pos[i*3+2] -= 60; else if (dz < -30) pos[i*3+2] += 60;
      if (dy > 8) pos[i*3+1] -= 10; else if (dy < -2) pos[i*3+1] += 10;
    }
    geo.attributes.position.needsUpdate = true;
  });
}

// ---- people
