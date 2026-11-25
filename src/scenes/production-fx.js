const RES_GLOW = { madera: 0xffd28a, ladrillo: 0xff9a6a, lana: 0xffffff, trigo: 0xffe07a, mineral: 0xcfe6ff };
const FXT = {};
function fxTex(){
  if (FXT.spark) return FXT;
  FXT.spark = pxTex(32, 32, (c, w) => { const g = c.createRadialGradient(w/2, w/2, 0, w/2, w/2, w/2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }, false);
  FXT.dot = pxTex(16, 16, (c, w) => { const g = c.createRadialGradient(w/2, w/2, 0, w/2, w/2, w/2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.55, 'rgba(255,255,255,1)'); g.addColorStop(.75, 'rgba(255,255,255,.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }, false);
  FXT.rays = pxTex(128, 128, (c, w) => {
    c.translate(w/2, w/2);
    for (let i=0;i<14;i++){ c.rotate(Math.PI*2/14); const g = c.createLinearGradient(0, 0, w/2, 0); g.addColorStop(0, 'rgba(255,250,220,.9)'); g.addColorStop(1, 'rgba(255,250,220,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(w/2, -5 - (i % 2)*3); c.lineTo(w/2, 5 + (i % 2)*3); c.fill(); }
    const g = c.createRadialGradient(0, 0, 0, 0, 0, w/4); g.addColorStop(0, 'rgba(255,255,240,1)'); g.addColorStop(1, 'rgba(255,255,240,0)'); c.fillStyle = g; c.fillRect(-w/2, -w/2, w, w);
  }, false);
  FXT.beam = pxTex(4, 64, (c, w, h) => { const g = c.createLinearGradient(0, h, 0, 0); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(.4, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }, false);
  FXT.beamGeo = sg(new THREE.CylinderGeometry(.16, .26, 1.6, 16, 1, true).translate(0, .8, 0));
  return FXT;
}
const additive = o => new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, ...o });
const REVEALS = [], FLY = [];
let TOKENS = {};
// gains: [{ tile, res, to: [{ x, z, p, n }] }]
function revealProduction(list){
  const T = fxTex(); let delay = 0;
  list.forEach(e => {
    const t = e.tile, glow = RES_GLOW[e.res];
    const beam = new THREE.Mesh(T.beamGeo, additive({ map: T.beam, color: glow, side: THREE.DoubleSide, opacity: 0 })); beam.position.set(t.x, .24, t.z); beam.scale.set(1, .01, 1);
    const rays = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.rays, color: glow, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0 })); rays.scale.setScalar(.01);
    const it = makeResourceItem(e.res); it.visible = false;
    const sp = sparkles(boardScene, glow);
    [beam, rays, it].forEach(o => boardScene.add(o));
    REVEALS.push({ ...e, beam, rays, it, sp, t: -delay, tok: TOKENS[t.i], launched: false });
    delay += .65;
  });
}
function sparkles(sc, color, n = 26){
  const T = fxTex(), pos = new Float32Array(n*3), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ map: T.spark, color, size: .07, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0 }));
  p.userData.seed = Array.from({ length: n }, () => [Math.random()*6.28, Math.random(), .3 + Math.random()*.7]);
  p.frustumCulled = false; sc.add(p); return p;
}
function stepReveals(dt, tt){
  dt *= .72;
  for (let i = REVEALS.length - 1; i >= 0; i--){
    const r = REVEALS[i]; r.t += dt; const t = r.t; if (t < 0) continue;
    const T = r.tile, tok = r.tok;
    if (t < .02) SFX.reveal?.();
    // coin-flip of the number token
    if (tok){ const k = Math.min(1, t/.55); tok.rotation.x = k*Math.PI*2; tok.position.y = .22 + Math.sin(k*Math.PI)*.32; if (k >= 1){ tok.rotation.x = 0; tok.position.y = .22; } }
    // light beam and rays
    const on = smoothstep(.15, .45, t)*(1 - smoothstep(1.55, 2.0, t));
    r.beam.material.opacity = on*.55; r.beam.scale.set(1, Math.max(.01, smoothstep(.15, .5, t)), 1); r.beam.rotation.y += dt*.8;
    // item rising out of the token, spinning fast then slowing down
    const u = smoothstep(.3, 1.15, t), it = r.it;
    it.visible = t > .3;
    const y = .26 + u*.78 + Math.sin(tt*3)*.025*u;
    it.position.set(T.x, y, T.z);
    it.rotation.y += dt*(2 + 16*(1 - u)); it.rotation.z = .42*u + Math.sin(t*3)*.05*u;
    const s = .56*(t < 1.15 ? Math.min(1, (t - .3)/.5)*(1 + Math.sin(Math.min(1, (t - .3)/.5)*Math.PI)*.25) : 1);
    it.scale.setScalar(Math.max(.001, s*(t > 1.75 ? Math.max(0, 1 - (t - 1.75)/.18) : 1)));
    r.rays.position.set(T.x, y + .08, T.z); r.rays.material.opacity = on*.85; r.rays.scale.setScalar(.1 + on*1.25); r.rays.material.rotation += dt*.7;
    // sparkles around
    const P = r.sp.geometry.attributes.position;
    r.sp.userData.seed.forEach(([a, h, sp], j) => { const k = ((t*sp*.6 + h) % 1); P.setXYZ(j, T.x + Math.cos(a + t*sp*2)*(.16 + k*.22), .3 + k*1.0, T.z + Math.sin(a + t*sp*2)*(.16 + k*.22)); });
    P.needsUpdate = true; r.sp.material.opacity = on;
    // send copies to each receiving village
    if (t > 1.75 && !r.launched){ r.launched = true; let d = 0, dm = 0; const [sx, sy] = toScreen(it.position); r.to.forEach(v => { for (let q=0;q<v.n;q++){ if (v.tok){ flyToInventory(v.tok, sx, sy, dm); dm += .15; } else { flyResource(r.res, it.position.x, y, it.position.z, v.x, v.z, d, v); d += .12; } } }); SFX.whoosh?.(); }
    if (t > 2.1){ [r.beam, r.rays, r.it, r.sp].forEach(o => boardScene.remove(o)); r.beam.material.dispose(); r.rays.material.dispose(); r.sp.geometry.dispose(); r.sp.material.dispose(); REVEALS.splice(i, 1); }
  }
}
function flyResource(kind, fx, fy, fz, tx, tz, delay, v){
  const it = makeResourceItem(kind); it.scale.setScalar(.3); it.visible = false; boardScene.add(it);
  FLY.push({ it, fx, fy, fz, tx, tz, t: -delay, v });
}
const CELEBRATED = new Set();
function stepFly(dt, tt){
  stepReveals(dt, tt);
  for (let i = FLY.length - 1; i >= 0; i--){
    const f = FLY[i]; f.t += dt;
    if (f.t < 0) continue;
    f.it.visible = true;
    const k = Math.min(1, f.t/1.2), e = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;
    f.it.position.set(f.fx + (f.tx - f.fx)*e, f.fy + (.3 - f.fy)*e + Math.sin(k*Math.PI)*.55, f.fz + (f.tz - f.fz)*e);
    f.it.rotation.y += dt*6; f.it.rotation.z = .42; f.it.scale.setScalar(.34*(k > .85 ? (1 - k)/.15 : 1) + .001);
    if (k >= 1){
      boardScene.remove(f.it); FLY.splice(i, 1);
      const key = f.tx.toFixed(2) + ',' + f.tz.toFixed(2);
      if (f.v && !CELEBRATED.has(key)){ CELEBRATED.add(key); celebrate(boardScene, f.tx, .3, f.tz, 1, G.players[f.v.p].color); setTimeout(() => CELEBRATED.delete(key), 2500); }
    }
  }
  stepFireworks(dt);
}

