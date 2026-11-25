// ================= PLAYER PLATES =================
let PLATE_URL = '';
function plateURL(){ if (PLATE_URL) return PLATE_URL; const t = document.createElement('canvas'); t.width = t.height = 32; const c = t.getContext('2d'), R = mulberry32(17); c.fillStyle = '#3e2a18'; c.fillRect(0, 0, 32, 32); for (let i=0;i<60;i++){ c.fillStyle = pick(['#4a3220', '#35230f', '#523822'], R); c.fillRect(Math.floor(R()*32), Math.floor(R()*32), 3 + Math.floor(R()*6), 1); } PLATE_URL = t.toDataURL(); return PLATE_URL; }

