// ================= MULTIPLAYER OUTSIDE CLAUDE.AI: the host's computer is the room =================
// Same interface as localRoomBase (join → emit/on/presence/peers/onPeers/connected/onConnection/leave), so
// net-game.js does not change. Every message goes through the host, which relays it and keeps the list of peers.
// Two links carry the messages:
//   · LAN (desktop .exe only): WebSocket server in Electron's main process; the room key hides the host's private IP.
//   · Online (WebRTC with PeerJS): the key is the room name on the public PeerJS server, which only introduces the
//     players; after that the data goes straight between computers (or through PeerJS's free TURN when it must).
const PEERJS_URL = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';   // the desktop build swaps in a local copy
const netErr = code => Object.assign(new Error(code), { code });
const hubId = () => Math.random().toString(36).slice(2, 10);
const HUB_BEAT = 2500, HUB_DEAD = 45000;   // generous: building the board can freeze a slow PC for seconds

// ---------- room keys: 6 chars of KEY_ABC = 30 bits. Top bit 1 = LAN key (private IP inside), 0 = online key ----------
const keyNum = key => { const s = String(key).toUpperCase().replace(/[^A-Z0-9]/g, ''); if (s.length !== 6) return -1; let n = 0;
  for (const ch of s){ const v = KEY_ABC.indexOf(ch); if (v < 0) return -1; n = n*32 + v; } return n; };
const numKey = n => Array.from({ length: 6 }, (_, i) => KEY_ABC[Math.floor(n / 32 ** (5 - i)) % 32] + (i === 2 ? '-' : '')).join('');
function lanKey(ip){
  const o = String(ip).split('.').map(Number), salt = b => Math.floor(Math.random() * 2 ** b);
  let cls, host, bits;
  if (o[0] === 192 && o[1] === 168){ cls = 0; host = o[2]*256 + o[3]; bits = 16; }
  else if (o[0] === 172 && o[1] >= 16 && o[1] <= 31){ cls = 1; host = (o[1] - 16)*65536 + o[2]*256 + o[3]; bits = 20; }
  else if (o[0] === 10){ cls = 2; host = o[1]*65536 + o[2]*256 + o[3]; bits = 24; }
  else return '';
  return numKey(2 ** 29 + cls * 2 ** 27 + salt(27 - bits) * 2 ** bits + host);
}
function lanIPFromKey(key){
  const n = keyNum(key); if (n < 2 ** 29) return '';
  const cls = Math.floor(n / 2 ** 27) % 4;
  if (cls === 0){ const h = n % 2 ** 16; return `192.168.${h >> 8}.${h & 255}`; }
  if (cls === 1){ const h = n % 2 ** 20; return `172.${16 + (h >> 16)}.${(h >> 8) & 255}.${h & 255}`; }
  if (cls === 2){ const h = n % 2 ** 24; return `10.${h >> 16}.${(h >> 8) & 255}.${h & 255}`; }
  return '';
}
const onlineKey = () => numKey(Math.floor(Math.random() * 2 ** 29));
const deskLanIP = () => { try { return window.catroanDesk ? window.catroanDesk.lanIP() || '' : ''; } catch { return ''; } };

