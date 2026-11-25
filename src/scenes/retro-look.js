// ================= RETRO LOOK (pixel textures + low-res dithered render) =================
const TEX = {};
function pixTex(name, size, fn){
  if (TEX[name]) return TEX[name];
  const cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d');
  const img = c.createImageData(size, size), r = mulberry32(size*977 + name.length*131 + name.charCodeAt(0));
  for (let y=0;y<size;y++) for (let x=0;x<size;x++){
    let v = fn(x, y, r); if (typeof v === 'number') v = [v, v, v];
    const i = (y*size + x)*4; img.data[i] = clamp(v[0],0,255); img.data[i+1] = clamp(v[1],0,255); img.data[i+2] = clamp(v[2],0,255); img.data[i+3] = 255;
  }
  c.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  TEX[name] = t; return t;
}
// tileable value noise on an integer lattice of period p
function tnoise(x, y, p, s){ const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf*xf*(3-2*xf), v = yf*yf*(3-2*yf); const h = (a,b) => hash2(((a % p) + p) % p, ((b % p) + p) % p, s); const a = h(xi,yi), b = h(xi+1,yi), c = h(xi,yi+1), d = h(xi+1,yi+1); return a + (b-a)*u + (c-a)*v + (a-b-c+d)*u*v; }
function cellular(x, y, size, n, seed){
  const pts = []; const r = mulberry32(seed); for (let i=0;i<n;i++) pts.push([r()*size, r()*size, r()]);
  let d1 = 1e9, d2 = 1e9, id = 0;
  for (const [px, py, k] of pts) for (let ox=-1; ox<=1; ox++) for (let oy=-1; oy<=1; oy++){
    const dx = x - (px + ox*size), dy = y - (py + oy*size), d = Math.hypot(dx, dy);
    if (d < d1){ d2 = d1; d1 = d; id = k; } else if (d < d2) d2 = d;
  }
  return [d1, d2, id];
}
const TEXGEN = {
  ground: () => pixTex('ground', 32, (x,y,r) => { let v = 222 + (tnoise(x/4, y/4, 8, 3) - .5)*40 + (r() - .5)*22; if (r() < .07) v -= 38; if (r() < .03) v += 25; return v; }),
  dirt: () => pixTex('dirt', 32, (x,y,r) => { let v = 214 + (tnoise(x/5, y/5, 6.4, 5) - .5)*36 + (r() - .5)*20; if (hash2(x >> 1, y >> 1, 9) < .05) v = 245; if (hash2(x >> 1, (y - 1) >> 1, 9) < .05 && (y & 1)) v = 168; return v; }),
  stone: () => pixTex('stone', 32, (x,y,r) => { const [d1, d2, id] = cellular(x + .5, y + .5, 32, 14, 77); if (d2 - d1 < 1.3) return 128; let v = 205 + (id - .5)*40 + (r() - .5)*14; if (d2 - d1 < 2.4) v -= 18; return v; }),
  plaster: () => pixTex('plaster', 32, (x,y,r) => { let v = 238 + (r() - .5)*10 + (tnoise(x/6, y/6, 5.33, 11) - .5)*18; if (tnoise(x/3, y/3, 10.67, 12) > .82) v -= 22; return v; }),
  brick: () => pixTex('brick', 32, (x,y,r) => { const row = Math.floor(y/6), off = (row % 2)*6, col = Math.floor((x + off)/12); if (y % 6 === 5 || (x + off) % 12 === 11) return 238; return 192 + (hash2(col, row, 4) - .5)*50 + (r() - .5)*16; }),
  wood: () => pixTex('wood', 32, (x,y,r) => { const pl = Math.floor(x/8); if (x % 8 === 7) return 135; let v = 205 + (hash2(pl, 0, 6) - .5)*30 + Math.sin(y*.55 + pl*2.1 + Math.sin(x*.9)*1.2)*12 + (r() - .5)*10; if (hash2(pl, Math.floor(y/9), 8) < .12 && (x % 8) > 2 && (x % 8) < 6 && (y % 9) > 3 && (y % 9) < 6) v -= 45; return v; }),
  roof: () => pixTex('roof', 32, (x,y,r) => { const row = Math.floor(y/8), yy = y % 8, off = (row % 2)*4; if ((x + off) % 8 === 0 && yy < 6) return 150; if (yy >= 6) return 130 + yy*4; return 236 - yy*6 + (hash2(Math.floor((x + off)/8), row, 2) - .5)*30 + (r() - .5)*10; }),
  thatch: () => pixTex('thatch', 32, (x,y,r) => { const k = hash2(x, Math.floor(y/5 + hash2(x, 0, 3)*4), 7); let v = 175 + k*70; if (y % 10 === 9) v -= 45; return v; }),
  bark: () => pixTex('bark', 32, (x,y,r) => { let v = 190 + (tnoise(x*1.2, y/6, 38.4, 13) - .5)*70; if (tnoise(x*.9, y/3, 28.8, 14) > .74) v -= 55; return v + (r() - .5)*10; }),
  rock: () => pixTex('rock', 32, (x,y,r) => { let v = 210 + (tnoise(x/4, y/4, 8, 15) - .5)*60 + (r() - .5)*18; const [d1, d2] = cellular(x + .5, y + .5, 32, 6, 21); if (d2 - d1 < 1.1) v -= 50; return v; }),
  boardGround: () => pixTex('boardGround', 16, (x,y,r) => 228 + (tnoise(x/3, y/3, 5.33, 31) - .5)*22 + (r() - .5)*8),
  leaf: () => pixTex('leaf', 32, (x,y,r) => { const n = tnoise(x/2.5, y/2.5, 12.8, 16); let v = 205 + (n - .5)*90; if (r() < .05) v += 30; return v; }),
};
function texturize(m, kind, scale, wind){
  if (kind){ m.map = TEXGEN[kind](); m.userData.texScale = scale ?? TEX_SCALE[kind] ?? .35; }
  m.onBeforeCompile = sh => {
    let vs = sh.vertexShader, fs = sh.fragmentShader;
    if (wind){
      sh.uniforms.uTime = WIND;
      const tree = typeof wind === 'number';
      vs = 'uniform float uTime;\n' + vs.replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 wp0 = vec3(modelMatrix[3]);
        #ifdef USE_INSTANCING
          wp0 += vec3(instanceMatrix[3]);
        #endif
        float hgt = ${tree ? 'max(0.0, position.y - 1.5)' : 'max(0.0, position.y + 1.0)'};
        float amp = ${tree ? wind.toFixed(4) : '0.045'};
        float gust = .75 + .25*sin(uTime*.37 + wp0.x*.02);
        transformed.x += sin(uTime*1.25 + wp0.x*.15 + wp0.z*.1 + position.y*.15) * amp * hgt * gust;
        transformed.z += cos(uTime*1.05 + wp0.z*.13 + wp0.x*.05) * amp * .7 * hgt * gust;`);
    }
    if (kind){
      sh.uniforms.uTexScale = { value: m.userData.texScale };
      vs = vs.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNrm;')
             .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvec4 tp0 = vec4(transformed, 1.0); vec3 tn0 = objectNormal;\n#ifdef USE_INSTANCING\n tp0 = instanceMatrix * tp0; tn0 = mat3(instanceMatrix) * tn0;\n#endif\nvWPos = (modelMatrix * tp0).xyz;\nvWNrm = normalize(mat3(modelMatrix) * tn0);');
      fs = fs.replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nvarying vec3 vWNrm;\nuniform float uTexScale;')
             .replace('#include <map_fragment>', `vec3 bw = pow(abs(normalize(vWNrm)), vec3(4.0)); bw /= (bw.x + bw.y + bw.z + 1e-4);
               vec3 sp = vWPos * uTexScale;
               vec4 tx = texture2D(map, sp.zy)*bw.x + texture2D(map, sp.xz)*bw.y + texture2D(map, sp.xy)*bw.z;
               diffuseColor.rgb *= tx.rgb * 1.08;`);
    }
    sh.vertexShader = vs; sh.fragmentShader = fs;
  };
  m.customProgramCacheKey = () => 'retro' + (kind ? 't' : '') + (wind ? 'w' + (typeof wind === 'number' ? wind : '') : '');
  m.needsUpdate = true;
  return m;
}
const TEX_SCALE = { ground: .25, dirt: .32, stone: .34, plaster: .34, brick: .4, wood: .5, roof: .5, thatch: .5, bark: .7, rock: .35, leaf: .5 };
texturize(LP_MAT, 'ground');
const lpTex = (kind, scale) => { const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1, metalness: 0 }); texturize(m, kind, scale); CACHED_MATS.add(m); return m; };
const LP_BOARD = lpTex('ground', .62), LP_ROOF = lpTex('roof'), LP_THATCH = lpTex('thatch'), LP_STONE = lpTex('stone');

// ---- low resolution render + ordered dithering + limited palette
const RETRO = { on: true, px: 2 };

let retroRT = null, boardRT = null;
const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const postMat = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: null }, uPix: { value: 1 }, uLevels: { value: 28 }, uDither: { value: 1 }, uGrade: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uPix; uniform float uLevels; uniform float uDither; uniform float uGrade; varying vec2 vUv;
    float B2(vec2 a){ a = floor(a); return fract(a.x/2.0 + a.y*a.y*.75); }
    float B4(vec2 a){ return B2(.5*a)*.25 + B2(a); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      c = pow(max(c, 0.0), vec3(1.0/2.2));
      float l = dot(c, vec3(.299, .587, .114));
      vec3 gr = mix(vec3(l), c, .74) * vec3(1.03, .95, .82);
      gr = pow(max(gr, 0.0), vec3(1.08))*.96 + vec3(.022, .016, .01);
      vec2 vd = vUv - .5; gr *= 1.0 - dot(vd, vd)*.55;
      c = mix(c, gr, uGrade);
      float d = (B4(gl_FragCoord.xy/uPix) - .5)*uDither;
      c += d/uLevels;
      c = floor(c*uLevels + .5)/uLevels;
      gl_FragColor = vec4(c, 1.0);
    }`,
  depthTest: false, depthWrite: false,
});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));
function makeRT(px){ return new THREE.WebGLRenderTarget(Math.max(160, Math.round(innerWidth/px)), Math.max(100, Math.round(innerHeight/px)), { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: true }); }
function boardSize(){ const pr = renderer.getPixelRatio(); return [Math.round(innerWidth*pr), Math.round(innerHeight*pr)]; }
function retroSize(){
  if (retroRT) retroRT.setSize(Math.max(160, Math.round(innerWidth/RETRO.px)), Math.max(100, Math.round(innerHeight/RETRO.px)));
  if (boardRT){ const [w, h] = boardSize(); boardRT.setSize(w, h); }
}
addEventListener('resize', retroSize);
function renderScene(sc){
  const board = sc === boardScene;
  let rt;
  if (board){
    if (!boardRT){ const [w, h] = boardSize(); boardRT = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, samples: 4 }); }
    rt = boardRT; postMat.uniforms.uDither.value = 0; postMat.uniforms.uLevels.value = 255; postMat.uniforms.uGrade.value = .95; postMat.uniforms.uPix.value = 1;
  } else {
    if (!RETRO.on){ rt = boardRT || null; }
    if (RETRO.on){ rt = retroRT ||= makeRT(RETRO.px); postMat.uniforms.uDither.value = 1; postMat.uniforms.uLevels.value = 30; postMat.uniforms.uPix.value = RETRO.px*renderer.getPixelRatio(); }
    else { if (!boardRT){ const [w, h] = boardSize(); boardRT = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true, samples: 4 }); } rt = boardRT; postMat.uniforms.uDither.value = 0; postMat.uniforms.uLevels.value = 255; postMat.uniforms.uPix.value = 1; }
    postMat.uniforms.uGrade.value = 1;
  }
  postMat.uniforms.tDiffuse.value = rt.texture;
  renderer.setRenderTarget(rt); renderer.render(sc, camera);
  renderer.setRenderTarget(null); renderer.render(postScene, postCam);
}
function setRetro(on){ RETRO.on = on; document.body.classList.toggle('retro', on); }

