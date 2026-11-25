// ================= FACETED NOTICE BOX: dark, low-poly, just above the action buttons =================
const PB = { el: null, tip: null, prev: null, note: null, ask: null, t: 0 };
// dark pixel tile: slanted "brick" strokes in near-black, olive and deep teal (CloverPit-like)
function pbTex(){
  const W = 96, H = 32, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d'), R = mulberry32(777);
  c.fillStyle = '#0d0f12'; c.fillRect(0, 0, W, H);
  const pal = ['#15181c', '#1b1d1a', '#22211a', '#262418', '#14201f', '#18262a', '#1d2a24', '#2a2618'];
  for (let k=0;k<70;k++){ const x0 = Math.floor(R()*W), y0 = Math.floor(R()*H), len = 4 + Math.floor(R()*9), h = 1 + Math.floor(R()*2), col = pal[Math.floor(R()*pal.length)];
    c.fillStyle = col; for (let y=0;y<h + 1;y++) for (let x=0;x<len;x++){ const px = (x0 + x + (h - y)) % W, py = (y0 + y) % H; if (y === h && R() < .5) continue; c.fillRect(px, py, 1, 1); } }
  return cv.toDataURL();
}
function pbEnsure(){
  if (PB.el) return PB.el;
  document.documentElement.style.setProperty('--pbtex', `url(${pbTex()})`);
  const el = document.createElement('div'); el.id = 'pbox'; el.innerHTML = '<div class="pb pbask"></div><div class="pb pbnote"></div><div class="pb pbtip" id="pb-tip"></div>'; document.body.appendChild(el);
  PB.el = el; PB.ask = el.querySelector('.pbask'); PB.note = el.querySelector('.pbnote'); PB.tip = el.querySelector('.pbtip');
  addEventListener('resize', pbPlace); return el;
}
// sits right above the action buttons (or low on the screen when they are hidden)
function pbPlace(){
  if (!PB.el) return; const hb = $('#hexbar'), hc = hb && hb.querySelector('canvas'), r = hb && hc && getComputedStyle(hb).display !== 'none' ? hc.getBoundingClientRect() : null;
  const base = SHOW.kind ? 70*UI_S : r && r.height > 4 && mode === 'board' ? innerHeight - (r.top + r.height*.13) : mode === 'market' ? 74*UI_S : 96*UI_S;
  PB.el.style.bottom = Math.round(base) + 'px';
}
// item images inside a box become small spinning 3D models
// every icon span that appears anywhere gets mounted on the next frame
let M3Q = false; const M3OBS = new MutationObserver(() => { if (M3Q) return; M3Q = true; requestAnimationFrame(() => { M3Q = false; const list = document.querySelectorAll('span.m3[data-k]:not([data-m])'); if (list.length) mount3D(document.body); }); });
addEventListener('DOMContentLoaded', () => M3OBS.observe(document.body, { childList: true, subtree: true })); if (document.body) M3OBS.observe(document.body, { childList: true, subtree: true });
function mount3D(root, size = 32){
  if (!miniInit()) return;
  root.querySelectorAll(root === document.body ? 'span.m3[data-k]:not([data-m])' : 'img[data-k], span.m3[data-k]:not([data-m])').forEach(n => {
    if (n.dataset.m) return;
    const k = n.dataset.k, sp = n.tagName === 'SPAN' ? n : document.createElement('span'); if (sp !== n) sp.className = 'm3' + (n.classList.contains('big') ? ' big' : ''); sp.dataset.k = k; sp.dataset.m = 1; sp.innerHTML = ''; const cv = document.createElement('canvas'); sp.appendChild(cv); if (sp !== n) n.replaceWith(sp);
    const fs = parseFloat(getComputedStyle(sp).fontSize) || 14, sz = sp.classList.contains('big') ? 46 : (sp.offsetWidth || Math.round(fs*1.6)) || size;
    let model = null; try { model = k.startsWith('pz:') ? modelObj(k.split(':')[1], +k.split(':')[2] || 0) : k.startsWith('ic:') ? iconModel(k.slice(3)) : AMULETS[k] ? amuletModel(k) : k === 'punto' ? cardModel('punto') : (RES.includes(k) || SPECIAL[k]) ? itemOf(k) : null; } catch (err) { model = null; } if (!model) return;
    const o = spinner(model, 1.1), ph = Math.random()*6; o.userData.inner.rotation.y = ph;
    const v = miniView(cv, { w: sz, h: sz, res: .9, fov: 30, fps: 24, tick: dt => { o.userData.inner.rotation.y += dt*1.6; } }); v.sc.add(o); v.cam.position.set(0, .35, 2.5); v.cam.lookAt(0, 0, 0);
  });
}
function pbShow(box, html, ms){
  pbEnsure(); pbPlace(); clearTimeout(box._t); box.innerHTML = deEmo(html); mount3D(box); box.classList.add('on'); void box.offsetWidth; box.classList.add('in'); document.body.classList.add('pbon');
  if (ms) box._t = setTimeout(() => pbHide(box), ms);
  return box;
}
function pbHide(box){ if (!box) return; clearTimeout(box._t); box.classList.remove('in'); box._t = setTimeout(() => { box.classList.remove('on'); box.innerHTML = ''; if (!PB.el.querySelector('.pb.on')) document.body.classList.remove('pbon'); }, 260); }
// a system notice (not a player's action): bottom box, a few seconds
function sysNote(html, o = {}){
  const av = o.av ? `<img class="pbav" src="${o.av}">` : '';
  return pbShow(PB.note || (pbEnsure(), PB.note), `${av}<div class="pbtx">${html}</div>`, o.ms === 0 ? 0 : (o.ms || 3800));
}
// a dialog with buttons in the same box; resolves with the key of the button pressed
function pbAsk(html, o = {}){
  return new Promise(res => {
    const av = o.av ? `<img class="pbav" src="${o.av}">` : '';
    const box = pbShow(PB.ask || (pbEnsure(), PB.ask), `${av}<div class="pbtx">${html}<div class="pbbtn">${(o.btns || [{ t: 'Entendido', k: 'ok', ok: true }]).map(b => `<button data-k="${b.k}" class="${b.ok ? 'ok' : ''}">${b.t}</button>`).join('')}</div></div>`, 0);
    box.onclick = e => { const b = e.target.closest('button[data-k]'); if (!b) return; e.stopPropagation(); SFX.click?.(); box.onclick = null; pbHide(box); res(b.dataset.k); };
  });
}
function setupTip(html){ pbEnsure(); PB.tipBase = html; PB.prevHtml = ''; renderTip(); }
function renderTip(){ document.body.classList.toggle('pbtip', !!PB.tipBase); if (!PB.tipBase){ pbHide(PB.tip); return; } pbShow(PB.tip, `<div class="pbtx">${PB.tipBase}${PB.prevHtml ? `<div class="pbprev">${PB.prevHtml}</div>` : ''}</div>`, 0); }
// entering a village: who lives here and what it produces, 3 seconds
function villageNote(v){
  if (!v || !v.building || !villageCtx) return;
  const P = G.players[v.building.p], prod = v.tiles.map(ti => { const t = G.tiles[ti], r = TERRAIN[t.type].res; return r && t.num ? `<span class="pc"><span class="m3" data-k="${r}"></span><em class="${t.num === 6 || t.num === 8 ? 'hot' : ''}">${t.num}<small>${'•'.repeat(pips(t.num))}</small></em></span>` : ''; }).join('');
  sysNote(`<i style="--c:${P.color}"></i><b>${v.name}</b> · ${ownerLabel(v)} · ${villageCtx.people.length} habitantes${connCount(v.id) ? ` · conectado con ${connCount(v.id)}` : ''}${v.port ? ` · ⚓ puerto ${v.port === '3:1' ? '3:1' : '2:1 ' + resImg(v.port)}` : ''}<div class="pbprev">${prod}</div>`, { ms: 3000 });
}
