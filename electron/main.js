// SwapHolm desktop: an Electron window that loads the offline build (dist/desktop/) through a private app:// scheme.
// A real scheme (instead of file://) lets the page load its ES modules and keeps a stable origin for localStorage.
import { app, BrowserWindow, protocol, net, Menu } from 'electron';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { setupLan } from './lan.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', 'dist', 'desktop');
let win = null;
// the game was called Catroan: keep its data folder so saved preferences survive the new name
app.setPath('userData', path.join(app.getPath('appData'), 'catroan'));

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 960, minHeight: 600,
    show: false, backgroundColor: '#0d1114', title: 'SwapHolm',
    icon: path.join(HERE, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, preload: path.join(HERE, 'preload.cjs') },
  });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });
  // F11 toggles full screen and F12 / Ctrl+Shift+I the developer console (there is no menu bar to hold the shortcuts)
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    else if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) { win.webContents.toggleDevTools(); e.preventDefault(); }
  });
  // links that try to open a new window are blocked: the game never needs one
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.loadURL('app://catroan/index.html');
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  protocol.handle('app', req => {
    const rel = decodeURIComponent(new URL(req.url).pathname);
    const file = path.normalize(path.join(ROOT, rel));
    if (!file.startsWith(ROOT + path.sep)) return new Response('', { status: 403 });   // stay inside dist/desktop
    return net.fetch(pathToFileURL(file).toString());
  });
  setupLan(() => win);
  createWindow();
});

app.on('window-all-closed', () => app.quit());
