// ================= MODEL SNAPSHOTS (images of 3D models for the scrolls) =================
const SNAP = { r: null, cache: new Map() };
function snapModel(key, make){
  if (SNAP.cache.has(key)) return SNAP.cache.get(key);
  if (!SNAP.r){ try { SNAP.r = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true }); SNAP.r.setSize(96, 96); SNAP.r.setPixelRatio(1); SNAP.r.outputColorSpace = THREE.SRGBColorSpace;
    SNAP.sc = new THREE.Scene(); SNAP.sc.add(new THREE.HemisphereLight(0xfff4e0, 0x4a3a2a, 2.3)); const dl = new THREE.DirectionalLight(0xfff0d8, 2.6); dl.position.set(2, 3, 2.5); SNAP.sc.add(dl); SNAP.cam = new THREE.PerspectiveCamera(30, 1, .02, 30); } catch { return ''; } }
  const o = make(); o.rotation.y += -.5; o.rotation.z = .12; SNAP.sc.add(o);
  const b = new THREE.Box3().setFromObject(o), c = b.getCenter(new THREE.Vector3()), sz = b.getSize(new THREE.Vector3()).length();
  SNAP.cam.position.set(c.x + sz*.35, c.y + sz*.55, c.z + sz*1.25); SNAP.cam.lookAt(c); SNAP.r.render(SNAP.sc, SNAP.cam);
  const url = SNAP.r.domElement.toDataURL(); SNAP.sc.remove(o); SNAP.cache.set(key, url); return url;
}
function robberModel(){ const g = new THREE.Group(); g.add(mesh(GEO.cyl, 0x2b2b30, 0, 0, 0, .08, .24, .08)); g.add(mesh(GEO.sphere, 0x2b2b30, 0, .3, 0, .075, .075, .075)); return outlineItem(g); }