// ---------- the room on top of a link ----------
// link: { host, send(to, obj) (host: client id or '*'; client: ignored), close(), drop?(id), retry?() }
// and the room sets link.onMsg(id, obj), link.onLeave(id) (host) / link.onState(up) (client)
function hubRoom(name, link){
  const me = (link.host ? 'h' : 'c') + hubId(), subs = {}, peerSubs = new Set(), connSubs = new Set(), others = new Map(), ids = new Map(), seen = new Map();
  let mine = {}, alive = true, up = true, lastHost = Date.now();
  const meta = (peer, isMe) => ({ peer, by: null, isMe, sameTab: isMe, kind: 'viewer', guest: false });
  const snap = () => [{ ...meta(me, true), presence: mine, updatedAt: Date.now() }, ...[...others.entries()].map(([peer, o]) => ({ ...meta(peer, false), presence: o.p, updatedAt: o.t }))];
  const firePeers = (joined = [], left = []) => { const peers = snap(); peerSubs.forEach(f => { try { f({ peers, joined, left, updated: [] }); } catch {} }); };
  const fireConn = v => connSubs.forEach(f => { try { f(v); } catch {} });
  const deliver = (topic, data, from) => (subs[topic] || []).slice().forEach(f => { try { f({ topic, data, ...meta(from, from === me) }); } catch {} });
  const plain = p => (p && typeof p === 'object' && !Array.isArray(p)) ? p : {};
  const setMine = patch => { mine = { ...mine, ...patch }; Object.keys(mine).forEach(k => mine[k] === null && delete mine[k]); };
  let beat;
  if (link.host){
    const list = () => [{ peer: me, p: mine, t: Date.now() }, ...[...others.entries()].map(([peer, o]) => ({ peer, p: o.p, t: o.t }))];
    const pushPeers = () => { if (alive) link.send('*', { k: 'peers', list: list() }); };
    const gone = lid => { const id = ids.get(lid); seen.delete(lid); if (!id) return; ids.delete(lid); others.delete(id); pushPeers(); firePeers([], [{ peer: id }]); };
    link.onMsg = (lid, m) => { if (!alive || !m || typeof m !== 'object') return; seen.set(lid, Date.now());
      if (m.k === 'hi' || m.k === 'p'){ let id = ids.get(lid); const fresh = !id;
        if (fresh){ id = String(m.id || lid).replace(/[^a-z0-9]/gi, '').slice(0, 16) || lid; if (id === me || [...ids.values()].includes(id)) id = 'c' + hubId(); ids.set(lid, id); }
        others.set(id, { p: plain(m.p), t: Date.now() }); pushPeers(); firePeers(fresh ? [{ peer: id }] : []); }
      else if (m.k === 'e'){ const id = ids.get(lid); if (!id || typeof m.topic !== 'string') return; deliver(m.topic, m.data, id);
        ids.forEach((_, l) => { if (l !== lid) link.send(l, { k: 'e', topic: m.topic, data: m.data, from: id }); }); } };
    link.onLeave = gone;
    // every beat the host says it is alive (the peers list) and drops clients that went silent without closing
    beat = setInterval(() => { pushPeers(); const now = Date.now(); seen.forEach((t, lid) => { if (now - t > HUB_DEAD){ try { link.drop?.(lid); } catch {} gone(lid); } }); }, HUB_BEAT);
  } else {
    const hello = () => link.send(null, { k: 'hi', id: me, p: mine });
    link.onMsg = (_, m) => { if (!alive || !m || typeof m !== 'object') return; lastHost = Date.now();
      if (m.k === 'peers' && Array.isArray(m.list)){ const before = new Set(others.keys()); others.clear();
        m.list.forEach(x => { if (x && x.peer && x.peer !== me) others.set(String(x.peer), { p: plain(x.p), t: +x.t || Date.now() }); });
        const joined = [...others.keys()].filter(k => !before.has(k)).map(peer => ({ peer })), left = [...before].filter(k => !others.has(k)).map(peer => ({ peer }));
        if (joined.length || left.length || m.list.length) firePeers(joined, left); }
      else if (m.k === 'e' && typeof m.topic === 'string') deliver(m.topic, m.data, String(m.from)); };
    link.onState = v => { if (!alive || v === up) return; up = v; lastHost = Date.now(); fireConn(v);
      if (v) hello(); else { const left = [...others.keys()].map(peer => ({ peer })); others.clear(); firePeers([], left); } };
    beat = setInterval(() => { if (!up) return; link.send(null, { k: 'ping' }); if (Date.now() - lastHost > HUB_DEAD){ link.onState(false); link.retry?.(); } }, HUB_BEAT);
    setTimeout(hello, 0);
  }
  return { name,
    emit: async (topic, data) => { if (!alive) return; deliver(topic, data, me); if (link.host) link.send('*', { k: 'e', topic, data, from: me }); else link.send(null, { k: 'e', topic, data }); },
    on: (topic, fn) => { (subs[topic] ||= []).push(fn); return () => { subs[topic] = subs[topic].filter(x => x !== fn); }; },
    presence: async patch => { setMine(patch); if (link.host){ if (alive) link.send('*', { k: 'peers', list: [{ peer: me, p: mine, t: Date.now() }, ...[...others.entries()].map(([peer, o]) => ({ peer, p: o.p, t: o.t }))] }); } else link.send(null, { k: 'p', id: me, p: mine }); firePeers(); },
    peers: snap, onPeers: fn => { peerSubs.add(fn); setTimeout(() => fn({ peers: snap(), joined: snap(), left: [], updated: [] }), 0); return () => peerSubs.delete(fn); },
    connected: () => alive && up, onConnection: fn => { connSubs.add(fn); setTimeout(() => fn(alive && up), 0); return () => connSubs.delete(fn); },
    leave: async () => { if (!alive) return; alive = false; clearInterval(beat); try { link.close(); } catch {} } };
}

