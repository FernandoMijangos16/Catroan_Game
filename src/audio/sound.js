// ================= SOUND (synthesized with Web Audio) =================
const SND = { ctx: null, on: true, master: null, nextBird: 2, nextNote: 1, nextBell: 40, step: 0, lastDing: 0, noteI: 0 };
try { SND.on = localStorage.getItem('hexterra-sound') !== 'off'; } catch {}
function audioInit(){
  if (SND.ctx){ if (SND.ctx.state === 'suspended') SND.ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  try { SND.ctx = new AC(); } catch { return; }
  const c = SND.ctx;
  SND.master = c.createGain(); SND.master.gain.value = SND.on ? .8 : 0;
  const comp = c.createDynamicsCompressor(); SND.master.connect(comp); comp.connect(c.destination);
  const nb = c.createBuffer(1, c.sampleRate*2, c.sampleRate), d = nb.getChannelData(0);
  for (let i=0;i<d.length;i++) d[i] = Math.random()*2 - 1;
  SND.noise = nb;
  // echo bus
  SND.fx = c.createDelay(1); SND.fx.delayTime.value = .31;
  const fb = c.createGain(); fb.gain.value = .33; const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2500;
  SND.fx.connect(lp); lp.connect(fb); fb.connect(SND.fx); const fxo = c.createGain(); fxo.gain.value = .45; lp.connect(fxo); fxo.connect(SND.master);
  const bed = (type, freq, q) => { const s = c.createBufferSource(); s.buffer = nb; s.loop = true; s.playbackRate.value = .6 + Math.random()*.2; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(SND.master); s.start(); return { g, f }; };
  SND.wind = bed('bandpass', 420, .7);
  SND.sea = bed('lowpass', 520, .5);
  // crickets: a tone gated by a fast square wave
  const co = c.createOscillator(); co.type = 'triangle'; co.frequency.value = 4400;
  const gate = c.createGain(); gate.gain.value = 0;
  const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 18; const lg = c.createGain(); lg.gain.value = .5;
  lfo.connect(lg); lg.connect(gate.gain);
  const cg = c.createGain(); cg.gain.value = 0; co.connect(gate); gate.connect(cg); cg.connect(SND.master); co.start(); lfo.start();
  SND.crick = { g: cg, gate };
  // sawmill buzz
  const so = c.createOscillator(); so.type = 'sawtooth'; so.frequency.value = 118; const so2 = c.createOscillator(); so2.type = 'sawtooth'; so2.frequency.value = 237;
  const sf = c.createBiquadFilter(); sf.type = 'bandpass'; sf.frequency.value = 1100; sf.Q.value = 1.5; const sgn = c.createGain(); sgn.gain.value = 0;
  so.connect(sf); so2.connect(sf); sf.connect(sgn); sgn.connect(SND.master); so.start(); so2.start();
  SND.saw = { g: sgn };
}
function setSound(on){
  SND.on = on; try { localStorage.setItem('hexterra-sound', on ? 'on' : 'off'); } catch {}
  if (SND.master) SND.master.gain.setTargetAtTime(on ? .8 : 0, SND.ctx.currentTime, .1);
}
const sndOk = () => SND.ctx && SND.on && SND.ctx.state === 'running';
function tone(freq, dur, type='sine', vol=.2, o={}){
  if (!sndOk()) return;
  const c = SND.ctx, t0 = c.currentTime + (o.delay || 0), a = o.a || .008;
  const osc = c.createOscillator(); osc.type = type; osc.frequency.setValueAtTime(freq, t0);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + (o.glide || dur));
  if (o.vib){ const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg); lg.connect(osc.frequency); l.start(t0); l.stop(t0 + a + dur + .1); }
  const g = c.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), t0 + a); g.gain.exponentialRampToValueAtTime(.0001, t0 + a + dur);
  let n = osc; if (o.lp){ const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; osc.connect(f); n = f; }
  n.connect(g); g.connect(SND.master); if (o.fx) g.connect(SND.fx);
  osc.start(t0); osc.stop(t0 + a + dur + .05);
}
function noiseHit(dur, vol, freq, type='lowpass', delay=0, q=1){
  if (!sndOk()) return;
  const c = SND.ctx, t0 = c.currentTime + delay;
  const s = c.createBufferSource(); s.buffer = SND.noise; s.playbackRate.value = .8 + Math.random()*.4;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(Math.max(.0002, vol), t0 + .005); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  s.connect(f); f.connect(g); g.connect(SND.master); s.start(t0, Math.random()*1.5); s.stop(t0 + dur + .05);
}
const distVol = (x, z, far=45) => { const d = Math.hypot(x - camera.position.x, z - camera.position.z); return Math.pow(clamp(1 - d/far, 0, 1), 2); };
const SFX = {
  ding(){ const n = performance.now(); if (n - SND.lastDing < 350) return; SND.lastDing = n; tone(988, .22, 'sine', .07, { fx: true }); tone(1319, .35, 'sine', .06, { delay: .09, fx: true }); },
  turn(){ [659, 784, 988].forEach((f,i) => tone(f, .3, 'triangle', .07, { delay: i*.1, fx: true })); },
  dice(){ for (let i=0;i<7;i++) noiseHit(.035, .14, 2600 + Math.random()*1500, 'bandpass', i*.055 + Math.random()*.03, 3); },
  clack(v = 1){ noiseHit(.03, .12*v + .03, 2200 + Math.random()*1200, 'bandpass', 0, 3); },
  card(){ noiseHit(.12, .08, 3200, 'highpass', 0, 1); tone(660, .08, 'triangle', .03, { delay: .05 }); },
  stamp(){ noiseHit(.12, .2, 300, 'lowpass', 0, 1); tone(110, .15, 'sine', .08); },
  scroll(){ noiseHit(.18, .05, 1400, 'bandpass', 0, .7); noiseHit(.22, .04, 2400, 'bandpass', .12, .7); },
  pick(){ tone(1175, .12, 'triangle', .05, { fx: true }); tone(1760, .2, 'sine', .04, { delay: .07, fx: true }); },
  click(){ tone(880, .05, 'square', .02); },
  reveal(){ tone(523, .5, 'triangle', .05, { to: 1046, glide: .5, fx: true }); [1319, 1568, 2093].forEach((f, i) => tone(f, .35, 'sine', .035, { delay: .45 + i*.08, fx: true })); },
  whoosh(){ noiseHit(.35, .06, 1800, 'bandpass', 0, 1.5); },
  launch(big){ tone(big ? 380 : 700, .55, 'sine', big ? .025 : .018, { to: big ? 1400 : 2200, glide: .55 }); noiseHit(.5, big ? .05 : .03, 3000, 'highpass', 0, 1); },
  boom(big){ noiseHit(big ? .9 : .5, big ? .28 : .14, big ? 260 : 600, 'lowpass', 0, 1); for (let i=0;i<10;i++) noiseHit(.03, big ? .08 : .04, 4000 + Math.random()*3000, 'bandpass', .25 + Math.random()*.9, 4); },
  build(){ [0, .16, .32].forEach(d => { noiseHit(.08, .22, 500, 'lowpass', d); tone(170, .08, 'triangle', .12, { delay: d }); }); },
  robber(){ tone(130, .9, 'sawtooth', .07, { to: 70, lp: 500 }); tone(98, .9, 'sawtooth', .05, { to: 55, lp: 400, delay: .05 }); },
  trade(){ tone(1400, .08, 'square', .03, { lp: 3000 }); tone(1900, .14, 'square', .03, { lp: 3000, delay: .07 }); },
  win(){ [523, 659, 784, 1047, 784, 1047].forEach((f,i) => tone(f, i === 5 ? .9 : .22, 'triangle', .09, { delay: i*.14, fx: true })); },
  step(vol=1){ noiseHit(.07, .06*vol, 600 + Math.random()*500, 'lowpass'); },
  hoof(vol=1){ noiseHit(.05, .09*vol, 1400 + Math.random()*400, 'bandpass', 0, 2); },
  bird(vol){ const n = 2 + Math.floor(Math.random()*4), base = 2300 + Math.random()*1600; for (let i=0;i<n;i++) tone(base*(1 + Math.random()*.15), .06, 'sine', .035*vol, { to: base*1.35, delay: i*.1, fx: true }); },
  bell(vol=1){ [523.3, 1047.1, 1569, 2093, 2637].forEach((f,i) => tone(f, 2.6 - i*.4, 'sine', .06*vol/(i + 1), { a: .004, fx: true })); },
  talk(p){ const base = p.kid ? 420 : p.gender === 'f' ? 300 : 170; for (let i=0;i<5;i++) tone(base*(.85 + Math.random()*.4), .07, 'triangle', .05, { delay: i*.09, lp: 1800 }); },
  animal(kind){
    switch (kind){
      case 'vaca': tone(170, 1.1, 'sawtooth', .16, { to: 118, lp: 520, a: .15, vib: [5, 3] }); break;
      case 'oveja': tone(430, .7, 'sawtooth', .1, { to: 380, lp: 1500, a: .05, vib: [9, 28] }); break;
      case 'cerdo': [0, .2].forEach(d => tone(240, .13, 'square', .07, { to: 170, lp: 700, delay: d })); break;
      case 'gallina': [0, .12, .24].forEach(d => tone(720, .05, 'square', .04, { to: 520, lp: 1800, delay: d })); tone(900, .25, 'square', .04, { to: 600, lp: 1800, delay: .4 }); break;
      case 'perro': [0, .25].forEach(d => { noiseHit(.1, .12, 900, 'bandpass', d, 2); tone(400, .11, 'sawtooth', .12, { to: 250, lp: 1300, delay: d }); }); break;
      case 'gato': tone(520, .22, 'sawtooth', .06, { to: 820, lp: 2000 }); tone(820, .35, 'sawtooth', .06, { to: 430, lp: 2000, delay: .2 }); break;
      case 'caballo': tone(950, 1, 'sawtooth', .07, { to: 380, vib: [14, 70], lp: 2200 }); break;
      default: tone(1200, .12, 'triangle', .05, { to: 900 });
    }
  },
};
function workSound(role, x, z){
  const v = distVol(x, z, 40); if (v < .02) return;
  if (role === 'leñador'){ noiseHit(.13, .28*v, 320); tone(105, .14, 'triangle', .22*v); }
  else if (role === 'minero'){ tone(1900 + Math.random()*300, .25, 'sine', .07*v, { fx: true }); tone(2900, .18, 'sine', .04*v); noiseHit(.05, .1*v, 3000, 'highpass'); }
  else noiseHit(.14, .16*v, 260);
}
const SCALE_DAY = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3], SCALE_NIGHT = [220, 261.6, 293.7, 329.6, 392, 440, 523.3];
function updateAudio(dt, t){
  if (!SND.ctx || !SND.on) return;
  const c = SND.ctx, now = c.currentTime, out = mode !== 'board' && mode !== 'anim';
  const night = out ? ENV_STATE.nightF : 0, day = out ? ENV_STATE.dayF : 1;
  SND.wind.g.gain.setTargetAtTime((out ? .05 : .018) + Math.max(0, Math.sin(t*.13))*.035, now, .8);
  SND.wind.f.frequency.setTargetAtTime(380 + Math.sin(t*.21)*140, now, .8);
  const coast = mode === 'board' ? .55 : (villageCtx && villageCtx.types.includes('mar')) ? .8 : 0;
  SND.sea.g.gain.setTargetAtTime(coast*.09*(.55 + .45*Math.sin(t*.45)), now, .4);
  SND.crick.g.gain.setTargetAtTime(night*.012, now, 1);
  let saw = 0;
  if (mode === 'village' && villageCtx){ const s = villageCtx.sites.find(q => q.type === 'bosque'); if (s){ const [x, z] = toWorld(s.x, s.z, s.face, .5, -2); saw = distVol(x, z, 50); } }
  SND.saw.g.gain.setTargetAtTime(saw*.025*(.6 + .4*Math.sin(t*3)), now, .2);
  // birds by day, outdoors
  SND.nextBird -= dt;
  if (SND.nextBird <= 0){ SND.nextBird = 1.5 + Math.random()*4; if (day > .4) SFX.bird(out ? .8 + Math.random()*.4 : .35); }
  // gentle generative music
  SND.nextNote -= dt;
  if (SND.nextNote <= 0){
    SND.nextNote = .45 + Math.random()*.5;
    if (Math.random() < .55){
      const sc = night > .5 ? SCALE_NIGHT : SCALE_DAY;
      SND.noteI = clamp(SND.noteI + Math.floor(Math.random()*5) - 2, 0, sc.length - 1);
      tone(sc[SND.noteI], 1.4, 'triangle', .022, { a: .02, fx: true, lp: 2200 });
      if (Math.random() < .18) tone(sc[0]/2, 2.4, 'sine', .03, { a: .05 });
    }
  }
  if (mode === 'village' && villageCtx){
    SND.nextBell -= dt;
    if (SND.nextBell <= 0){ SND.nextBell = 60 + Math.random()*60; if (G.verts[villageCtx.vid].building.type === 'ciudad') SFX.bell(.8); }
  }
}

