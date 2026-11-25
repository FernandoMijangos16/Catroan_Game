// LAN multiplayer pipe for the desktop build. The host's PC runs a WebSocket server on a fixed port; clients connect
// to it by the private IP hidden in the room key. This file only moves text: the room logic lives in the page
// (src/net/net-hub.js), and everything a peer sends is still cleaned by the game before use.
import { ipcMain } from 'electron';
import { WebSocketServer, WebSocket } from 'ws';
import os from 'node:os';

export const LAN_PORT = 47213;
const MAX = 16 * 1024 * 1024;                          // full game snapshots can be large

// private IPv4 of this PC: 192.168 first, then 10/8, then 172.16/12; virtual adapters (Docker, VPN, VMs) skipped
export function lanIP() {
  const skip = /docker|br-|veth|virbr|vmnet|vbox|virtualbox|hyper-v|vethernet|wsl|tun|tap|wg|zt|tailscale|utun|loopback/i;
  const rank = a => a.startsWith('192.168.') ? 0 : a.startsWith('10.') ? 1 : /^172\.(1[6-9]|2\d|3[01])\./.test(a) ? 2 : 9;
  const all = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    if (skip.test(name)) continue;
    for (const i of list || []) if ((i.family === 'IPv4' || i.family === 4) && !i.internal && rank(i.address) < 9) all.push(i.address);
  }
  return all.sort((a, b) => rank(a) - rank(b))[0] || '';
}

export function setupLan(getWin) {
  let server = null, clients = new Map(), nextId = 1, link = null;
  const ev = e => { const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send('lan-ev', e); };
  const stop = () => {
    if (link) { try { link.terminate(); } catch {} link = null; }
    if (server) { clients.forEach(s => { try { s.terminate(); } catch {} }); clients.clear(); try { server.close(); } catch {} server = null; }
  };

  ipcMain.on('lan-ip', e => { e.returnValue = lanIP(); });

  ipcMain.handle('lan-host', () => new Promise(res => {
    stop();
    const s = new WebSocketServer({ port: LAN_PORT, maxPayload: MAX });
    s.once('error', err => { res({ error: err.code === 'EADDRINUSE' ? 'port_busy' : 'lan_error' }); try { s.close(); } catch {} });
    s.once('listening', () => { server = s; res({ ok: true }); });
    s.on('connection', ws => {
      const id = 'lan' + nextId++; clients.set(id, ws); ev({ t: 'join', id });
      ws.on('message', d => ev({ t: 'msg', id, text: String(d) }));
      ws.on('close', () => { if (clients.delete(id)) ev({ t: 'leave', id }); });
      ws.on('error', () => {});
    });
  }));

  ipcMain.handle('lan-connect', (_e, ip) => new Promise(res => {
    stop();
    if (!/^(192\.168|10|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+(\.\d+)?$/.test(String(ip))) return res({ error: 'lan_bad_key' });
    const ws = new WebSocket(`ws://${ip}:${LAN_PORT}`, { maxPayload: MAX, handshakeTimeout: 4000 });
    let opened = false;
    ws.on('open', () => { opened = true; link = ws; res({ ok: true }); });
    ws.on('message', d => ev({ t: 'msg', id: 'host', text: String(d) }));
    ws.on('close', () => { if (link === ws) link = null; if (opened) ev({ t: 'close' }); else res({ error: 'lan_unreachable' }); });
    ws.on('error', () => {});
  }));

  ipcMain.on('lan-send', (_e, id, text) => {
    text = String(text);
    if (link) { if (link.readyState === WebSocket.OPEN) link.send(text); return; }
    if (!server) return;
    if (id === '*') clients.forEach(s => s.readyState === WebSocket.OPEN && s.send(text));
    else { const s = clients.get(id); if (s && s.readyState === WebSocket.OPEN) s.send(text); }
  });

  ipcMain.on('lan-close', stop);
  return stop;
}
