// ================= AVATARS (front photos of the game's people and animals) =================
const AVATARS = [   // one face per trade, each with its own mood
  { id: 'campesino', role: 'campesino', g: 'm', s: 7, o: { expr: 'sonrisa' } },
  { id: 'leñadora', role: 'leñador', g: 'f', s: 21, o: { expr: 'serio' } },
  { id: 'minero', role: 'minero', g: 'm', s: 26, o: { expr: 'cansado', must: true, beard: false } },
  { id: 'pastora', role: 'pastor', g: 'f', s: 25, o: { expr: 'duda', hat: 'paja' } },
  { id: 'ladrillera', role: 'alfarero', g: 'f', s: 28, o: { expr: 'sonrisa', hat: 'paliacate' } },
  { id: 'pescador', role: 'pescador', g: 'm', s: 27, o: { expr: 'serio', beard: true, hair: 0x8a8580 } },
  { id: 'herrero', role: 'herrero', g: 'm', s: 3, o: { expr: 'enojo', beard: true, hair: 0x2b1d14 } },
  { id: 'panadera', role: 'panadero', g: 'f', s: 5, o: { expr: 'risa' } },
  { id: 'guardia', role: 'guardia', g: 'm', s: 9, o: { expr: 'serio', must: true, beard: false } },
  { id: 'comerciante', role: 'comerciante', g: 'f', s: 2, o: { expr: 'guiño' } },
  { id: 'doctora', role: 'doctor', g: 'f', s: 41, o: { expr: 'serio', hat: null } },
  { id: 'carnicero', role: 'carnicero', g: 'm', s: 42, o: { expr: 'risa', must: true, beard: false, hair: 0x111111 } },
  { id: 'carpintero', role: 'carpintero', g: 'm', s: 43, o: { expr: 'guiño', beard: false } },
  { id: 'brujo', role: 'brujo', g: 'm', s: 44, o: { expr: 'serio' } },
  { id: 'pirata', make: 'pirata', s: 45, o: { expr: 'enojo', beard: true, hair: 0x4a3020 } },
  { id: 'abuelo', role: 'anciano', g: 'm', s: 13, o: { expr: 'sonrisa', beard: true } },
  { id: 'abuela', role: 'anciano', g: 'f', s: 31, o: { expr: 'triste' } },
  { id: 'niña', role: 'niño', g: 'f', s: 12, o: { expr: 'sorpresa' } },
  { id: 'niño', role: 'niño', g: 'm', s: 30, o: { expr: 'risa' } },
  { id: 'oveja', animal: 'oveja', s: 1 }, { id: 'caballo', animal: 'caballo', s: 11 }, { id: 'cerdo', animal: 'cerdo', s: 6 }, { id: 'gallina', animal: 'gallina', s: 7 }, { id: 'cabra', animal: 'cabra', s: 8 }, { id: 'ciervo', animal: 'ciervo', s: 9 }, { id: 'conejo', animal: 'conejo', s: 10 }, { id: 'perro', animal: 'perro', s: 2 }, { id: 'gato', animal: 'gato', s: 3 }, { id: 'vaca', animal: 'vaca', s: 4 },
];
const avOk = id => AVATARS.some(a => a.id === id) ? id : 'campesino';
const AV_CV = new Map();
function avatarCanvas(id){
  const key = typeof id === 'object' ? id.id : id; if (AV_CV.has(key)) return AV_CV.get(key);
  const a = typeof id === 'object' ? id : AVATARS.find(x => x.id === id) || AVATARS[0], cv = document.createElement('canvas'); cv.width = 64; cv.height = 72;
  const c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, 0, 72); g.addColorStop(0, '#5a4a3a'); g.addColorStop(1, '#2a2018'); c.fillStyle = g; c.fillRect(0, 0, 64, 72);
  if (snapInit()){
    let o, look;
    if (a.animal){ const an = makeAnimal(a.animal, mulberry32(a.s)); o = an.g; o.rotation.y = -.42; if (an.head){ o.updateMatrixWorld(true); look = an.head.getWorldPosition(new THREE.Vector3()); look.y -= .03; } }
    else { const p = a.make === 'pirata' ? pirateModel(mulberry32(a.s*97), a.o) : makePerson(mulberry32(a.s*97), a.role, a.g, '#7a6a5a', a.o || {}); if (a.nandor) useNandorHead(p); o = p.g; o.updateMatrixWorld(true); look = p.head.getWorldPosition(new THREE.Vector3()); look.y += .22*(p.S || 1); }
    SNAP.sc.add(o); o.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(o), sz = b.getSize(new THREE.Vector3());
    const headLook = !!look; if (!look){ look = b.getCenter(new THREE.Vector3()); look.y = b.max.y - sz.y*.32; look.z = b.max.z - sz.z*.18; }
    if (!a.animal) look.y += .04;
    const d = a.animal ? (headLook ? ({ vaca: 2, caballo: 2.5, ciervo: 1.3, oveja: 1.3, cabra: 1.1, cerdo: 1.05, conejo: .95, gato: .8 }[a.animal] || .8) : Math.max(sz.y, sz.x)*1.05) : 1.12;
    SNAP.cam.position.set(look.x + d*.16, look.y + d*.04, look.z + d*1.12); SNAP.cam.lookAt(look.x, look.y - (a.animal ? 0 : .04), look.z);
    SNAP.r.render(SNAP.sc, SNAP.cam); c.imageSmoothingEnabled = false; c.drawImage(SNAP.r.domElement, 10, 2, 76, 86, 0, 0, 64, 72);
    SNAP.sc.remove(o);
  }
  AV_CV.set(key, cv); return cv;
}
const avatarURL = id => avatarCanvas(id).toDataURL();
function chooseAvatar(){
  openModal(`<h3>Elige tu avatar</h3><p class="muted">Un retrato de alguien de la isla.</p><div class="avgrid">${AVATARS.map(a => `<button class="av ${G.players[0].avatar === a.id ? 'on' : ''}" data-av="${a.id}"><img src="${avatarURL(a.id)}"><span>${a.id}</span></button>`).join('')}</div><div class="row end"><button data-x="1">Cerrar</button></div>`);
  modalBody.onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.x){ closeModal(); return; } if (b.dataset.av){ G.players[0].avatar = b.dataset.av; try { localStorage.setItem('hexterra-avatar', b.dataset.av); } catch {} closeModal(); SFX.click?.(); updatePlates(true); } };
}
// a slatted wooden crate holding one of each resource (stands for "resource cards" on the signs)
function crateModel(){
  const A = houseAssets(), g = new THREE.Group(), box = new THREE.Group(); g.add(box);
  const wood = hmat('crW', () => new THREE.MeshStandardMaterial({ map: A.tex.plank.plain, color: 0xc49464, roughness: .9 }));
  const dark = hmat('crD', () => new THREE.MeshStandardMaterial({ map: A.tex.plank.plain, color: 0x6a4a2c, roughness: .9 }));
  const W = 1.05, D = .85;
  box.add(mesh(GEO.box, dark, 0, 0, 0, W, .07, D));
  [-D/2, D/2].forEach(z => [.05, .27, .49].forEach(y => box.add(mesh(GEO.box, wood, 0, y, z, W, .17, .05))));
  [-W/2, W/2].forEach(x => [.05, .27, .49].forEach(y => box.add(mesh(GEO.box, wood, x, y, 0, .05, .17, D))));
  [-W/2, W/2].forEach(x => [-D/2, D/2].forEach(z => box.add(mesh(GEO.box, dark, x, 0, z, .11, .7, .11))));
  [-D/2 - .03, D/2 + .03].forEach(z => { const b = mesh(GEO.box, dark, -.28, .06, z, .07, .78, .03); b.rotation.z = -.78; box.add(b); });
  outlineItem(box);
  [['madera', -.22, .55, -.15, .2], ['ladrillo', .22, .53, -.18, -.4], ['trigo', 0, .64, .02, .9], ['lana', -.2, .56, .2, .3], ['mineral', .22, .55, .2, -.2]].forEach(([r, x, y, z, ry]) => { const it = makeResourceItem(r); it.scale.setScalar(.46); it.position.set(x, y, z); it.rotation.y = ry; g.add(it); });
  return g;
}