// ---------- fireworks ----------
const FW = [];
function celebrate(sc, x, y, z, S, color, n = 3){
  const cols = [color, 0xffd36a, 0xffffff, pick([0xff5a5a, 0x6ad1ff, 0x9dff6a, 0xff8ad8])];
  for (let i=0;i<n;i++) launchFirework(sc, x + (Math.random() - .5)*.25*S, y, z + (Math.random() - .5)*.25*S, S, cols, i*.32 + Math.random()*.1);
}
function launchFirework(sc, x, y, z, S, cols, delay = 0){
  const N = 150, g = new THREE.BufferGeometry(), pos = new Float32Array(N*3), col = new Float32Array(N*4);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 4));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ map: fxTex().dot, size: (S > 3 ? .034 : .1)*S, vertexColors: true, transparent: true, depthWrite: false, fog: false }));
  p.frustumCulled = false; p.visible = false; sc.add(p);
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: fxTex().spark, color: cols[0], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, opacity: 0 })); sc.add(flash);
  const H = (S > 3 ? 1.3 + Math.random()*.7 : .95 + Math.random()*.45)*S;
  FW.push({ sc, p, flash, x, y, z, S, H, t: -delay, burst: false, vel: new Float32Array(N*3), life: new Float32Array(N), base: new Float32Array(N*3), cols: cols.map(c => new THREE.Color(c)), trail: 0, ring: Math.random() < .3 });
}
function stepFireworks(dt){
  for (let i = FW.length - 1; i >= 0; i--){
    const f = FW[i]; f.t += dt; if (f.t < 0) continue;
    if (!f.sc.parent && f.sc !== boardScene && f.sc !== villageCtx?.sc){ disposeFw(f, i); continue; }
    const P = f.p.geometry.attributes.position, C = f.p.geometry.attributes.color, N = P.count, S = f.S;
    if (!f.p.visible){ f.p.visible = true; SFX.launch?.(f.S > 3); }
    const RT = .65;
    { const ft = f.t - RT; f.flash.material.opacity = ft > 0 ? .75*Math.max(0, 1 - ft/.3) : 0; f.flash.scale.setScalar(ft > 0 ? (.25 + ft*1.6)*S : .01); }
    if (f.t < RT){ // rocket climbing with a sparkly trail (particles 130..149)
      const k = f.t/RT, hy = f.y + f.H*(1 - (1 - k)*(1 - k));
      P.setXYZ(0, f.x, hy, f.z); C.setXYZW(0, 1, .85, .5, 1); f.life[0] = 1;
      if ((f.trail += dt) > .02){ f.trail = 0; const j = 130 + Math.floor(Math.random()*20); P.setXYZ(j, f.x + (Math.random() - .5)*.03*S, hy, f.z + (Math.random() - .5)*.03*S); f.vel.set([(Math.random() - .5)*.1*S, -.25*S, (Math.random() - .5)*.1*S], j*3); f.life[j] = .45; f.base.set([1, .6, .25], j*3); }
    } else if (!f.burst){ // burst
      f.burst = true; f.life[0] = 0; C.setXYZW(0, 0, 0, 0, 0);
      const cx = P.getX(0), cy = P.getY(0), cz = P.getZ(0); f.flash.position.set(cx, cy, cz);
      const sp = (S > 3 ? 1.15 : 1.5)*(1 + Math.random()*.4)*S;
      for (let j=1;j<130;j++){
        let vx, vy, vz;
        if (f.ring){ const a = j/129*Math.PI*2; vx = Math.cos(a); vy = Math.sin(a)*.35 + .15; vz = Math.sin(a); }
        else { const u = Math.random()*2 - 1, a = Math.random()*6.28, r = Math.sqrt(1 - u*u); vx = r*Math.cos(a); vy = u; vz = r*Math.sin(a); }
        const m = sp*(.75 + Math.random()*.3);
        f.vel.set([vx*m, vy*m, vz*m], j*3); P.setXYZ(j, cx, cy, cz); f.life[j] = 1.2 + Math.random()*.7;
        const c = f.cols[j % 3 === 0 ? 0 : Math.floor(Math.random()*f.cols.length)]; f.base.set([c.r, c.g, c.b], j*3);
      }
      SFX.boom?.(f.S > 3);
    }
    let alive = f.t < RT;
    for (let j=1;j<N;j++){
      if (f.life[j] <= 0){ C.setW(j, 0); continue; }
      alive = true; f.life[j] -= dt;
      const v = f.vel, o = j*3, drag = Math.pow(.18, dt);
      v[o] *= drag; v[o + 1] = v[o + 1]*drag - .55*S*dt; v[o + 2] *= drag;
      P.setXYZ(j, P.getX(j) + v[o]*dt, P.getY(j) + v[o + 1]*dt, P.getZ(j) + v[o + 2]*dt);
      const l = Math.max(0, Math.min(1, f.life[j]/1.1)), tw = j < 130 && f.life[j] < .6 ? (Math.random() < .5 ? .3 : 1) : 1;
      C.setXYZW(j, f.base[o], f.base[o + 1], f.base[o + 2], l*tw);
    }
    P.needsUpdate = true; C.needsUpdate = true;
    if (!alive && f.t > RT + .2) disposeFw(f, i);
  }
}
function disposeFw(f, i){ f.sc.remove(f.p); f.sc.remove(f.flash); f.flash.material.dispose(); f.p.geometry.dispose(); f.p.material.dispose(); FW.splice(i, 1); }

