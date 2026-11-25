# Exports every 3D model of Hexterra to assets/models/<category>/<name>.glb, as if owned by the black player.
# Runs the readable build in headless Chrome and uses three.js' GLTFExporter.  Usage: python3 tools/export-glb.py
import asyncio, base64, json, os, sys
from playwright.async_api import async_playwright
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T3 = os.environ.get('THREE_DIR', '/tmp/t3/node_modules/three/')
HTML = open(os.path.join(ROOT, 'dist/catroan.dev.html')).read()
HOOK = r"""
window.__exp = (() => {
  const BLACK = '#151515', R = s => mulberry32(s);
  const into = fn => { const g = new THREE.Group(); const pg = GH; GH = () => 0; try { fn(g); } finally { GH = pg; } return g; };
  const L = [];
  const add = (cat, name, make) => L.push({ cat, name, make });
  AVATARS.forEach(a => { if (a.animal) return; add('personas', a.id, () => a.make === 'pirata' ? pirateModel(R(a.s*97), a.o).g : makePerson(R(a.s*97), a.role, a.g, BLACK, a.o || {}).g); });
  ['vecino', 'comerciante', 'guardia'].forEach((r, i) => add('personas', r + '-2', () => makePerson(R(500 + i), r, i % 2 ? 'f' : 'm', BLACK).g));
  add('personas', 'jinete', () => riderModel(BLACK, R(3)).g || riderModel(BLACK, R(3)));
  ['oveja', 'cabra', 'vaca', 'cerdo', 'gallina', 'caballo', 'perro', 'gato', 'ciervo', 'conejo'].forEach(k => add('animales', k, () => makeAnimal(k, R(7)).g));
  add('animales', 'caballo-de-montar', () => horseModel(R(5), BLACK).g);
  RES.forEach(k => add('recursos', k, () => makeResourceItem(k)));
  SPK.forEach(k => add('objetos', k, () => makeSpecialItem(k)));
  AMK.forEach(k => add('amuletos', k, () => amuletModel(k)));
  Object.keys(CARD_DEFS).forEach(k => add('cartas', k, () => cardModel(k)));
  add('cartas', 'reverso', () => { const g = cardMesh(); g.traverse(o => { if (o.isMesh && Array.isArray(o.material)) o.material = o.material.map((m, k) => k >= 4 ? new THREE.MeshStandardMaterial({ map: cardBackTex(BLACK), roughness: .8 }) : m); }); return g; });
  add('trofeos', 'ejercito', () => trophyModel('army')); add('trofeos', 'camino-mas-largo', () => trophyModel('road'));
  const ICK = [...new Set([...Object.values(EMO), ...[...iconModel.toString().matchAll(/case '([a-z\-]+)'/g)].map(m => m[1])])].filter(k => !RES.includes(k) && !k.startsWith('cara:'));
  ICK.forEach(k => add('iconos', k, () => iconModel(k)));
  ['sonrisa', 'serio', 'risa', 'cansado', 'duda', 'triste', 'sorpresa', 'guino', 'enojo'].forEach(e => { if (!L.some(x => x.name === 'cara-' + e)) add('iconos', 'cara-' + e, () => iconModel('cara:' + (e === 'guino' ? 'guiño' : e))); });
  add('tablero', 'pueblo', () => { const P = G.players[0], c = P.color; P.color = BLACK; try { return modelObj('pueblo', 0); } finally { P.color = c; } });
  add('tablero', 'ciudad', () => { const P = G.players[0], c = P.color; P.color = BLACK; try { return modelObj('ciudad', 0); } finally { P.color = c; } });
  add('tablero', 'camino', () => { const P = G.players[0], c = P.color; P.color = BLACK; try { return modelObj('camino', 0); } finally { P.color = c; } });
  add('tablero', 'ladron', () => robberModel()); add('tablero', 'dado', () => makeDie());
  [['casa', 3.6, 3.8, 2.7, { wallTex: 'plaster' }], ['cabana', 3.2, 3.4, 2.4, { wallTex: 'wood', roofKind: 'thatch' }], ['casa-alta', 4.2, 4.2, 4.8, { wallTex: 'plaster', roofKind: 'tile', chimney: true }], ['casa-piedra', 3.8, 4.2, 2.9, { wallTex: 'rock', timber: false }], ['torre', 3.2, 3.2, 7.4, { wallTex: 'rock', roofKind: 'tile' }]].forEach(([n, w, d, h, o], i) => add('edificios', n, () => into(g => house(g, 0, 0, w, d, h, '#e8dcc0', 0xa8503a, 0, R(20 + i), o))));
  Object.keys(SHOP_DEFS).forEach(k => add('edificios', 'letrero-' + k, () => shopIcon(k, BLACK)));
  add('edificios', 'molino', () => into(g => windmill(g, 0, 0, 0, [])));
  add('edificios', 'horno-ladrillos', () => into(g => kiln(g, 0, 0, [])));
  add('edificios', 'cartel-misiones', () => into(g => questBoard(g, 0, .001, R(4), [])));
  add('naturaleza', 'pino', () => into(g => pineMesh(g, 0, 0, 1, R(1)))); add('naturaleza', 'arbol-hojas', () => into(g => leafTreeMesh(g, 0, 0, 1, R(2))));
  add('naturaleza', 'arbusto', () => into(g => bush(g, 0, 0, 1, R(3)))); add('naturaleza', 'roca', () => into(g => rock(g, 0, 0, 1, R(4))));
  add('naturaleza', 'cactus', () => into(g => cactus(g, 0, 0, 1))); add('naturaleza', 'pajar', () => into(g => haystack(g, 0, 0)));
  add('objetos-escena', 'barril', () => into(g => barrel(g, 0, 0, R(5)))); add('objetos-escena', 'banca', () => into(g => bench(g, 0, 0, 0)));
  add('objetos-escena', 'farol', () => into(g => lantern(g, 0, 0))); add('objetos-escena', 'carreta', () => into(g => cart(g, 0, 0, 0, R(6), true)));
  add('objetos-escena', 'lena', () => into(g => woodPile(g, 0, 0, 0))); add('objetos-escena', 'bandera', () => into(g => flag(g, 0, 0, BLACK, [], 3)));
  add('objetos-escena', 'ladrillos', () => into(g => brickStack(g, 0, 0, R(8))));
  add('objetos-escena', 'caja-recursos', () => crateModel()); add('objetos-escena', 'caja-amuletos', () => chestModel());
  add('objetos-escena', 'sello', () => stampModel(0x2a7a3a, 'SÍ')); add('objetos-escena', 'tintero-sello', () => inkPadModel(0x2a7a3a));
  add('objetos-escena', 'campana', () => bellModel()); add('objetos-escena', 'costal', () => sackModel());
  add('objetos-escena', 'pluma', () => quill3D()); add('objetos-escena', 'sello-cera', () => waxSeal3D(BLACK, true));
  add('objetos-escena', 'barco', () => shipModel(R(9)).g || shipModel(R(9)));
  add('objetos-escena', 'letrero-madera', () => { const b = rusticBoard(160, 100, 2); b.scale.setScalar(.01); return b; });
  add('objetos-escena', 'mano', () => handModel(0x8a6a48, true));
  return L;
})();
window.__expList = () => { renderer.setAnimationLoop(null); return window.__exp.map(x => x.cat + '/' + x.name); };   // stop the game loop: we only build models
window.__expOne = async i => {
  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
  const it = window.__exp[i]; let obj = it.make(); if (obj && obj.g && !obj.isObject3D) obj = obj.g;
  if (!obj || !obj.isObject3D) throw new Error('no model');
  const drop = []; obj.traverse(o => { if (o.userData && o.userData.outline) drop.push(o); if (o.isSprite || o.isPoints || o.isLine) drop.push(o); }); drop.forEach(o => o.parent && o.parent.remove(o));
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(obj); if (box.isEmpty()) throw new Error('empty');
  const c = box.getCenter(new THREE.Vector3()); obj.position.x -= c.x; obj.position.z -= c.z; obj.position.y -= box.min.y;   // centred, standing on y = 0
  const root = new THREE.Group(); root.name = it.name; root.add(obj);
  const buf = await new GLTFExporter().parseAsync(root, { binary: true, onlyVisible: true });
  let s = ''; const b = new Uint8Array(buf); for (let k=0;k<b.length;k+=0x8000) s += String.fromCharCode.apply(null, b.subarray(k, k + 0x8000));
  const sz = box.getSize(new THREE.Vector3());
  return { b64: btoa(s), size: [sz.x, sz.y, sz.z].map(v => +v.toFixed(3)) };
};
</script>"""
i = HTML.rindex('</script>'); HTML = HTML[:i] + HOOK + HTML[i + len('</script>'):]
async def main():
    out = os.path.join(ROOT, 'assets/models'); os.makedirs(out, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 800, 'height': 600})
        errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        async def route(r):
            u = r.request.url
            if 'cdn.jsdelivr.net/npm/three@0.160.0/' in u: await r.fulfill(path=T3 + u.split('three@0.160.0/')[1], content_type='application/javascript')
            elif u.startswith('http://local/'): await r.fulfill(body=HTML, content_type='text/html')
            else: await r.abort()
        await pg.route('**/*', route)
        await pg.goto('http://local/index.html'); await pg.wait_for_timeout(3000)
        names = await pg.evaluate('window.__expList()'); index = []; fails = []
        for i, n in enumerate(names):
            try:
                r = await pg.evaluate(f'window.__expOne({i})')
                path = os.path.join(out, n + '.glb'); os.makedirs(os.path.dirname(path), exist_ok=True)
                open(path, 'wb').write(base64.b64decode(r['b64']))
                index.append({ 'archivo': n + '.glb', 'categoria': n.split('/')[0], 'nombre': n.split('/')[1], 'tamano_m': r['size'] })
            except Exception as e: fails.append((n, str(e)[:120]))
        json.dump({ 'color_jugador': '#151515', 'modelos': index }, open(os.path.join(out, 'index.json'), 'w'), ensure_ascii=False, indent=1)
        print('exported', len(index), 'of', len(names)); [print('FAIL', f) for f in fails]; print('page errors', errs[:3])
        await b.close()
asyncio.run(main())
