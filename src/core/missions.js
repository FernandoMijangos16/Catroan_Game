// ================= MISSIONS =================
const QUEST_TXT = {
  brujo: ['Je, je… para mi caldero necesito {x}. A cambio, te daré algo que pocos han tocado.', 'Las estrellas me dicen que tú puedes traerme {x}. Mi amuleto será tuyo.', 'Mezclo un hechizo viejo… me falta {x}. Te pagaré con magia.'],
  dificil: ['Preparo algo grande para la fiesta del pueblo y me falta {x}.', 'El consejo me encargó reunir {x}. ¡Solo no puedo!', 'Para el remedio y la ofrenda del templo necesito {x}.'],
  flor: ['Mi hijo tiene fiebre… dicen que con {x} se prepara un buen remedio.', 'La curandera me pidió {x} para un ungüento. ¿Me ayudas?', 'Necesito {x} para un té que calma la tos del abuelo.'],
  objeto: ['Estoy preparando algo especial y me falta {x}.', 'El herrero dice que con {x} su trabajo saldría mejor.', '¿Podrías conseguirme {x}? Te recompensaré bien.'],
};
const qItems = q => q.items || { [q.item]: q.n };
// a mission can ask for objects and flowers (P.special) or for resources (P.res, the tutorial's)
const qImg = k => RES.includes(k) ? resImg(k) : specImg(k), qName = k => RES.includes(k) ? RES_NAME[k].toLowerCase() : SPECIAL[k].name;
const qListM = q => Object.entries(qItems(q)).map(([k, n]) => `<b>${n > 1 ? n + ' ' : ''}${qImg(k)} ${qName(k)}</b>`).join(' y ');
const qImgs = q => Object.entries(qItems(q)).map(([k, n]) => `${qImg(k)}${n > 1 ? '×' + n : ''}`).join(' ');
const BUFF_TXT = { halfTrade: 'Mitad de precio en el mercado (1 cambio)', randomItem: 'Un objeto al azar al iniciar tu siguiente turno', extraRes: '+1 recurso cada vez que produzcas en tu siguiente turno' };
function rewardText(r){
  if (r.type === 'res') return Object.entries(r.res).map(([k, n]) => `${n} ${resImg(k)}`).join(' ');
  if (r.type === 'buff') return '✨ ' + BUFF_TXT[r.buff];
  if (r.type === 'card') return '🃏 Una carta de desarrollo al azar';
  if (r.type === 'discount') return `🔨 Tu siguiente ${({ camino: 'camino', pueblo: 'pueblo', ciudad: 'ciudad' })[r.build]} cuesta 1 ${resImg(r.res)} menos`;
  if (r.type === 'amulet') return `🔮 Amuleto: <b>${AMULETS[r.k].name}</b>`;
  if (r.type === 'road') return `🛤️ ${r.n > 1 ? r.n + ' caminos' : 'Un camino'} de regalo (va a tus objetos)`;
  return '';
}
function assignQuestFor0(){ if (TUT.on) return; const keep = G.players.map((P, i) => i); assignQuest(0); }
// ---------- every town makes its own missions: a random timer per town, 3 to 5 an hour of play ----------
// G.playT: seconds of play (advanced by whoever is acting); G.qAt: { vid: playT when that town posts its next one }.
// A town keeps posting on its timer even while earlier ones are still open.
const QUEST_GAP = () => 720 + Math.random()*480;   // 12-20 minutes
function tickPlayTime(dt){ if (G && !G.setup && !G.over && G.phase !== 'register' && netAuth()) G.playT = (G.playT || 0) + dt; }
function villageQuests(){
  if (!G || G.over || G.setup || isClassic() || TUT.on) return;
  const now = G.playT || 0; G.qAt ||= {};
  // towns keep posting, so finished missions would pile up forever (and travel in every online state): keep the last 10
  if (G.quests){ const done = G.quests.filter(q => q.state === 'done'); if (done.length > 10){ const drop = new Set(done.slice(0, done.length - 10)); G.quests = G.quests.filter(q => !drop.has(q)); } }
  G.verts.forEach(v => { if (!v.building) return;
    if (G.qAt[v.id] === undefined){ G.qAt[v.id] = now + 300 + Math.random()*900; return; }   // a new town: its first one in 5-20 min
    if (now < G.qAt[v.id] || gameRound() <= 4) return;
    G.qAt[v.id] = now + QUEST_GAP();
    assignQuest(v.building.p, v.id); });
}
function assignQuest(force, vid){
  if (!G || G.over || G.setup || gameRound() <= 4 || isClassic()) return;
  const cands = G.players.map((P, i) => i).filter(i => G.verts.some(v => v.building && v.building.p === i) && (vid !== undefined || (G.quests || []).filter(q => q.p === i && q.state !== 'done').length < 2));
  if (!cands.length) return;
  const p = force !== undefined && cands.includes(force) ? force : pick(cands), vs = G.verts.filter(v => v.building && v.building.p === p), v = vid !== undefined && G.verts[vid] && G.verts[vid].building && G.verts[vid].building.p === p ? G.verts[vid] : pick(vs);
  const tileTypes = v.tiles.map(t => G.tiles[t].type);
  const poolOf = kind => { const all = SPK.filter(k => SPECIAL[k].kind === kind), loc = all.filter(k => !SPECIAL[k].biome || tileTypes.includes(SPECIAL[k].biome) || Math.random() < .25); return loc.length ? loc : all; };
  const brujo = Math.random() < .3, hard = !brujo && Math.random() < .25, kind = Math.random() < .5 ? 'flor' : 'objeto', items = {};
  let qkind = kind;
  if (brujo){ qkind = 'brujo'; const nt = 2 + (Math.random() < .5 ? 1 : 0); for (let k=0;k<nt;k++){ const it = pick(poolOf(k % 2 ? 'objeto' : 'flor')); items[it] = (items[it] || 0) + 1 + (Math.random() < .35 ? 1 : 0); } } else
  if (!hard){ const it = pick(poolOf(kind)); items[it] = SPECIAL[it].val >= 3 ? 1 : 1 + (Math.random() < .35 ? 1 : 0); }
  else if (Math.random() < .5){ qkind = 'dificil'; items[pick(poolOf('flor'))] = 1; items[pick(poolOf('objeto'))] = 1; }   // herb + biome item
  else { qkind = 'dificil'; const pool = poolOf(kind); for (let k=0;k<4;k++){ const it = pick(pool); items[it] = (items[it] || 0) + 1; } }   // more than 3 things
  const ROLES = { brujo: ['brujo'], flor: ['anciano', 'campesino', 'panadero', 'pastor', 'vecino'], objeto: ['herrero', 'alfarero', 'comerciante', 'leñador', 'minero'], dificil: ['comerciante', 'anciano', 'herrero', 'vecino'] };
  const role = pick(ROLES[qkind]), gender = Math.random() < .5 ? 'f' : 'm';
  const val = Object.entries(items).reduce((s2, [k, n]) => s2 + SPECIAL[k].val*n, 0);
  const reward = qkind === 'brujo' ? { type: 'amulet', k: pick(AMK) } : qkind === 'dificil' ? { type: 'road', n: 1 } : kind === 'flor' ? (() => { const res = {}; for (let i=0;i<1 + val;i++){ const r = pick(RES); res[r] = (res[r] || 0) + 1; } return { type: 'res', res }; })() : (() => { const build = pick(['camino', 'pueblo', 'ciudad']); return { type: 'discount', build, res: pick(Object.keys(COST[build])) }; })();
  const first = Object.keys(items)[0];
  const q = { id: Math.random().toString(36).slice(2, 8), p, vid: v.id, items, item: first, n: items[first], kind: qkind, role, gender, name: pick(gender === 'f' ? NAMES_F : NAMES_M), reward, state: 'new' };
  if (qkind === 'brujo'){ q.name = gender === 'f' ? 'La bruja del bosque' : 'El brujo del bosque'; q.gender = 'm'; q.name = 'El brujo'; }
  q.txt = pick(QUEST_TXT[qkind]).replace('{x}', qListM(q));
  q.expr = pick(qkind === 'flor' ? ['triste', 'duda', 'serio'] : qkind === 'dificil' ? ['serio', 'duda', 'cansado'] : ['sonrisa', 'serio', 'guiño', 'duda']);
  if (qkind !== 'brujo' && Math.random() < .3) q.poster = pick(['perro', 'cabra', 'gato', 'gallina', 'oveja']);   // sometimes the flyer is carried by someone's animal
  (G.quests ||= []).push(q);
  if (p === 0){ notify(qkind === 'brujo' ? `🔮 El brujo de las afueras de <b>${v.name}</b> te anda buscando <b>(!)</b>` : `📜 Colgaron un folleto en el cartel del pozo de <b>${v.name}</b> <b>(!)</b>`, G.players[0].color, 'sys'); drawQuestMarks(); }
  else if (!isRemote(p)) q.state = 'accepted';   // online, other humans read their flyer on their own screen
}
const questSeed = q => { let h = 7; for (const c of q.id) h = (h*31 + c.charCodeAt(0)) | 0; return (Math.abs(h) % 9973) + 1; };
const questRole = q => q.kind === 'brujo' ? 'brujo' : ROLE_LABEL[q.role] && q.role !== 'vecino' ? q.role : 'campesino';
function questPerson(q){ const p = makePerson(mulberry32(questSeed(q)*97), questRole(q), q.kind === 'brujo' ? 'm' : q.gender, '#7a6a5a', { expr: q.expr || 'sonrisa' }); return p; }
function questAvatar(q){ return q.kind === 'brujo' ? avatarURL('brujo') : avatarCanvas({ id: 'q' + q.id, role: questRole(q), g: q.gender, s: questSeed(q), o: { expr: q.expr || 'sonrisa' } }).toDataURL(); }
function questReady(q){ return Object.entries(qItems(q)).every(([k, n]) => haveOf(q.p, k) >= n); }
function completeQuest(q){
  const P = G.players[q.p]; if (!questReady(q) || q.state === 'done') return;
  Object.entries(qItems(q)).forEach(([k, n]) => { if (RES.includes(k)) P.res[k] -= n; else P.special[k] -= n; }); q.state = 'done';
  const r = q.reward; P.buffs = P.buffs || {};
  if (r.type === 'res'){ Object.entries(r.res).forEach(([k, n]) => { P.res[k] += n; if (q.p === 0){ const tok = invExpect(k, n); for (let i=0;i<n;i++) flyToInventory(tok, innerWidth/2, innerHeight/2, i*.15); } }); }
  if (r.type === 'buff') P.buffs[r.buff] = true;
  if (r.type === 'card' && G.deck.length){ const t = G.deck.pop(); (P.cards ||= []).push({ t, turn: G.turnId }); if (q.p === 0) renderFan(P.cards.length - 1); }
  if (r.type === 'discount') P.discount = { build: r.build, res: r.res };
  if (r.type === 'road'){ P.roadTokens = (P.roadTokens || 0) + (r.n || 1); if (q.p !== 0) botUseRoadTokens(q.p); }
  if (r.type === 'amulet'){ (P.amulets ||= {})[r.k] = (P.amulets[r.k] || 0) + 1; }
  notify(`${q.p === 0 ? 'Entregaste' : P.name + ' entregó'} ${qImgs(q)} a ${q.name} y ${q.p === 0 ? 'recibiste' : 'recibió'}: ${rewardText(r)}`, P.color);
  checkWin(q.p); updateInventory(); refresh(); drawQuestMarks(); if ($('#quests').classList.contains('show')) fillQuests();
}
function botUseRoadTokens(p){ const P = G.players[p]; while ((P.roadTokens || 0) > 0 && P.roads < 15){ const vr = validRoads(p); if (!vr.length) break; buildRoad(p, pick(vr).id, true); P.roadTokens--; } }
function botQuests(p){ (G.quests || []).filter(q => q.p === p && q.state === 'accepted' && questReady(q)).forEach(completeQuest); }
// cost after a mission discount
function costFor(p, kind){ const c = { ...COST[kind] }, d = G.players[p].discount; if (d && d.build === kind && c[d.res]){ c[d.res]--; if (!c[d.res]) delete c[d.res]; } return c; }
function useDiscount(p, kind){ const d = G.players[p].discount; if (d && d.build === kind) G.players[p].discount = null; }
// ---------- yellow "!" over the village on the board ----------
const QMARKS = [];
function exclaim(col){
  const g = new THREE.Group(), m = keepMat(new THREE.MeshStandardMaterial({ color: col || 0xffd23a, emissive: col ? 0x5a1a8a : 0xa06a00, emissiveIntensity: .6, roughness: .4, flatShading: true }));
  const bar = new THREE.Mesh(GEO.cone4, m); bar.scale.set(.07, .26, .05); bar.rotation.z = Math.PI; bar.position.y = .34; g.add(bar);
  const dot = new THREE.Mesh(sg(new THREE.IcosahedronGeometry(1, 0)), m); dot.scale.setScalar(.045); dot.position.y = .03; g.add(dot);
  return outlineItem(g);
}
function drawQuestMarks(){
  if (!boardScene) return;
  QMARKS.forEach(o => boardScene.remove(o)); QMARKS.length = 0;
  (G.quests || []).filter(q => q.p === 0 && q.state === 'new').forEach(q => { const v = G.verts[q.vid]; if (QMARKS.some(o => o.userData.vid === v.id)) return; const e = exclaim(q.kind === 'brujo' ? 0xb04aff : null); e.position.set(v.x, 1.12, v.z); e.userData.vid = v.id; e.traverse(o => { if (o.isMesh) o.userData.qvid = v.id; }); boardScene.add(e); QMARKS.push(e); });
  updateQuestIcon();
}
function stepQuestMarks(t){ QMARKS.forEach((o, i) => { o.position.y = 1.12 + Math.sin(t*2.4 + i)*.05; o.rotation.y = t*1.5; }); }
// ---------- mission list (parchment panel) ----------
const VCARD = { hide: true };   // the village card now shows as a 3-second note when you arrive
function applyVCard(){ const c = $('#v-card'); if (!c) return; c.style.display = VCARD.hide ? 'none' : ''; $('#v-info').classList.toggle('on', VCARD.hide); }
document.addEventListener('click', e => { if (e.target.closest('#v-card .vclose')){ VCARD.hide = true; applyVCard(); SFX.click?.(); } else if (e.target.closest('#v-info') && villageCtx){ villageNote(G.verts[villageCtx.vid]); SFX.click?.(); } });
addEventListener('keydown', e => { if (mode === 'village' && villageCtx && e.key.toLowerCase() === 'i' && !e.target.closest('input,textarea')) villageNote(G.verts[villageCtx.vid]); });
function initQuestPanel(){ const p = document.createElement('div'); p.id = 'quests'; document.body.appendChild(p); addEventListener('pointerdown', e => { if (p.classList.contains('show') && !p.contains(e.target) && !e.target.closest('#quest-icon')) closeParchPanel(p); }); }
function openQuests(){ const p = $('#quests'); if (p.classList.contains('show')){ closeParchPanel(p); return; } openParchPanel(p); fillQuests(); }
function fillQuests(){
  const p = $('#quests'), box = ensureParchPanel(p);
  const qs = (G.quests || []).filter(q => q.p === 0 && q.state !== 'done').sort((a, b) => (questReady(b) - questReady(a)) || (a.state === 'new') - (b.state === 'new'));
  const KIND = { flor: ['Hierbas', '🌿'], objeto: ['Objetos', '🧺'], dificil: ['Difícil', '⭐'], brujo: ['Brujo', '🔮'] };
  const have = k => haveOf(0, k);
  const card = q => { const ready = q.state === 'accepted' && questReady(q), K = KIND[q.kind] || KIND.objeto, vn = G.verts[q.vid].name;
    const needs = Object.entries(qItems(q)).map(([k, n]) => `<span class="qn ${have(k) >= n ? 'ok' : ''}"><canvas class="qcv" data-k="${k}"></canvas><b>${Math.min(have(k), n)}/${n}</b></span>`).join('');
    const right = q.state === 'new' && !scenesOn() ? `<div class="qwait"><button class="qacc" data-q="${q.id}">Aceptar</button></div>` : q.state === 'new' ? `<div class="qwait">${q.kind === 'brujo' ? `Ve a su <b>choza</b> en las afueras de ${vn}` : `Busca su folleto en el <b>cartel junto al pozo</b> de ${vn}`}</div>`
      : `<div class="qstamp ${ready ? 'on' : ''}" data-q="${q.id}" title="${ready ? 'Toca el sello para aprobar la entrega' : 'Aún te falta algo'}"><canvas class="qsc"></canvas><span>${ready ? 'Sellar' : 'Faltan cosas'}</span></div>`;
    return `<div class="qcard ${q.kind || ''} ${ready ? 'ready' : ''}" data-q="${q.id}"><img class="qav" src="${questAvatar(q)}">
      <div class="qmid"><div class="qhead"><span class="qkind">${K[1]} ${K[0]}</span><b>${q.name}</b><span class="qvil">· ${vn}</span></div>
        <div class="qneeds">${needs}</div><div class="qrew">🎁 ${rewardText(q.reward)}</div></div>${right}<div class="qmark">APROBADO</div></div>`; };
  const early = gameRound() <= 4;
  box.innerHTML = deEmo(`<div class="ntitle">Misiones</div>${qs.length ? qs.map(card).join('') : `<div class="qempty">${early ? 'Los aldeanos aún se están acomodando. Las misiones empiezan después de la <b>cuarta ronda</b>.' : 'Nadie te ha pedido nada todavía. Busca el <b>!</b> amarillo sobre tus pueblos (o el <b style="color:#7a2ab0">!</b> morado del brujo).'}</div>`}`);
  if (!miniInit()) return;
  p.querySelectorAll('.qcv').forEach(cv => { const o = spinner(itemOf(cv.dataset.k), 1.1); const v = miniView(cv, { w: 38, h: 38, res: .9, fov: 30, fps: 24, tick: dt => { o.userData.inner.rotation.y += dt*1.5; } }); v.sc.add(o); v.cam.position.set(0, .35, 2.5); v.cam.lookAt(0, 0, 0); });
  p.querySelectorAll('.qacc').forEach(b => b.onclick = e => { e.stopPropagation(); const q = G.quests.find(x => x.id === b.dataset.q); if (q){ q.state = 'accepted'; netOp('qacc', { id: q.id }); SFX.click?.(); drawQuestMarks(); fillQuests(); } });
  p.querySelectorAll('.qstamp').forEach(el => { const q = G.quests.find(x => x.id === el.dataset.q); el._st = stampView(el.querySelector('canvas'), el.classList.contains('on'));
    el.onclick = e => { e.stopPropagation(); if (NG.on && el.classList.contains('on') && G.current !== 0){ sysNote('En línea entregas las misiones durante tu turno.', { ms: 2600 }); return; } if (!el.classList.contains('on') || el._busy){ if (!el.classList.contains('on')) sysNote(`A ${q.name} aún le falta: ${Object.entries(qItems(q)).filter(([k, n]) => have(k) < n).map(([k, n]) => `${n - have(k)} ${specImg(k)}`).join(' ')}`, { ms: 3000 }); return; }
      el._busy = true; SFX.click?.(); el._st.press(() => { const c = el.closest('.qcard'); c.classList.add('stamped'); SFX.build?.();
        setTimeout(() => { closeParchPanel(p); setTimeout(() => questReward(q), 450); }, 1000); }); }; });
}
// after the stamp the delivery always plays in your office (from a village you are taken back to the board first)
async function questReward(q){
  if (!scenesOn()){ completeQuest(q); return; }
  if (mode !== 'board'){ if (mode === 'village') backToBoard(); for (let k=0;k<80 && (mode !== 'board' || busy || marketCtx);k++) await wait(200); }
  for (let k=0;k<60 && (busy || marketCtx);k++) await wait(200);
  const r = await officeScene({ mode: 'quest', q }); if (r === null && q.state !== 'done') completeQuest(q);
}
// the approval stamp: an ink pad, a stamp and a scrap of paper; pressing it leaves "APROBADO"
function stampView(cv, ok){
  const v = miniView(cv, { w: 92, h: 66, res: 1, fov: 34, fps: 30, tick: (dt, t) => step(dt, t) });
  v.cam.position.set(0, .4, .46); v.cam.lookAt(0, .02, 0);
  const paper = mesh(GEO.box, keepMat(new THREE.MeshStandardMaterial({ map: flyerTex(null), roughness: 1 })), .1, 0, 0, .17, .004, .13); v.sc.add(paper);
  const pad = inkPadModel(0x2a7a3a); pad.position.set(-.12, 0, .01); v.sc.add(pad);
  const st = stampModel(ok ? 0x2a7a3a : 0x6a6a6a, 'SÍ'); st.position.set(-.12, .02, .01); v.sc.add(st);
  const decal = pxTex(48, 20, c => { c.strokeStyle = '#2a8a3a'; c.lineWidth = 2; c.strokeRect(2, 2, 44, 16); c.fillStyle = '#2a8a3a'; c.font = 'bold 9px monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('APROBADO', 24, 11); });
  const mark = new THREE.Mesh(sg(new THREE.PlaneGeometry(1, 1)), keepMat(new THREE.MeshBasicMaterial({ map: decal, transparent: true, opacity: 0 }))); mark.rotation.x = -Math.PI/2; mark.rotation.z = .18; mark.scale.set(.12, .05, 1); mark.position.set(.1, .0045, 0); v.sc.add(mark);
  const S = { ph: 'idle', t: 0, done: null };
  function step(dt, t){ S.t += dt; const k = Math.min(1, S.t/.28), e = k*k*(3 - 2*k);
    if (S.ph === 'idle'){ st.position.y = .02 + (ok ? Math.abs(Math.sin(t*2.4))*.012 : 0); st.rotation.y = ok ? Math.sin(t*1.3)*.15 : 0; }
    else if (S.ph === 'lift'){ st.position.y = .02 + e*.09; if (k >= 1){ S.ph = 'move'; S.t = 0; } }
    else if (S.ph === 'move'){ st.position.x = -.12 + e*.22; if (k >= 1){ S.ph = 'press'; S.t = 0; } }
    else if (S.ph === 'press'){ st.position.y = .11 - Math.min(1, S.t/.12)*.106; if (S.t > .12 && !S.hit){ S.hit = true; mark.material.opacity = .92; SFX.clack?.(.8); } if (S.t > .45){ S.ph = 'up'; S.t = 0; } }
    else if (S.ph === 'up'){ st.position.y = .004 + e*.1; if (k >= 1){ S.ph = 'end'; S.done && S.done(); } }
  }
  return { press(cb){ S.ph = 'lift'; S.t = 0; S.done = cb; st.rotation.y = 0; } };
}
// ---------- inside the village: someone (or their animal) pins the flyer on the board by the well ----------
function flyerTex(q){
  return pxTex(24, 30, c => { c.fillStyle = q ? '#efe2c2' : '#c9b48a'; c.fillRect(0, 0, 24, 30); for (let y=3;y<26;y+=3) for (let x=3;x<21;x++) if (hash2(x, y, q ? 5 : 9) > .35){ c.fillStyle = 'rgba(50,30,15,.55)'; c.fillRect(x, y, 1, 1); }
    if (q){ c.fillStyle = '#c8901a'; c.fillRect(10, 4, 4, 11); c.fillRect(10, 17, 4, 4); } c.fillStyle = 'rgba(90,60,20,.25)'; c.fillRect(0, 28, 24, 2); c.fillRect(22, 0, 2, 30); });
}
function questBoard(sc, x, z, rng, anims){
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = Math.atan2(x, z); sc.add(g);
  const postM = plankMat(5, 0x4a301c);
  [-.86, .86].forEach(px => { const p = mesh(GEO.box, postM, px, 0, 0, .13, 2.15, .13); g.add(p); });
  const bd = rusticBoard(170, 96, 4, { ph: 24 }); bd.scale.setScalar(.01); bd.position.set(0, 1.92, .07); g.add(bd);
  [[-1, .55], [1, -.55]].forEach(([sd, rz]) => { const r = mesh(GEO.box, plankMat(2, 0x5a3a22), sd*.48, 2.05, .02, 1.05, .07, .5); r.rotation.z = rz*.5; g.add(r); });
  g.add(mesh(GEO.box, plankMat(1, 0x4a301c), 0, 2.27, .02, .1, .08, .52));
  // old weathered flyers
  for (let k=0;k<4;k++){ const f = new THREE.Mesh(sg(new THREE.PlaneGeometry(1, 1)), keepMat(new THREE.MeshStandardMaterial({ map: flyerTex(null), roughness: 1 }))); f.scale.set(.22, .28, 1); f.position.set(-.6 + k*.38 + (rng() - .5)*.08, 1.45 - (k % 2)*.38 + (rng() - .5)*.06, .145); f.rotation.z = (rng() - .5)*.25; g.add(f); g.add(mesh(GEO.sphere, 0x8a2a1a, f.position.x, f.position.y + .11, .15, .018, .018, .018)); }
  const W = (lx, lz) => { const a = g.rotation.y; return [x + Math.sin(a)*lz + Math.cos(a)*lx, z + Math.cos(a)*lz - Math.sin(a)*lx]; };
  return { g, x, z, W, front: W(.15, .85) };
}
function villageQuest(vid){
  const q = (G.quests || []).find(x => x.p === 0 && x.vid === vid && x.state === 'new' && x.kind !== 'brujo'); if (!q || !villageCtx || !villageCtx.qboard) return;
  const B = villageCtx.qboard, [fx, fz] = B.front, gy = villageCtx.gh ? villageCtx.gh(fx, fz) : 0;
  // the new flyer, pinned on the board
  const fl = new THREE.Mesh(sg(new THREE.PlaneGeometry(1, 1)), keepMat(new THREE.MeshStandardMaterial({ map: flyerTex(q), roughness: 1, emissive: 0x3a2a10, emissiveIntensity: .25 }))); fl.scale.set(.26, .33, 1); fl.position.set(.12, 1.42, .16); fl.rotation.z = .05; B.g.add(fl);
  const pin = mesh(GEO.sphere, 0xd23a2a, .12, 1.57, .17, .022, .022, .022); B.g.add(pin);
  let who, animal = q.poster;
  if (animal){ const a = makeAnimal(animal, mulberry32(questSeed(q))); who = { g: a.g, head: a.head, animal }; const paper = new THREE.Mesh(sg(new THREE.PlaneGeometry(1, 1)), keepMat(new THREE.MeshStandardMaterial({ map: flyerTex(q), side: THREE.DoubleSide, roughness: 1 }))); paper.scale.set(.16, .2, 1); paper.rotation.x = -1.2; if (a.head){ paper.position.set(0, -.05, .22); a.head.add(paper); } who.paper = paper; }
  else { const pp = questPerson(q); who = pp; }
  who.g.position.set(fx, gy, fz); who.g.rotation.y = Math.atan2(B.x - fx, B.z - fz); villageCtx.sc.add(who.g);
  const mark = exclaim(); mark.scale.setScalar(animal ? 1.5 : 2.2); mark.position.y = animal ? 1.25 : 2.15; who.g.add(mark);
  who.g.traverse(o => { if (o.isMesh){ o.userData.qposter = { q, who }; villageCtx.clickables.push(o); } });
  let near = false, talked = false;
  villageCtx.anims.push((dt, t) => {
    if (!villageCtx || !who.g.parent) return;
    // once you accepted, they stop pinning, turn round and walk off into the village (they used to keep their arm up forever, in front of you)
    if (q.state !== 'new' && !who.talking){
      if (!who.leave){ who.leave = { t: 0, a: who.g.rotation.y + Math.PI }; mark.visible = false; if (!animal){ who.armR.rotation.set(0, 0, 0); who.armL.rotation.set(0, 0, 0); if (who.elbowR) who.elbowR.rotation.x = 0; who.head.rotation.x = 0; } }
      const L = who.leave; L.t += dt; if (L.t > 8){ who.g.parent.remove(who.g); return; }
      who.g.rotation.y = L.a; who.g.position.x += Math.sin(L.a)*1.1*dt; who.g.position.z += Math.cos(L.a)*1.1*dt;
      if (villageCtx.gh) who.g.position.y = villageCtx.gh(who.g.position.x, who.g.position.z);
      if (!animal && who.legL){ const sw = Math.sin(L.t*7)*.45; who.legL.rotation.x = sw; who.legR.rotation.x = -sw; who.armL.rotation.x = -sw*.5; who.armR.rotation.x = sw*.5; }
      return;
    }
    mark.visible = q.state === 'new'; mark.rotation.y = t*2; mark.position.y = (animal ? 1.25 : 2.15) + Math.sin(t*3)*.06;
    const dx = ctl.pos.x - who.g.position.x, dz = ctl.pos.z - who.g.position.z, d = Math.hypot(dx, dz);
    if (who.talking){ const a = Math.atan2(dx, dz), cur = who.g.rotation.y; who.g.rotation.y = cur + Math.atan2(Math.sin(a - cur), Math.cos(a - cur))*Math.min(1, dt*5); if (who.armR){ who.armR.rotation.x *= .9; } return; }
    if (animal){ if (who.head) who.head.rotation.x = Math.sin(t*2.2)*.12; }
    else { // pinning: reach up to the board, press, step back
      const c = (t*.55) % 1, up = c < .45 ? Math.sin(c/.45*Math.PI*.5) : c < .7 ? 1 : 1 - (c - .7)/.3;
      who.armR.rotation.x = -2.5*up; who.armR.rotation.z = -.15*up; if (who.elbowR) who.elbowR.rotation.x = -.35*up - (c > .45 && c < .7 ? Math.abs(Math.sin(t*16))*.25 : 0);
      who.armL.rotation.x = -.6*up; who.head.rotation.x = -.25*up; }
    if (q.state === 'new' && d < 3.4 && !near){ near = true; sysNote(`${animal ? `Un${['cabra', 'gallina', 'oveja'].includes(animal) ? 'a' : ''} <b>${ANIMAL_NAME[animal].toLowerCase()}</b> trae un folleto en el hocico` : `<b>${q.name}</b> está colgando un folleto`} · <b>tócal${animal && ['cabra', 'gallina', 'oveja'].includes(animal) ? 'a' : 'o'}</b> para hablar`, { ms: 3500 }); }
    if (d > 5) near = false;
  });
}
function posterTalk(info){
  const { q, who } = info; if (q.state !== 'new'){ say(`<b>${q.name}:</b> ${questReady(q) ? '¡Ya lo tienes! Séllalo en tu panel de misiones y voy a tu despacho.' : 'Cuando tengas todo, sella mi folleto en tu panel de misiones. ' + qImgs(q)}`, questAvatar(q)); return; }
  who.talking = true; if (who.animal) SFX.animal?.(who.animal); else SFX.talk?.(who);
  questDialog(q, who).then(() => { who.talking = false; });
}
async function questDialog(q, who){
  const have = k => haveOf(0, k);
  const need = Object.entries(qItems(q)).map(([k, n]) => `<span class="pc"><span class="m3 big" data-k="${k}"></span><em class="${have(k) >= n ? '' : 'hot'}">${Math.min(have(k), n)}/${n}</em></span>`).join('');
  const intro = who && who.animal ? `<span class="muted">${ANIMAL_SAYS[who.animal] || '…'} Te deja el folleto de ${q.name}:</span><br>` : '';
  const r = await pbAsk(`${intro}<b>${q.name}:</b> ${q.txt}<div class="pbprev">${need}</div><span class="muted">Te dará:</span> ${rewardText(q.reward)}`, { av: questAvatar(q), btns: [{ t: 'Ahora no', k: 'no' }, { t: 'Acepto ✔', k: 'ok', ok: true }] });
  if (r === 'ok'){ q.state = 'accepted'; netOp('qacc', { id: q.id }); notify(`Aceptaste ayudar a ${q.name}: necesita ${qImgs(q)}`, G.players[0].color, 'sys'); drawQuestMarks(); }
  return r;
}

