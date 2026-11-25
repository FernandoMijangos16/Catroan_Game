// ================= PLAYER-COLOR GLOWING CONTOUR AROUND CONSTRUCTIONS =================
const OUT_T = { value: 0 }, OUT_MATS = new Map();
function contourMats(color){
  const key = String(color); if (OUT_MATS.has(key)) return OUT_MATS.get(key);
  const mk = (col, w, glow) => keepMat(new THREE.ShaderMaterial({
    uniforms: { col: { value: new THREE.Color(col) }, w: { value: w }, t: OUT_T }, side: THREE.BackSide,
    vertexShader: 'uniform float w; void main(){ vec3 n = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position, 1.); mv.xyz += n*(-mv.z)*w; gl_Position = projectionMatrix*mv; }',
    fragmentShader: glow ? 'uniform vec3 col; uniform float t; void main(){ gl_FragColor = vec4(min(col*(1.05 + .25*sin(t*3.)) + .08, vec3(1.)), 1.); }' : 'uniform vec3 col; void main(){ gl_FragColor = vec4(col, 1.); }',
  }));
  const c = new THREE.Color(color), m = { glow: mk(c, .0019, true), dark: mk(0x120b05, .003, false) };
  OUT_MATS.set(key, m); return m;
}
function silhouette(group){
  group.updateMatrixWorld(true);
  const inv = group.matrixWorld.clone().invert(), parts = [];
  group.traverse(o => {
    if (!o.isMesh || o.userData.outline || o.userData.glow) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    Object.keys(g.attributes).forEach(k => { if (k !== 'position' && k !== 'normal') g.deleteAttribute(k); });
    if (!g.attributes.normal) g.computeVertexNormals();
    g.clearGroups(); g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)); parts.push(g);
  });
  if (!parts.length) return null;
  const m = mergeGeometries(parts); parts.forEach(p => p.dispose()); return m;
}
function addContour(group, color){
  const geo = silhouette(group); if (!geo) return;
  const M = contourMats(color);
  [M.dark, M.glow].forEach(mt => { const h = new THREE.Mesh(geo, mt); h.userData.outline = true; h.raycast = () => {}; group.add(h); });
}
function stepDecals(t){ OUT_T.value = t; }

