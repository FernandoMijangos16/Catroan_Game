// Bridge between the game page and the main process: only the LAN multiplayer pipe, nothing else from Node.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('catroanDesk', {
  lanIP: () => ipcRenderer.sendSync('lan-ip'),                     // best private IPv4 of this PC, or ''
  lanHost: () => ipcRenderer.invoke('lan-host'),                   // start the room server → { ok } | { error }
  lanConnect: ip => ipcRenderer.invoke('lan-connect', ip),         // connect to a host → { ok } | { error }
  lanSend: (id, text) => ipcRenderer.send('lan-send', id, text),   // host: to client id ('*' = all) · client: id is ignored
  lanClose: () => ipcRenderer.send('lan-close'),                   // stop server / drop connection
  onLan: fn => { const h = (_e, ev) => fn(ev); ipcRenderer.on('lan-ev', h); return () => ipcRenderer.removeListener('lan-ev', h); },
});
