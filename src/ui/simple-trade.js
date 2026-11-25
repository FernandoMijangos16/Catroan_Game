// ================= SIMPLE PANELS (used when the first-person view is off): trade window and the thief's discard =================
function openTrade(tab0, o = {}){
  const P = G.players[0], fixed = o.target !== undefined; let tab = G.current !== 0 || fixed ? 'jug' : (typeof tab0 === 'string' ? tab0 : 'banco'), give = null, get = null, target = fixed ? o.target : G.current !== 0 ? G.current : 'todos';
  const pg = {}, pw = {}; RES.forEach(r => { pg[r] = 0; pw[r] = 0; });
  const stp = (k, r, n, max) => `<span class="stp">${RES.includes(r) ? resImg(r) : specImg(r)}<button data-s="${k}|${r}|-" ${n <= 0 ? 'disabled' : ''}>−</button><b>${n}</b><button data-s="${k}|${r}|+" ${max !== undefined && n >= max ? 'disabled' : ''}>+</button></span>`;
  const draw = () => {
    const tabs = fixed ? '' : `<div class="row tabs"><button data-tab="banco" class="${tab === 'banco' ? 'on' : ''}">🏦 Banco y puertos</button><button data-tab="jug" class="${tab === 'jug' ? 'on' : ''}">🤝 Trueque con jugadores</button></div>`;
    if (tab === 'banco') modalBody.innerHTML = `<h3>Comerciar</h3>${tabs}<p class="muted">Con el banco das 4 iguales por 1. Si tienes un pueblo en un puerto: 3:1 con cualquier recurso o 2:1 con el recurso del puerto.</p>
    <div class="lbl">Das</div><div class="row">${RES.map(r => { const k = tradeRate(0, r); return `<button data-give="${r}" ${P.res[r] < k ? 'disabled' : ''} class="${give === r ? 'on' : ''}">${resImg(r)} ${P.res[r]}<small>${k}:1${k < 4 ? ' ⚓' : ''}</small></button>`; }).join('')}</div>
    <div class="lbl">Recibes 1 de</div><div class="row">${RES.map(r => `<button data-get="${r}" ${r === give ? 'disabled' : ''} class="${get === r ? 'on' : ''}">${resImg(r)} ${RES_NAME[r]}</button>`).join('')}</div>
    <div class="row end"><button data-x="1">Cancelar</button><button class="primary" data-ok="1" ${give && get ? '' : 'disabled'}>Cambiar</button></div>`;
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
    else if (b.dataset.s){ const [k, r, op] = b.dataset.s.split('|'), o = k === 'g' ? pg : pw; o[r] = Math.max(0, (o[r] || 0) + (op === '+' ? 1 : -1)); if (k === 'g' && pw[r]) pw[r] = 0; if (k === 'w' && pg[r]) pg[r] = 0; draw(); }
    else if (b.dataset.t){ target = b.dataset.t === 'todos' ? 'todos' : +b.dataset.t; draw(); }
    else if (b.dataset.x) closeModal();
    else if (b.dataset.send){ closeModal(); proposeTrade(target, { ...pg }, { ...pw }); }
    else if (b.dataset.ok){ const k = tradeRate(0, give); SFX.trade(); P.res[give] -= k; P.res[get] += 1; notify(`Cambiaste ${k} ${resImg(give)} por 1 ${resImg(get)} ${k < 4 ? 'en tu puerto' : 'con el banco'}`, P.color); closeModal(); refresh(); }
  };
}
async function proposeTrade(target, give, want){
  const ALL = [...RES, ...SPK];
  if (NG.on && G.current !== 0){ notify('En línea solo puedes proponer tratos durante tu turno.', G.players[0].color, 'sys'); return; }
  if (!ALL.some(r => give[r]) || !ALL.some(r => want[r])){ notify('Elige qué das y qué pides', G.players[0].color, 'sys'); return; }
  if (G.current !== 0 && G.tradeOpen !== G.turnId){ notify(`Solo puedes hacer trueques fuera de tu turno después de que ${G.players[G.current].name} haga uno`, G.players[0].color, 'sys'); return; }
  const order = (target === 'todos' ? shuffle(G.players.map((_, i) => i).filter(i => i)) : [target]).filter(q => G.current === 0 || q === G.current);
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
