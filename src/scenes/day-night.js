// ================= DAY / NIGHT ENVIRONMENT =================
// distant mountain ranges beyond the playable land (hazed toward the horizon colour)
function mountainRing(R, depth, hMin, hMax, seed, snow){
  const N = 200, rows = [0, .35, .62, .84, 1], pos = [];
  const H = a => { const n = fbm(Math.cos(a)*2.4 + seed, Math.sin(a)*2.4 - seed, seed), m = 1 - Math.abs(vnoise(Math.cos(a)*6 + seed*2, Math.sin(a)*6, seed + 5)*2 - 1); return hMin + (hMax - hMin)*Math.pow(n*.65 + m*.35, 1.6); };
  const pt = (i, k) => { const a = i/N*Math.PI*2, h = H(a), f = rows[k], rr = R - f*depth*(h/hMax) + (hash2(i, k, seed) - .5)*6; const y = -25 + f*(h + 25) + (k > 0 && k < rows.length - 1 ? (hash2(i, k + 9, seed) - .5)*h*.12 : 0); return [Math.cos(a)*rr, y, Math.sin(a)*rr]; };
  for (let i=0;i<N;i++) for (let k=0;k<rows.length - 1;k++){ const a = pt(i, k), b = pt(i + 1, k), c = pt(i, k + 1), d = pt(i + 1, k + 1); pos.push(...a, ...c, ...b, ...b, ...c, ...d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  colorize(g, (x, y, z, r, ny) => jc(snow && y > hMax*.62 && ny > .35 ? 0xeef2f6 : y > hMax*.35 ? (ny < .6 ? 0x6e7480 : 0x80868f) : (ny > .7 ? 0x55704a : 0x66707a), r, .07), mulberry32(seed));
  return g;
}
function farMountains(sc, cx, cz, seed){
  const out = [];
  [[460, 70, 35, 120, .42, false], [600, 90, 80, 220, .68, true]].forEach(([R, dep, h0, h1, haze, snow], i) => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, fog: false, side: THREE.DoubleSide });
    const me = new THREE.Mesh(mountainRing(R, dep, h0, h1, seed + i*17, snow), m); me.position.set(cx, 0, cz); me.frustumCulled = false; me.renderOrder = -5; sc.add(me);
    out.push({ m, haze });
  });
  return out;
}
const DAY = { t: .33, speed: 1/480, target: null, fixed: false };
try { DAY.fixed = localStorage.getItem('hexterra-cycle') === 'off'; } catch {}
const PAL = {
  day:   { top: new THREE.Color(0x3a72ad), hor: new THREE.Color(0xb3cce2), sun: new THREE.Color(0xfff3dc), hs: new THREE.Color(0xe2f0ff), hg: new THREE.Color(0x8f7f5c) },
  dusk:  { top: new THREE.Color(0x4a58a8), hor: new THREE.Color(0xffb27a), sun: new THREE.Color(0xff9c55), hs: new THREE.Color(0xffd2b0), hg: new THREE.Color(0x6a4a3a) },
  night: { top: new THREE.Color(0x060b20), hor: new THREE.Color(0x1b2850), sun: new THREE.Color(0x9ab0ff), hs: new THREE.Color(0x3a4a7a), hg: new THREE.Color(0x15151f) },
};
const ENV_STATE = { dayF: 1, nightF: 0, duskF: 0 };
function glowTex(inner='rgba(255,255,255,1)', mid='rgba(255,240,200,.5)'){
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  const gr = c.createRadialGradient(64,64,0,64,64,64); gr.addColorStop(0, inner); gr.addColorStop(.25, mid); gr.addColorStop(1, 'rgba(255,240,200,0)');
  c.fillStyle = gr; c.fillRect(0,0,128,128); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const GLOW_TEX = glowTex(), SOFT_TEX = glowTex('rgba(255,255,255,1)', 'rgba(255,255,255,.35)');
function makeEnv(sc, opts={}){
  const R = 700;
  const sky = skyDome(0x4f9fe0, 0xcfeaff, 0x9ccbe8, R); sc.add(sky); sc.userData.sky = sky;
  const sp = sky.geometry.attributes.position, yN = new Float32Array(sp.count);
  for (let i=0;i<sp.count;i++) yN[i] = sp.getY(i)/R;
  const hemi = new THREE.HemisphereLight(0xdcefff, 0x8a7a5a, 1.35); sc.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe9c6, 2.4); sc.add(sun); sc.add(sun.target);
  if (opts.shadow){ sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left:-40, right:40, top:40, bottom:-40, near:1, far:220 }); sun.shadow.bias = -.0006; sun.shadow.normalBias = .02; }
  const fill = new THREE.DirectionalLight(0xbfd8ff, .35); sc.add(fill); sc.add(fill.target);
  const sunSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_TEX, color: 0xfff2c8, fog: false, depthWrite: false, transparent: true }));
  sunSpr.scale.setScalar(150); sky.add(sunSpr);
  const moonSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: SOFT_TEX, color: 0xdfe8ff, fog: false, depthWrite: false, transparent: true }));
  moonSpr.scale.setScalar(60); sky.add(moonSpr);
  // stars
  const N = 700, sg2 = new THREE.BufferGeometry(), spos = new Float32Array(N*3), rs = mulberry32(42);
  for (let i=0;i<N;i++){ const az = rs()*6.28, el = Math.asin(rs()*.98 + .02), r = R*.92; spos[i*3] = Math.cos(az)*Math.cos(el)*r; spos[i*3+1] = Math.sin(el)*r; spos[i*3+2] = Math.sin(az)*Math.cos(el)*r; }
  sg2.setAttribute('position', new THREE.BufferAttribute(spos, 3));
  const stars = new THREE.Points(sg2, new THREE.PointsMaterial({ color: 0xfff6e0, size: 1, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
  stars.frustumCulled = false; sky.add(stars);
  // fireflies
  let flies = null;
  if (opts.fireflies){
    const F = 140, fg = new THREE.BufferGeometry(), fpos = new Float32Array(F*3);
    for (let i=0;i<F;i++){ fpos[i*3] = (Math.random() - .5)*70; fpos[i*3+1] = .4 + Math.random()*2.5; fpos[i*3+2] = (Math.random() - .5)*70; }
    fg.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
    flies = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xd9ff7a, size: .22, map: GLOW_TEX, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    flies.frustumCulled = false; sc.add(flies); flies.userData.base = Float32Array.from(fpos); flies.userData.gh = GH;
  }
  // warm point lights at a few lanterns
  const lights = (opts.lights || []).slice(0, 4).map(([x, y, z]) => { const l = new THREE.PointLight(0xffb060, 0, 18, 1.6); l.position.set(x, y, z); sc.add(l); return l; });
  const far = opts.far ? farMountains(sc, opts.far[0], opts.far[1], opts.far[2]) : [];
  const env = { sc, far, sky, yN, hemi, sun, fill, sunSpr, moonSpr, stars, flies, lights, shadow: !!opts.shadow, fogNear: opts.fogNear || 90, fogFar: opts.fogFar || 330, warm: opts.warm || 0 };
  sc.userData.env = env;
  applyEnv(env, 0, 0);
  return env;
}
const _c1 = new THREE.Color(), _c2 = new THREE.Color(), _c3 = new THREE.Color(), _top = new THREE.Color(), _hor = new THREE.Color(), _bot = new THREE.Color(), _v = new THREE.Vector3(), _ld = new THREE.Vector3();
function mixPal(key, dayF, duskF, out){ out.copy(PAL.night[key]).lerp(PAL.day[key], dayF).lerp(PAL.dusk[key], duskF); return out; }
function applyEnv(env, dt, t){
  const th = (DAY.t - .25)*Math.PI*2, el = Math.sin(th);
  const dayF = smoothstep(-.12, .22, el), nightF = 1 - smoothstep(-.22, .02, el), duskF = Math.max(0, 1 - Math.abs(el - .04)/.3)*.9 + env.warm*.3*(dayF);
  ENV_STATE.dayF = dayF; ENV_STATE.nightF = nightF; ENV_STATE.duskF = duskF;
  const sunDir = _v.set(Math.cos(th), Math.sin(th), .35).normalize();
  mixPal('top', dayF, Math.min(1, duskF), _top); mixPal('hor', dayF, Math.min(1, duskF), _hor);
  _bot.copy(_hor).multiplyScalar(.82);
  const col = env.sky.geometry.attributes.color, yN = env.yN;
  for (let i=0;i<yN.length;i++){ const y = yN[i]; if (y >= 0) _c1.copy(_hor).lerp(_top, Math.pow(y, .5)); else _c1.copy(_hor).lerp(_bot, Math.min(1, -y*4)); col.setXYZ(i, _c1.r, _c1.g, _c1.b); }
  // glow around the sun near the horizon
  col.needsUpdate = true;
  env.sc.background.copy(_hor); env.sc.fog.color.copy(_hor);
  env.sc.fog.near = env.fogNear*(.55 + .45*dayF); env.sc.fog.far = env.fogFar*(.65 + .35*dayF);
  const up = el > -.05;
  if (up) _ld.copy(sunDir); else _ld.copy(sunDir).negate();
  if (_ld.y < .18){ _ld.y = .18; _ld.normalize(); }
  const cam = camera.position;
  env.sun.target.position.set(cam.x, 0, cam.z);
  env.sun.position.set(cam.x + _ld.x*100, _ld.y*100, cam.z + _ld.z*100);
  env.fill.target.position.set(cam.x, 0, cam.z); env.fill.position.set(cam.x - _ld.x*60, 40, cam.z - _ld.z*60);
  if (up){ env.sun.color.copy(PAL.day.sun).lerp(PAL.dusk.sun, Math.min(1, duskF)); env.sun.intensity = .25 + 2.3*smoothstep(-.05, .3, el); }
  else { env.sun.color.copy(PAL.night.sun); env.sun.intensity = .5*smoothstep(.0, .25, -el); }
  mixPal('hs', dayF, Math.min(1, duskF), env.hemi.color); mixPal('hg', dayF, Math.min(1, duskF), env.hemi.groundColor);
  env.hemi.intensity = .5 + 1.05*dayF;
  env.fill.intensity = .1 + .25*dayF;
  env.sunSpr.position.copy(sunDir).multiplyScalar(600); env.sunSpr.material.opacity = smoothstep(-.15, .05, el);
  env.sunSpr.material.color.copy(PAL.day.sun).lerp(PAL.dusk.sun, Math.min(1, duskF*1.2));
  env.sunSpr.scale.setScalar(120 + duskF*90);
  env.moonSpr.position.copy(sunDir).multiplyScalar(-600); env.moonSpr.position.y = Math.max(env.moonSpr.position.y, 80); env.moonSpr.material.opacity = nightF*.95;
  env.stars.material.opacity = nightF;
  env.far.forEach(f => { f.m.color.setRGB(1, 1, 1).lerp(_hor, f.haze); f.m.emissive.copy(_hor).multiplyScalar(f.haze*.45); });
  WIN_MAT.emissiveIntensity = nightF*1.25 + duskF*.25;
  LAMP_MAT.emissiveIntensity = .5 + nightF*2.6;
  env.lights.forEach(l => l.intensity = nightF*30);
  if (env.flies){
    env.flies.material.opacity = nightF*.95;
    if (nightF > .01){
      const a = env.flies.geometry.attributes.position.array, b = env.flies.userData.base;
      for (let i=0;i<a.length;i+=3){
        a[i] = b[i] + Math.sin(t*.6 + i)*1.5; a[i+2] = b[i+2] + Math.cos(t*.5 + i*1.3)*1.5; a[i+1] = b[i+1] + Math.sin(t*1.3 + i*.7)*.4;
        const dx = a[i] - cam.x, dz = a[i+2] - cam.z;
        if (dx > 35) b[i] -= 70; else if (dx < -35) b[i] += 70;
        if (dz > 35) b[i+2] -= 70; else if (dz < -35) b[i+2] += 70;
      }
      env.flies.geometry.attributes.position.needsUpdate = true;
    }
  }
}
function dayLabel(){
  const h = (DAY.t*24) % 24, hh = Math.floor(h), mm = Math.floor((h - hh)*60/15)*15;
  const ph = h < 5 ? ['luna','Noche'] : h < 7.5 ? ['amanecer','Amanecer'] : h < 11.5 ? ['sol','Mañana'] : h < 14 ? ['sol','Mediodía'] : h < 17 ? ['nube','Tarde'] : h < 19.5 ? ['amanecer','Atardecer'] : ['luna','Noche'];
  return [ph[0], `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')} · ${ph[1]}`];
}
function advanceDay(dt){
  if (DAY.fixed){ const d = .42 - DAY.t; DAY.t += Math.abs(d) < .002 ? d : Math.sign(d)*Math.min(Math.abs(d), dt*.2); DAY.target = null; return; }   // cycle off: stays in a bright late morning
  if (DAY.target !== null){
    let diff = DAY.target - DAY.t; if (diff < 0) diff += 1;
    const step = Math.min(diff, dt*.12);
    if (DAY.t + step >= 1) DAY.n = (DAY.n || 0) + 1; DAY.t = (DAY.t + step) % 1;
    if (diff - step < 1e-4) DAY.target = null;
  } else { const nt = DAY.t + dt*DAY.speed; if (nt >= 1) DAY.n = (DAY.n || 0) + 1; DAY.t = nt % 1; }
}
function skipToNextPhase(){
  const stops = [.27, .5, .74, .9];
  const cur = DAY.t; let next = stops.find(s => s > cur + .01); if (next === undefined) next = stops[0];
  DAY.target = next;
}

