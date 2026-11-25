// ================= 3D PARCHMENT MESSAGES =================
// action scrolls live in the top corner the player signs leave free (where the title used to be)
// ================= ACTION MESSAGES: who · what (as a 3D model) · result, in a small dark box =================
const avURL = new Map(); const avatarImg = id => avURL.get(id) || (avURL.set(id, avatarURL(id || 'campesino')), avURL.get(id));
const iconURL = new Map(); const iconImg = k => { if (!iconURL.has(k)){ const c = iconSnap(k); iconURL.set(k, c ? c.toDataURL() : ''); } return iconURL.get(k); };
function actionSpec(html, color){
  // who acts: the player whose color the message carries, otherwise whoever's turn it is (the thief, the bank…)
  let p = G ? G.players.findIndex(P => P.color === color) : -1; if (p < 0 && G && !G.setup && G.players[G.current]) p = G.current;
  const tmp = document.createElement('div'); tmp.innerHTML = html; const txt = tmp.textContent.replace(/\s+/g, ' ').trim();
  // items with amounts: a number written just before an item counts as its amount
  const itemsIn = root => { const o = {}; root.querySelectorAll('[data-k]').forEach(n => { const k = n.dataset.k; if (k.startsWith('ic:') || !(RES.includes(k) || SPECIAL[k])) return; const prev = n.previousSibling, m = prev && prev.nodeType === 3 ? prev.textContent.match(/(\d+)\s*$/) : null; o[k] = (o[k] || 0) + (m ? +m[1] : 1); }); return o; };
  const items = itemsIn(tmp);
  const others = G ? G.players.map((P, i) => i).filter(i => i !== p && txt.includes(G.players[i].name)) : [];
  let victim = others.length ? others[0] : (p > 0 && /\b(te |ti\b|contigo)/i.test(txt) ? 0 : -1);
  const S = { p, items, victim, txt, act: 'globo', model: null, cap: '' };
  const am = AMK.find(k => txt.toLowerCase().includes(AMULETS[k].name.toLowerCase()));
  if (/ganó la partida|Ganaste/.test(txt)){ S.act = 'trofeo'; S.cap = '¡Ganó la partida!'; S.items = {}; }
  else if (/Ejército más grande/.test(txt)){ S.model = 'trofeo:army'; S.cap = 'Ejército más grande'; }
  else if (/Camino más largo/.test(txt)){ S.model = 'trofeo:road'; S.cap = 'Camino más largo'; }
  else if (/demol/i.test(txt)){ S.act = 'bomba'; S.cap = 'demolió un camino'; if (/sus caminos|tus caminos/.test(txt)) S.victim = -1; }
  else if (am && /lanz|bloque|robó|robaste|pluma|escudo/i.test(txt)){ S.act = 'amuleto'; S.amulet = am; S.cap = AMULETS[am].name; if (/escudo de roble/i.test(txt)){ S.cap = 'Escudo de roble'; S.amulet = 'escudo'; } }
  else if (/movió el ladrón|Moviste al ladrón/i.test(txt)){ S.model = 'ladron'; S.cap = 'movió al ladrón'; }
  else if (/robó|se llevó|robaste|descart/i.test(txt)){ S.act = 'cuchillo'; S.cap = /descart/.test(txt) ? 'descartó' : 'robó'; }
  else if (/construyó un camino|Construiste un camino/.test(txt)){ S.act = 'martillo'; S.piece = 'camino'; S.cap = 'construyó'; }
  else if (/fundó|Fundaste|coloc(ó|aste) su .*pueblo|coloc(ó|aste) .*pueblo/.test(txt)){ S.act = 'martillo'; S.piece = 'pueblo'; S.cap = /coloc/.test(txt) ? 'colocó' : 'fundó'; }
  else if (/coloc(ó|aste) .*camino/.test(txt)){ S.act = 'martillo'; S.piece = 'camino'; S.cap = 'colocó'; }
  else if (/convirtió|ahora es ciudad/.test(txt)){ S.act = 'martillo'; S.piece = 'ciudad'; S.cap = 'mejoró'; }
  else if (/trueque|cambió|Cambiaste|te cambió/i.test(txt)){ S.act = 'flechas'; S.cap = 'trueque';
    // a trade reads: who proposes · what they give · ⇄ · what they ask · who they ask it of (a player, the bank, a port)
    const parts = html.split(/ por | y recibiste /);
    if (parts.length >= 2){ const a = document.createElement('div'), b = document.createElement('div'); const head = parts[0], first = head.search(/<img|<span class="m3"/), colon = (first >= 0 ? head.slice(0, first) : head).lastIndexOf(':'); a.innerHTML = colon >= 0 ? head.slice(colon + 1) : head; b.innerHTML = parts.slice(1).join(' por ');   // after the last ':' of the words (images carry ':' in their data)
      const give = itemsIn(a), want = itemsIn(b);
      if (Object.keys(give).length && Object.keys(want).length){ S.trade = { give, want, place: /pirata/.test(txt) ? 'Pirata' : /puerto/.test(txt) ? 'Puerto' : /banco/.test(txt) ? 'Banco' : null }; if (S.trade.place) S.victim = -1; if (/Propusiste/.test(txt)) S.victim = -1; } } }
  else if (/sacó|Sacaste/.test(txt)){ const n = (txt.match(/sac(?:ó|aste) (\d+)/) || [])[1]; S.act = 'dado'; S.cap = n ? 'sacó ' + n : 'tiró'; if (/7/.test(n || '') && /ladrón/.test(txt)) S.cap = 'sacó 7: ¡ladrón!'; }
  else if (/compró una carta|Compraste una carta/.test(txt)){ S.model = 'carta'; S.cap = 'compró carta'; }
  else if (/jugó|usó|Jugaste|Usaste/.test(txt)){ S.model = 'carta'; S.cap = 'jugó carta'; }
  else if (/recib|ncontr|regalo|tomó|entreg/i.test(txt)){ S.act = 'flecha'; S.cap = /entreg/i.test(txt) ? 'misión cumplida' : 'consiguió'; }
  if (/se llevó/.test(txt) && p !== 0) S.victim = 0;                 // the thief took it from you
  if (S.act === 'dado' && Object.keys(S.items).length && p !== 0 && /recib/.test(txt)) S.victim = 0;   // what you got from someone else's roll
  if (S.victim === S.p) S.victim = -1;
  if (!S.cap) S.cap = txt.length > 34 ? txt.slice(0, 32) + '…' : txt;
  return S;
}
function actModelObj(S){
  if (S.model === 'trofeo:army') return trophyModel('army'); if (S.model === 'trofeo:road') return trophyModel('road');
  if (S.model === 'carta'){ const g = cardMesh(); const col = S.p >= 0 ? G.players[S.p].color : null; g.traverse(o => { if (o.isMesh && Array.isArray(o.material)) o.material = o.material.map((m, k) => k >= 4 ? keepMat(new THREE.MeshStandardMaterial({ map: cardBackTex(col), roughness: .8 })) : m); }); return g; }
  if (S.model) return modelObj(S.model, S.p >= 0 ? S.p : 0);
  if (S.act === 'amuleto') return amuletModel(S.amulet);
  return iconModel(S.act);
}
const whoHTML = (p, cls = '') => { const P = p >= 0 ? G.players[p] : null; return `<div class="aw ${cls}"><img src="${P ? avatarImg(P.avatar) : iconImg('pergamino')}" style="--pc:${P ? P.color : '#8a6a3a'}"><b>${P ? P.name : 'Catroan'}</b></div>`; };
const itemsHTML = (items, live) => Object.entries(items).slice(0, 4).map(([k, n]) => `<span class="ai">${live ? `<span class="m3" data-k="${k}"></span>` : (RES.includes(k) ? resImg(k) : specImg(k))}${n > 1 ? `<em>×${n}</em>` : ''}</span>`).join('');
const ACT = { el: null, views: [] };
function nextScroll(){
  const m = SCR.q.shift();
  if (!m){ SCR.busy = false; const w = SCR.wait; SCR.wait = []; w.forEach(f => f()); return; }
  SCR.busy = true;
  let el = ACT.el; if (!el){ el = ACT.el = document.createElement('div'); el.id = 'actbox'; document.body.appendChild(el); }
  ACT.views.forEach(v => v.alive = false); ACT.views = [];
  const S = m.spec || actionSpec(m.html, m.color), hasItems = Object.keys(S.items).length;
  // always the same order: who · what (model) · with what (resources or the piece) · → to whom
  const late = S.act === 'amuleto' ? 'late' : '', what = S.piece ? `<div class="aitems"><span class="ai"><span class="m3 pz" data-k="pz:${S.piece}:${S.p}"></span></span></div>` : hasItems ? `<div class="aitems ${late}">${itemsHTML(S.items, true)}</div>` : '';
  const res = what + (S.victim >= 0 ? `<span class="aarrow ${late}">${ic('flecha')}</span>${whoHTML(S.victim, 'victim ' + late)}` : '');
  el.style.setProperty('--pc', m.color);
  if (S.trade){ const T = S.trade, to = S.victim >= 0 ? whoHTML(S.victim, 'victim') : T.place ? `<div class="aw place"><img src="${iconImg(T.place === 'Banco' ? 'moneda' : 'ancla')}" style="--pc:#8a6a3a"><b>${T.place}</b></div>` : '';
    el.innerHTML = `${whoHTML(S.p)}<div class="aitems">${itemsHTML(T.give, true)}</div><div class="aact"><canvas></canvas><small>trueque</small></div><div class="aitems">${itemsHTML(T.want, true)}</div>${to}`; }
  else el.innerHTML = `${whoHTML(S.p)}<div class="aact"><canvas></canvas><small>${S.cap}</small></div>${res}`;
  el.classList.toggle('left', CORNER_SIDE === 'l');
  if (miniInit()){ const o = spinner(actModelObj(S), 1.15); const v = miniView(el.querySelector('.aact canvas'), { w: 58, h: 58, res: 1, fov: 30, fps: 30, tick: dt => { o.userData.inner.rotation.y += dt*1.5; } }); v.sc.add(o); v.cam.position.set(0, .35, 2.5); v.cam.lookAt(0, 0, 0); ACT.views.push(v); }
  el.classList.remove('out'); el.classList.add('in'); SFX.scroll?.();
  if (el.querySelector('.late')) setTimeout(() => el.querySelectorAll('.late').forEach(n => n.classList.add('show')), 1100);
  const hold = ((SCR.q.length > 2 ? 1700 : 3200) + (el.querySelector('.late') ? 1000 : 0))*(window.__slowAct || 1);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.classList.remove('in'); setTimeout(nextScroll, 80); }, 320); }, hold);
}
