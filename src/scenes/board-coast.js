// ================= GENERATIVE COAST (irregular island shaped by the biomes on the board edge) =================
const hexN = (lx, lz) => Math.max(Math.abs(lx), Math.abs(lx*.5 + lz*SQ3/2), Math.abs(-lx*.5 + lz*SQ3/2));
const CELL_IN = SQ3/2;
const COAST_E = { montana: .95, cerro: .85, bosque: 1.3, pradera: 1.05, campo: 1.0, desierto: 1.55 };
function coastField(tiles){
  const edge = tiles.filter(t => tiles.filter(o => o !== t && Math.hypot(o.x - t.x, o.z - t.z) < 1.9).length < 6);
  const seed = tiles.reduce((a, t) => a + t.i*(t.type.length + 3), 0) % 97;
  const prof = (type, u, E, x, z, n) => {
    const H0 = .19;
    if (u >= 1){ const dep = (u - 1)*E;
      switch (type){ case 'montana': return Math.max(-.95, -.32 - dep*.6); case 'cerro': return Math.max(-.9, -.015 - dep*.4); case 'bosque': return Math.max(-.7, -.02 - dep*.13); case 'desierto': return Math.max(-.9, -dep*.25); default: return Math.max(-.9, -dep*.35); } }
    switch (type){
      case 'pradera': return H0*Math.pow(1 - u, .9)*(1 + (n - .5)*.7*smoothstep(0, .3, u));
      case 'campo': return H0*(1 - Math.pow(u, 1.6));
      case 'desierto': return H0*(1 - u) + .05*(.5 + .5*Math.sin(x*5.3 + z*2.1 + n*5))*(1 - u)*smoothstep(0, .15, u);
      case 'bosque': return H0*(1 - smoothstep(0, .6, u)) - .02*smoothstep(.5, 1, u) + (n - .5)*.035*u;
      case 'montana': { const top = H0 + (.16 + .42*n)*smoothstep(0, .3, u), c = 1 - smoothstep(.8, .97, u); return top*c - .32*(1 - c); }
      case 'cerro': { const top = H0 + (.05 + .17*n)*smoothstep(0, .3, u), c = 1 - smoothstep(.76, .95, u); return top*c - .015*(1 - c); }
    }
    return H0*(1 - u);
  };
  const cache = new Map();
  function info(x, z){
    const key = Math.round(x*400) + ',' + Math.round(z*400);
    const hit = cache.get(key); if (hit) return hit;
    let best = 1e9, bt = null;
    for (const t of tiles){ const h = hexN(x - t.x, z - t.z); if (h < best){ best = h; bt = t; } }
    const d = best - CELL_IN;
    const wx = x + (fbm(x*.9 + seed, z*.9, 31) - .5)*1.7, wz = z + (fbm(x*.9, z*.9 + seed, 32) - .5)*1.7;
    let W = 0, E = 0, top = 0, B = null; const ws = [];
    for (const t of edge){ const w = Math.exp(-hexN(wx - t.x, wz - t.z)*5.5); ws.push(w); W += w; E += w*COAST_E[t.type]; if (w > top){ top = w; B = t; } }
    const ang = Math.atan2(z, x);
    E = E/W*(.5 + 1.05*fbm(Math.cos(ang)*1.7 + 10 + seed, Math.sin(ang)*1.7 + 10, 33) + .35*(fbm(x*1.4, z*1.4, 34) - .5));
    if (G && G.ports) for (const pt of G.ports){ const bx = pt.x + pt.nx*.5, bz = pt.z + pt.nz*.5, b = Math.exp(-((x - bx)**2 + (z - bz)**2)/.28); E = E*(1 - b) + .32*b; }
    E = Math.max(.3, Math.min(2.6, E));
    const u = Math.max(0, d)/E, n = fbm(x*2.2 + seed, z*2.2, 35);
    let h = 0;
    if (d < 0) h = .1;
    else { edge.forEach((t, i) => { h += ws[i]*prof(t.type, u, E, x, z, n); }); h /= W; h -= .045*smoothstep(.55, 1.05, u); }
    const o = { d, u, E, h, B: B.type, tile: bt, near: B };
    if (cache.size < 400000) cache.set(key, o);
    return o;
  }
  return { info, edge };
}
function coastColor(I, x, y, z, r, ny){
  const B = I.B;
  if (I.d < 0) return jc(0x5a4a36, r, .05);
  if (y < -.05){
    const k = Math.min(1, (-.05 - y)/.6);
    if (B === 'bosque') return jc(new THREE.Color(0x5a5636).lerp(new THREE.Color(0x3e4a3a), k).getHex(), r, .06);
    if (B === 'montana' && ny < .8) return jc(0x5e636a, r, .07);
    return jc(new THREE.Color(0xcdb37e).lerp(new THREE.Color(0x6f8a86), k).getHex(), r, .05);
  }
  if (ny < .7){
    if (B === 'montana') return jc(r < .5 ? 0x7e8592 : 0x6c727c, r, .07);
    if (B === 'cerro') return jc(r < .5 ? 0xb5603a : 0x9c5034, r, .07);
    if (y < .04 && B !== 'bosque') return jc(0xd9be86, r, .06);
    return jc(0x8a7050, r, .07);
  }
  if (y < .028){
    if (B === 'bosque') return jc(r < .55 ? 0x6b6a40 : 0x4f6a35, r, .08);
    if (B === 'cerro') return jc(y < -.02 ? 0xc48a66 : 0xd9a27a, r, .06);
    if (B === 'montana') return jc(r < .5 ? 0x8a8a84 : 0xb8ac90, r, .07);
    return jc(y < -.02 ? 0xd6bb84 : 0xead39a, r, .05);
  }
  if (r < 1 - smoothstep(.08, .5, I.u)) return tileColor(I.tile, x, Math.min(y - .2, .1), z, r);
  const f = fbm(x*4, z*4, 9) > .5;
  switch (B){
    case 'pradera': return jc(f ? 0x9bd86a : 0x86c95a, r, .1);
    case 'campo': return jc(f ? 0xa8c862 : 0x9fbf58, r, .1);
    case 'bosque': return jc(I.u > .55 ? (f ? 0x55703a : 0x4c6436) : (f ? 0x3f7a3a : 0x356b34), r, .1);
    case 'montana': return jc(y > .45 ? 0x9aa1ad : (f ? 0x7a9a55 : 0x6a8a4a), r, .1);
    case 'cerro': return jc(f ? 0xa9b85a : 0xc08a4a, r, .1);
    case 'desierto': return jc(f ? 0xf0d9a0 : 0xe4c88c, r, .07);
  }
  return jc(0x86c95a, r, .1);
}
const STACK_GEO = sg(jitterGeo(new THREE.CylinderGeometry(.75, 1, 1, 7, 4).translate(0, .5, 0), .12, 9));
function buildCoast(sc, S, banims){
  const F = coastField(G.tiles), rr = mulberry32(G.tiles.reduce((a, t) => a + t.i*t.type.length, 7));
  const geo = new THREE.PlaneGeometry(20, 20, 170, 170).rotateX(-Math.PI/2), p = geo.attributes.position;
  for (let i=0;i<p.count;i++){ const x = p.getX(i) + (rr() - .5)*.05, z = p.getZ(i) + (rr() - .5)*.05; p.setXYZ(i, x, F.info(x, z).h, z); }
  const g = geo.toNonIndexed(); geo.dispose();
  colorize(g, (x, y, z, r, ny) => coastColor(F.info(x, z), x, y, z, r, ny), rr);
  const land = new THREE.Mesh(g, LP_BOARD); land.receiveShadow = true; land.castShadow = true; sc.add(land);
  // vegetation and rocks that follow each coast type
  const gc = { bosque: 0x3f7a3a, pradera: 0x86c95a, campo: 0xa8c060, montana: 0x7a9a55, cerro: 0xa9b85a, desierto: 0xb8b060 };
  const tuftP = { bosque: .45, pradera: .7, campo: .55, montana: .35, cerro: .3, desierto: .08 };
  for (let k=0;k<5200;k++){
    const x = (rr() - .5)*18, z = (rr() - .5)*18, I = F.info(x, z);
    if (I.d < .04 || I.u > 1.6) continue;
    const h = I.h, B = I.B, q = rr();
    if (h > .035 && I.u < .97){
      if (q < tuftP[B]*.35) S.add('tuft', x, h, z, .07 + rr()*.05, rr()*6, jc(gc[B], rr(), .15));
      else if (B === 'pradera' && q < .3) S.flower(x, h, z, .08, pick(FLOWER_COLORS, rr), rr()*6);
      if (B === 'bosque' && h > .07 && rr() < .16) CUR_TREES.add(treeKindFor('bosque', rr), x, h - .004, z, .02 + rr()*.013, rr()*6.28, treeTint('roble', rr));
      else if (B === 'montana' && h > .24 && rr() < .07) CUR_TREES.add(rr() < .6 ? 'abeto' : 'pino', x, h - .004, z, .015 + rr()*.007, rr()*6.28, treeTint('pino', rr));
      else if (B === 'pradera' && rr() < .012) CUR_TREES.add(treeKindFor('pradera', rr), x, h - .004, z, .022 + rr()*.01, rr()*6.28, treeTint('roble', rr));
      else if (B === 'campo' && rr() < .01) CUR_TREES.add('alamo', x, h - .004, z, .014 + rr()*.005, rr()*6.28, treeTint('alamo', rr));
      else if (B === 'cerro' && rr() < .02) CUR_TREES.add(treeKindFor('cerro', rr), x, h - .004, z, .015 + rr()*.006, rr()*6.28, treeTint('roble', rr));
      else if (B === 'desierto' && rr() < .02){ sc.add(mesh(GEO.cyl, 0x4f8a4a, x, h, z, .018, .1, .018)); }
    }
    // mangroves: in the marsh and the shallow water in front of forests
    if (B === 'bosque' && h > -.1 && h < .035 && I.u > .5 && I.u < 1.22 && rr() < .75) CUR_TREES.add('mangle', x, h - .01, z, .045 + rr()*.02, rr()*6.28, treeTint('mangle', rr));
    // palms where the desert meets the sea
    if (B === 'desierto' && h > -.015 && h < .07 && rr() < .1) CUR_TREES.add('palma', x, h - .004, z, .026 + rr()*.008, rr()*6.28, treeTint('palma', rr));
    // sea stacks under the cliffs
    if ((B === 'montana' || B === 'cerro') && I.u > 1 && I.u < 1.18 && rr() < .035){
      const top = B === 'montana' ? .06 + rr()*.2 : .03 + rr()*.07, w = .09 + rr()*.08, col = B === 'montana' ? pick([0x7e8592, 0x6c727c], rr) : pick([0xb5603a, 0x9c5034], rr);
      const m = mesh(STACK_GEO, col, x, h, z, w, top - h, w*(.8 + rr()*.4)); m.rotation.y = rr()*6; sc.add(m);
      if (B === 'montana' && rr() < .5) sc.add(mesh(GEO.cone6, 0x6a8a4a, x, top - .005, z, w*.9, .02, w*.9));
    }
    // rocks along the shoreline
    if (h > -.07 && h < .02 && B !== 'desierto' && B !== 'bosque' && rr() < .05){ const m = mesh(pick(GEO.rocks, rr), pick([0x9a978e, 0x8b8f98, 0xa89a80], rr), x, h - .01, z, .03 + rr()*.05, .025 + rr()*.03, .03 + rr()*.05); m.rotation.y = rr()*6; sc.add(m); }
  }
  return F;
}