// ---------- LAN link (desktop): text through Electron's main process ----------
function lanLink(host, ip){
  const D = window.catroanDesk, parse = t => { try { return JSON.parse(t); } catch { return null; } };
  const L = { host, closed: false, send: (to, obj) => D.lanSend(host ? to : 'host', JSON.stringify(obj)) };
  const off = D.onLan(ev => { if (L.closed) return;
    if (ev.t === 'msg') L.onMsg?.(ev.id, parse(ev.text));
    else if (ev.t === 'leave') L.onLeave?.(ev.id);
    else if (ev.t === 'close'){ L.onState?.(false); L.retry(); } });
  // a client that lost the host keeps trying for a while (the host may have had a hiccup)
  let tries = 0, trying = false;
  L.retry = () => { if (host || L.closed || trying) return; trying = true; tries = 0;
    const again = async () => { if (L.closed) return; const r = await D.lanConnect(ip);
      if (r.ok){ trying = false; L.onState?.(true); } else if (++tries < 20) setTimeout(again, 2000); else trying = false; };
    setTimeout(again, 1000); };
  L.close = () => { L.closed = true; off(); D.lanClose(); };
  return L;
}
async function lanHostRoom(name){
  const r = await window.catroanDesk.lanHost(); if (r.error) throw netErr(r.error);
  return hubRoom(name, lanLink(true));
}
async function lanClientRoom(name, ip){
  const L = lanLink(false, ip), r = await window.catroanDesk.lanConnect(ip);
  if (r.error){ L.close(); throw netErr(r.error); }
  return hubRoom(name, L);
}

