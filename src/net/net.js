// ================= MULTIPLAYER: rooms by key, players present, chat with T (the match itself: net/net-game.js) =================
// Transport: inside claude.ai the artifact's `room` capability; anywhere else (tests, a plain browser) a
// BroadcastChannel between tabs of the same browser. The desktop .exe will add its own (host IP) transport here.
const NET_COLORS = ['#e8c84a', '#4ab0e8', '#e86a4a', '#7ad06a', '#c87ae8', '#e8a04a', '#4ae8c8', '#f2f2e8'];
const NET = { base: null, local: false, room: null, key: '', match: '', host: false, peers: [], unsub: [], chat: [], me: { name: '', color: NET_COLORS[Math.floor(Math.random()*NET_COLORS.length)] } };
function localRoomBase(){
  const me = Math.random().toString(36).slice(2, 10);
  return { join: async name => {
    const ch = new BroadcastChannel('catroan.' + name), subs = {}, peerSubs = new Set(), conn = new Set(), others = new Map(); let mine = {}, alive = true;
    const snap = () => [{ peer: me, by: null, isMe: true, sameTab: true, kind: 'viewer', guest: false, presence: mine, updatedAt: Date.now() }, ...[...others.entries()].map(([peer, o]) => ({ peer, by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false, presence: o.p, updatedAt: o.t }))];
    const firePeers = (joined = [], left = []) => { const peers = snap(); peerSubs.forEach(f => f({ peers, joined, left, updated: [] })); };
    const hello = () => alive && ch.postMessage({ k: 'p', from: me, p: mine });
    ch.onmessage = e => { const m = e.data; if (!alive || !m || m.from === me) return;
      if (m.k === 'p'){ const was = others.has(m.from); others.set(m.from, { p: m.p || {}, t: Date.now() }); if (!was) hello(); firePeers(was ? [] : [{ peer: m.from }]); }
      else if (m.k === 'bye'){ others.delete(m.from); firePeers([], [{ peer: m.from }]); }
      else if (m.k === 'e') (subs[m.topic] || []).forEach(f => f({ topic: m.topic, data: m.data, peer: m.from, by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false })); };
    const beat = setInterval(() => { hello(); const now = Date.now(); let gone = false; others.forEach((o, k) => { if (now - o.t > 6000){ others.delete(k); gone = true; } }); if (gone) firePeers(); }, 1500);
    setTimeout(hello, 50);
    return { name,
      emit: async (topic, data) => { if (!alive) return; ch.postMessage({ k: 'e', from: me, topic, data }); (subs[topic] || []).forEach(f => f({ topic, data, peer: me, by: null, isMe: true, sameTab: true, kind: 'viewer', guest: false })); },
      on: (topic, fn) => { (subs[topic] ||= []).push(fn); return () => { subs[topic] = subs[topic].filter(x => x !== fn); }; },
      presence: async patch => { mine = { ...mine, ...patch }; Object.keys(mine).forEach(k => mine[k] === null && delete mine[k]); hello(); firePeers(); },
      peers: snap, onPeers: fn => { peerSubs.add(fn); setTimeout(() => fn({ peers: snap(), joined: snap(), left: [], updated: [] }), 0); return () => peerSubs.delete(fn); },
      connected: () => alive, onConnection: fn => { conn.add(fn); setTimeout(() => fn(alive), 0); return () => conn.delete(fn); },
      leave: async () => { if (!alive) return; ch.postMessage({ k: 'bye', from: me }); alive = false; clearInterval(beat); ch.close(); } };
  } };
}
async function netBase(){
  if (NET.base) return NET.base;
  let r = null;
  try { if (window.claude && typeof window.claude.use === 'function') r = await window.claude.use('room'); } catch { r = null; }
  NET.local = !r; NET.base = r || localRoomBase(); return NET.base;
}
// keys look like K7M-2QX: no 0/O/1/I so they are easy to read aloud
const KEY_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newKey = () => Array.from({ length: 6 }, (_, i) => KEY_ABC[Math.floor(Math.random()*KEY_ABC.length)] + (i === 2 ? '-' : '')).join('');
const keyRoom = key => 'catroan-' + key.toLowerCase().replace(/[^a-z0-9]/g, '');
const cleanKey = s => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6).replace(/^(.{3})(.+)$/, '$1-$2');
async function netJoin(key, o = {}){
  await netLeave();
  const base = await netBase(); let room;
  try { room = await base.join(keyRoom(key)); } catch (e) { return { error: e && e.code || 'upstream_error' }; }
  Object.assign(NET, { room, key, host: !!o.host, match: o.match || '', peers: [] });
  NET.me.name = o.name || NET.me.name || 'Alcalde';
  NET.unsub.push(room.onPeers(ch => { NET.peers = ch.peers; netPeersChanged(); }));
  NET.unsub.push(room.on('chat', m => chatReceive(m)));
  NET.unsub.push(room.on('game', m => netGameMsg(m)));
  await netPresence();
  document.body.classList.add('online');
  return { room };
}
async function netLeave(){ NET.unsub.forEach(f => { try { f(); } catch {} }); NET.unsub = []; if (NET.room){ try { await NET.room.leave(); } catch {} } NET.room = null; NET.peers = []; NET.host = false; document.body.classList.remove('online'); }
const netPresence = () => NET.room ? NET.room.presence({ name: NET.me.name.slice(0, 24), color: NET.me.color, host: NET.host, match: NET.host ? NET.match.slice(0, 40) : null, tok: NG.tok, want: !NET.host }).catch(() => {}) : Promise.resolve();
function netPeersChanged(){ const hostP = NET.peers.find(p => p.presence && p.presence.host); if (!NET.host && hostP && hostP.presence.match) NET.match = cleanName(String(hostP.presence.match)).slice(0, 24) || NET.match; if (NG.on && NG.seat === 0) netHostPeers(); }
// ---------- chat: T opens it, Enter sends, Esc closes ----------
function chatEnsure(){
  let el = $('#chat'); if (el) return el;
  el = document.createElement('div'); el.id = 'chat'; el.innerHTML = '<div class="clog"></div><div class="cin"><input maxlength="160" placeholder="Escribe y pulsa Enter (Esc para cerrar)"></div><div class="chint">T para chatear</div>'; document.body.appendChild(el);
  const inp = el.querySelector('input');
  inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter'){ const t = inp.value.trim(); inp.value = ''; if (t) chatSend(t); if (!el.classList.contains('pinned')) chatClose(); } else if (e.key === 'Escape') chatClose(); });
  return el;
}
function chatOpen(){ const el = chatEnsure(); el.classList.add('open', 'show'); setTimeout(() => el.querySelector('input').focus(), 0); }
function chatClose(){ const el = chatEnsure(); el.classList.remove('open'); el.querySelector('input').blur(); chatFade(); }
let CHAT_T = 0; function chatFade(){ const el = chatEnsure(); clearTimeout(CHAT_T); el.classList.add('show'); CHAT_T = setTimeout(() => { if (!el.classList.contains('open') && !el.classList.contains('pinned')) el.classList.remove('show'); }, 8000); }
function chatLine(name, color, text, sys){
  const el = chatEnsure(), log = el.querySelector('.clog'), row = document.createElement('div'); row.className = 'cl' + (sys ? ' sys' : '');
  if (!sys){ const n = document.createElement('b'); n.textContent = name; n.style.color = color; row.appendChild(n); row.appendChild(document.createTextNode(': ')); }
  row.appendChild(document.createTextNode(text)); log.appendChild(row); while (log.children.length > 60) log.firstChild.remove(); log.scrollTop = log.scrollHeight; chatFade();
}
const chatSystem = t => chatLine('', '', t, true);
async function chatSend(t){
  if (!NET.room){ chatSystem('El chat funciona dentro de una partida multijugador.'); return; }
  try { await NET.room.emit('chat', { t: t.slice(0, 160), n: NET.me.name.slice(0, 24), c: NET.me.color }); }
  catch (e) { chatSystem(e && e.code === 'not_permitted' ? 'No tienes permiso para escribir en esta sala.' : 'No se pudo enviar el mensaje.'); }
}
function chatReceive(m){
  const d = m.data || {}, t = typeof d.t === 'string' ? d.t.slice(0, 160) : ''; if (!t) return;
  const peer = NET.peers.find(p => p.peer === m.peer), name = String((peer && peer.presence && peer.presence.name) || d.n || 'Alguien').slice(0, 24), col = /^#[0-9a-f]{6}$/i.test(d.c || '') ? d.c : '#d8c8a4';
  chatLine(name, col, t); if (!m.isMe) SFX.click?.();
}
addEventListener('keydown', e => { if (e.key.toLowerCase() !== 't' || e.ctrlKey || e.metaKey || e.altKey || e.target.closest('input,textarea')) return; if (!NET.room) return; e.preventDefault(); chatOpen(); });
