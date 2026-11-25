// ================= ENGRAVED WOOD TEXT =================
const ENGR = new Map();
function engraveTex(text, w, h, size, opts = {}){
  const key = text + '|' + w + 'x' + h + '|' + size + (opts.light ? 'L' : '') + (opts.num ? 'N' : '');
  if (ENGR.has(key)) return ENGR.get(key);
  const k = 3, cv = document.createElement('canvas'); cv.width = w*k; cv.height = h*k; const c = cv.getContext('2d'), R = mulberry32(text.length*31 + w);
  const base = opts.light ? ['#c49c6a', '#b48e5e', '#d0a874'] : ['#7a5434', '#6e4a2c', '#86603c'];
  for (let y=0;y<h;y+=2){ c.fillStyle = pick(base, R); c.fillRect(0, y*k, w*k, 2*k); }
  for (let i=0;i<w*h/6;i++){ c.fillStyle = pick(['rgba(40,24,10,.25)', 'rgba(255,220,170,.08)'], R); c.fillRect(Math.floor(R()*w)*k, Math.floor(R()*h)*k, (2 + Math.floor(R()*6))*k, k); }
  c.fillStyle = 'rgba(30,18,8,.5)'; c.fillRect(0, 0, w*k, k); c.fillRect(0, (h - 1)*k, w*k, k);
  c.font = opts.num ? `900 ${size*k}px Verdana, 'DejaVu Sans', Arial, sans-serif` : `700 ${size*k}px 'Pixelify Sans', monospace`; c.textAlign = 'center'; c.textBaseline = 'middle';
  const x = w*k/2, y = h*k/2 + k*.5;
  c.fillStyle = 'rgba(255,225,180,.45)'; c.fillText(text, x + k, y + k*1.2);
  c.fillStyle = '#1a0e06'; c.fillText(text, x - k*.6, y - k*.8);
  c.fillStyle = opts.light ? '#1e1008' : '#24140a'; c.fillText(text, x, y);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter;
  ENGR.set(key, t); return t;
}
function signMesh(text, w, h, size, opts){
  const A = houseAssets(), side = hmat('signside', () => new THREE.MeshStandardMaterial({ map: A.tex.plank.plain, color: 0x8a6440, roughness: .9 }));
  const front = new THREE.MeshStandardMaterial({ map: engraveTex(text, w, h, size, opts), roughness: .9 });
  const m = new THREE.Mesh(GEO.box, [side, side, side, side, front, side]); m.userData.front = front; return m;
}