// ---------- online link (WebRTC through PeerJS) ----------
let PEER_LIB = null;
function loadPeerJS(){
  if (window.Peer) return Promise.resolve(window.Peer);
  return PEER_LIB ||= new Promise((res, rej) => { const s = document.createElement('script'); s.src = PEERJS_URL; s.async = true;
    s.onload = () => window.Peer ? res(window.Peer) : rej(netErr('peer_lib'));
    s.onerror = () => { PEER_LIB = null; s.remove(); rej(netErr('offline')); };
    document.head.appendChild(s); });
}
const peerCode = e => { const t = e && e.type; return t === 'unavailable-id' ? 'key_taken' : t === 'peer-unavailable' ? 'no_room' : t === 'browser-incompatible' ? 'no_webrtc' : (t === 'network' || t === 'server-error' || t === 'socket-error' || t === 'socket-closed') ? 'offline' : 'upstream_error'; };
function peerOpen(peer){
  return new Promise((res, rej) => { const t = setTimeout(() => rej(netErr('offline')), 12000);
    peer.once('open', () => { clearTimeout(t); res(); }); peer.once('error', e => { clearTimeout(t); rej(netErr(peerCode(e))); }); });
}
async function peerHostRoom(name){
  const Peer = await loadPeerJS(), peer = new Peer(name, { debug: 0 });
  try { await peerOpen(peer); } catch (e){ peer.destroy(); throw e; }
  const conns = new Map(), L = { host: true, closed: false };
  const send = (c, obj) => { try { if (c.open) c.send(JSON.stringify(obj)); } catch {} };
  L.send = (to, obj) => { if (to === '*') conns.forEach(c => send(c, obj)); else { const c = conns.get(to); if (c) send(c, obj); } };
  L.drop = id => { const c = conns.get(id); conns.delete(id); try { c && c.close(); } catch {} };
  L.close = () => { L.closed = true; try { peer.destroy(); } catch {} };
  peer.on('connection', c => { const id = 'p' + hubId();
    c.on('open', () => conns.set(id, c));
    c.on('data', d => { let m = d; if (typeof d === 'string'){ try { m = JSON.parse(d); } catch { return; } } L.onMsg?.(id, m); });
    c.on('close', () => { if (conns.delete(id)) L.onLeave?.(id); });
    c.on('error', () => {}); });
  // losing the PeerJS server only stops new players from finding the room; open connections keep working
  peer.on('disconnected', () => { if (!L.closed) setTimeout(() => { try { if (!L.closed && peer.disconnected) peer.reconnect(); } catch {} }, 2000); });
  peer.on('error', () => {});
  return hubRoom(name, L);
}
async function peerClientRoom(name){
  const Peer = await loadPeerJS(), peer = new Peer({ debug: 0 });
  try { await peerOpen(peer); } catch (e){ peer.destroy(); throw e; }
  const L = { host: false, closed: false }; let conn = null;
  const connect = () => new Promise((res, rej) => {
    const c = peer.connect(name, { reliable: true }); let done = false;
    const fail = code => { if (done) return; done = true; clearTimeout(t); peer.off('error', onErr); try { c.close(); } catch {} rej(netErr(code)); };
    const onErr = e => fail(peerCode(e)), t = setTimeout(() => fail('no_room'), 12000);
    peer.on('error', onErr);
    c.on('open', () => { if (done) return; done = true; clearTimeout(t); peer.off('error', onErr); conn = c; res(); });
    c.on('data', d => { if (conn !== c) return; let m = d; if (typeof d === 'string'){ try { m = JSON.parse(d); } catch { return; } } L.onMsg?.('host', m); });
    c.on('close', () => { if (conn !== c || L.closed) return; conn = null; L.onState?.(false); L.retry(); });
    c.on('error', () => {}); });
  L.send = (_, obj) => { try { if (conn && conn.open) conn.send(JSON.stringify(obj)); } catch {} };
  let trying = false;
  L.retry = () => { if (L.closed || trying) return; trying = true; let tries = 0; if (conn){ try { conn.close(); } catch {} conn = null; }
    const again = async () => { if (L.closed) return; try { if (peer.disconnected) peer.reconnect(); await connect(); trying = false; L.onState?.(true); }
      catch { if (++tries < 20) setTimeout(again, 3000); else trying = false; } };
    setTimeout(again, 1000); };
  L.close = () => { L.closed = true; try { peer.destroy(); } catch {} };
  try { await connect(); } catch (e){ L.close(); throw e; }
  return hubRoom(name, L);
}

// ---------- the base netBase() hands out outside claude.ai ----------
// The host's link follows the menu choice (NET.lan); a player joining with a LAN key tries the LAN first.
function hubBase(){
  return { hub: true, join: async name => {
    const key = String(name).replace(/^catroan-/, '');
    if (NET.joinAsHost) return NET.lan && window.catroanDesk ? lanHostRoom(name) : peerHostRoom(name);
    const ip = lanIPFromKey(key);
    if (ip && !window.catroanDesk) throw netErr('lan_only');   // a LAN room is reachable only from the desktop game
    if (ip){ try { return await lanClientRoom(name, ip); } catch (e){ try { return await peerClientRoom(name); } catch { throw e; } } }
    return peerClientRoom(name);
  } };
}
