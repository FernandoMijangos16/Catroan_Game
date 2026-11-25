// ================= PARCHMENT SCROLL MESSAGES =================
let PAPER_URL = '';
function paperURL(){
  if (PAPER_URL) return PAPER_URL;
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'), R = mulberry32(31);
  c.fillStyle = '#e8d6ae'; c.fillRect(0, 0, 64, 64);
  for (let i=0;i<500;i++){ c.fillStyle = pick(['#dcc89c', '#f0e2c0', '#d4bf92', '#ecdcb6', '#c9b282'], R); c.fillRect(Math.floor(R()*64), Math.floor(R()*64), 1 + Math.floor(R()*2), 1); }
  for (let i=0;i<5;i++){ c.fillStyle = 'rgba(140,100,50,.07)'; c.beginPath(); c.arc(R()*64, R()*64, 4 + R()*10, 0, 7); c.fill(); }
  PAPER_URL = cv.toDataURL(); return PAPER_URL;
}
const SCR = { q: [], busy: false, wait: [] };
const scrollIdle = () => SCR.busy ? new Promise(r => SCR.wait.push(r)) : Promise.resolve();
function scrollMsg(html, color){
  const pi = G ? G.players.findIndex(P => P.color === color) : -1;
  SCR.q.push({ html, color: pi >= 0 ? color : '#8a6a3a', p: pi, spec: actionSpec(html, color) });
  if (SCR.q.length > 6) SCR.q.splice(0, SCR.q.length - 6);
  if (!SCR.busy) nextScroll();
}

