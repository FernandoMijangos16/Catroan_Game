// ================= SIMPLE PANELS (used when the first-person view is off): trade window and the thief's discard =================
function openTrade(tab0, o = {}){
  const P = G.players[0], fixed = o.target !== undefined; let tab = G.current !== 0 || fixed ? 'jug' : (typeof tab0 === 'string' ? tab0 : 'banco'), give = null, get = null, target = fixed ? o.target : G.current !== 0 ? G.current : 'todos';
  const pg = {}, pw = {}, bl = {}, bw = {}; RES.forEach(r => { pg[r] = 0; pw[r] = 0; bl[r] = 0; bw[r] = 0; });   // bl/bw: lots you give / pieces you get in the comercio
  const sum = o => Object.values(o).reduce((a, n) => a + n, 0);
  const stp = (k, r, n, max) => `<span class="stp">${RES.includes(r) ? resImg(r) : specImg(r)}<button data-s="${k}|${r}|-" ${n <= 0 ? 'disabled' : ''}>−</button><b>${n}</b><button data-s="${k}|${r}|+" ${max !== undefined && n >= max ? 'disabled' : ''}>+</button></span>`;
  const draw = () => {
    const tabs = fixed ? '' : `<div class="row tabs"><button data-tab="banco" class="${tab === 'banco' ? 'on' : ''}">🏦 Comercio y puertos</button><button data-tab="jug" class="${tab === 'jug' ? 'on' : ''}">🤝 Trueque con jugadores</button></div>`;
    if (tab === 'banco') modalBody.innerHTML = `<h3>Comerciar</h3>${tabs}<p class="muted">En el comercio das 4 iguales por 1. Si tienes un pueblo en un puerto: 3:1 con cualquier recurso o 2:1 con el recurso del puerto.</p>
    <div class="lbl">Das <small class="muted">(cada + es un lote)</small></div><div class="row">${RES.map(r => { const k = tradeRate(0, r); return `<span class="stp">${resImg(r)}<button data-s="bl|${r}|-" ${bl[r] <= 0 ? 'disabled' : ''}>−</button><b>${bl[r]*k}</b><button data-s="bl|${r}|+" ${(bl[r] + 1)*k > P.res[r] ? 'disabled' : ''}>+</button><small>${k}:1${k < 4 ? ' ⚓' : ''}</small></span>`; }).join('')}</div>
    <div class="lbl">Recibes</div><div class="row">${RES.map(r => `<span class="stp">${resImg(r)}<button data-s="bw|${r}|-" ${bw[r] <= 0 ? 'disabled' : ''}>−</button><b>${bw[r]}</b><button data-s="bw|${r}|+" ${sum(bw) >= Math.max(1, sum(bl)) ? 'disabled' : ''}>+</button></span>`).join('')}</div>
    <p class="muted">${sum(bl) && sum(bl) !== sum(bw) ? `Das para <b>${sum(bl)}</b> y pides <b>${sum(bw)}</b>: iguala las cantidades.` : sum(bl) ? `Das ${resList(Object.fromEntries(RES.map(r => [r, bl[r]*tradeRate(0, r)])))} y recibes ${resList(bw)}.` : 'Puedes cambiar varios recursos a la vez.'}</p>
    <div class="row end"><button data-x="1">Cancelar</button><button class="primary" data-ok="1" ${sum(bl) && sum(bl) === sum(bw) ? '' : 'disabled'}>Cambiar</button></div>`;
    else modalBody.innerHTML = `<h3>${fixed ? `<i class="dot" style="background:${G.players[target].color}"></i> Trueque con ${G.players[target].name}` : 'Comerciar'}</h3>${tabs}<p class="muted">${fixed ? `Elige qué das y qué pides. Si ${G.players[target].name} acepta, un mensajero a caballo hará el intercambio.` : 'Ofrece recursos a los demás jugadores. Ellos deciden si les conviene.'}</p>
    <div class="lbl">Das</div><div class="row">${RES.map(r => stp('g', r, pg[r], P.res[r])).join('')}</div>
    ${SPK.some(k => (P.special || {})[k]) ? `<div class="lbl">Das flores y objetos</div><div class="row">${SPK.filter(k => (P.special || {})[k]).map(k => stp('g', k, pg[k] || 0, P.special[k])).join('')}</div>` : ''}
    <div class="lbl">Pides</div><div class="row">${RES.map(r => stp('w', r, pw[r])).join('')}</div>
    <div class="lbl">Pides flores y objetos</div><div class="row">${SPK.map(k => stp('w', k, pw[k] || 0)).join('')}</div>
    ${G.current !== 0 ? `<p class="muted">Fuera de tu turno solo puedes cambiar con ${G.players[G.current].name}, y solo después de que haga un trueque.</p>` : ''}
    ${fixed ? '' : `<div class="lbl">A quién</div>`}<div class="row" ${fixed ? 'style="display:none"' : ''}>${['todos', ...G.players.map((_, i) => i).filter(i => i)].filter(t => G.current === 0 || t === G.current).map(t => `<button data-t="${t}" class="${String(target) === String(t) ? 'on' : ''}">${t === 'todos' ? 'A todos' : `<i class="dot" style="background:${G.players[t].color}"></i> ${G.players[t].name}`}</button>`).join('')}</div>
    <div class="row end"><button data-x="1">Cancelar</button><button class="primary" data-send="1" ${Object.values(pg).some(Boolean) && Object.values(pw).some(Boolean) ? '' : 'disabled'}>Proponer trueque</button></div>`;
  };
  openModal(''); draw();
  modalBody.onclick = e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.dataset.tab){ if (G.current !== 0 && b.dataset.tab === 'banco') return; tab = b.dataset.tab; draw(); }
    else if (b.dataset.give){ give = b.dataset.give; if (get === give) get = null; draw(); }
    else if (b.dataset.get){ get = b.dataset.get; draw(); }
    else if (b.dataset.s){ const [k, r, op] = b.dataset.s.split('|'), o = { g: pg, w: pw, bl, bw }[k]; o[r] = Math.max(0, (o[r] || 0) + (op === '+' ? 1 : -1)); if (k === 'g' && pw[r]) pw[r] = 0; if (k === 'w' && pg[r]) pg[r] = 0; if (k === 'bl' && bw[r]) bw[r] = 0; if (k === 'bw' && bl[r]) bl[r] = 0; while (sum(bw) > Math.max(1, sum(bl))){ const x = RES.find(q => bw[q] > 0); bw[x]--; } draw(); }
    else if (b.dataset.t){ target = b.dataset.t === 'todos' ? 'todos' : +b.dataset.t; draw(); }
    else if (b.dataset.x) closeModal();
    else if (b.dataset.send){ closeModal(); proposeTrade(target, { ...pg }, { ...pw }); }
    else if (b.dataset.ok){ const gave = Object.fromEntries(RES.filter(r => bl[r]).map(r => [r, bl[r]*tradeRate(0, r)])), port = Object.keys(gave).some(r => tradeRate(0, r) < 4);
      if (!sum(bl) || sum(bl) !== sum(bw) || Object.entries(gave).some(([r, n]) => P.res[r] < n)) return;
      SFX.trade(); Object.entries(gave).forEach(([r, n]) => P.res[r] -= n); RES.forEach(r => P.res[r] += bw[r]);
      notify(`Cambiaste ${resList(gave)} por ${resList(bw)} ${port ? 'en tu puerto' : 'en el comercio'}`, P.color); closeModal(); refresh(); }
  };
}
async function proposeTrade(target, give, want){
  const ALL = [...RES, ...SPK];
  if (NG.on && G.current !== 0){ notify('En línea solo puedes proponer tratos durante tu turno.', G.players[0].color, 'sys'); return; }
  if (!ALL.some(r => give[r]) || !ALL.some(r => want[r])){ notify('Elige qué das y qué pides', G.players[0].color, 'sys'); return; }
  if (G.current !== 0 && G.tradeOpen !== G.turnId){ notify(`Solo puedes hacer trueques fuera de tu turno después de que ${G.players[G.current].name} haga uno`, G.players[0].color, 'sys'); return; }
  if (target !== 'todos' && !tradesLeft(0, target)){ notify(tradeLimitMsg(G.players[target].name), G.players[0].color, 'sys'); return; }
  const order = (target === 'todos' ? shuffle(G.players.map((_, i) => i).filter(i => i)) : [target]).filter(q => (G.current === 0 || q === G.current) && tradesLeft(0, q) > 0);
  notify(`Propusiste un trueque: das ${resList(give)} por ${resList(want)}`, G.players[0].color);
  let q; for (const c of order){ if (isRemote(c) ? await netAsk(c, 'offer', { give, want }, () => false, 60000) : botAcceptTrade(c, give, want)){ q = c; break; } }
  if (q === undefined){ notify(target === 'todos' ? 'Nadie aceptó tu trueque' : `${G.players[target].name} rechazó tu trueque`, G.players[target === 'todos' ? 0 : target].color); return; }
  notify(`${G.players[q].name} aceptó tu trueque: un mensajero va en camino`, G.players[q].color);
  courierScene(q, give, want).then(() => { SFX.trade(); refresh(); });
}
// on a 7 with more than 7 cards: pick what the thief takes, no alley scene
function simpleDiscard(n){
  return new Promise(res => {
    const P = G.players[0], lost = {};
    const draw = () => {
      const left = n - Object.values(lost).reduce((a, b) => a + b, 0);
      openModal(`<h3>${ic('cuchillo')} El ladrón cobra</h3><p class="muted">Tienes más de 7 cartas: entrégale <b>${n}</b>. Te faltan <b>${left}</b>.</p>
        <div class="row">${RES.map(r => `<button data-r="${r}" ${P.res[r] - (lost[r] || 0) > 0 && left > 0 ? '' : 'disabled'}>${resImg(r)} ${P.res[r] - (lost[r] || 0)}${lost[r] ? ` <b>−${lost[r]}</b>` : ''}</button>`).join('')}</div>
        <div class="row end"><button data-u="1" ${Object.keys(lost).length ? '' : 'disabled'}>Deshacer</button><button class="primary" data-ok="1" ${left ? 'disabled' : ''}>Entregar</button></div>`, false);
      modalBody.onclick = e => { const b = e.target.closest('button'); if (!b || b.disabled) return; SFX.click?.();
        if (b.dataset.r){ lost[b.dataset.r] = (lost[b.dataset.r] || 0) + 1; draw(); }
        else if (b.dataset.u){ const k = Object.keys(lost).pop(); if (--lost[k] <= 0) delete lost[k]; draw(); }
        else if (b.dataset.ok){ closeModal(); RES.forEach(r => P.res[r] -= lost[r] || 0); notify(`El ladrón se llevó ${resStr(lost)}`, '#2b2b30'); refresh(); res(); } };
    };
    draw();
  });
}
