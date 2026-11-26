# Catroan

Juego de construcción de pueblos sobre una isla de hexágonos, en 3D low poly con texturas
pixeladas, hecho con three.js. Todo corre en un solo archivo HTML.

## Estructura

```
src/
  index.html        plantilla de la página (marcado + mapa de importación de three.js)
  styles/main.css   todos los estilos
  manifest.json     orden en que se unen los archivos de código (¡importa!)
  core/       modos de juego (Clásico / Catroan, primera persona), estado, datos, reglas, turnos, bots, misiones, amuletos, cartas, intercambios, registro
  models/     constructores de modelos 3D: personas, animales, árboles, edificios, recursos,
              iconos, cartas, amuletos, trofeos, avatares, caballo, barco…
  textures/   texturas de píxeles: recursos compartidos, letreros rústicos, texto grabado
  scenes/     tablero, costa, pueblo y vida de los aldeanos, día/noche, mercado,
              ladrón, mensajero, despacho, muelle, transiciones
  ui/         menú principal (título en un bioma, modelos cayendo, modos, multijugador), letreros de jugadores, botones de acción, recuadro de avisos, mensajes de
              acción, abanico de cartas, vistas grandes, inventario, tablón, entrada
  audio/      sonidos sintetizados
  main/       bucle principal y arranque
  net/        multijugador: salas por clave, chat (T) y la partida en línea (net-game.js)
electron/     versión de escritorio (Electron): ventana, ícono y build de los .exe
assets/fonts/   Pixelify Sans (OFL) para la versión sin internet
assets/models/  todos los modelos exportados a .glb, como si fueran del jugador negro (#151515)
tools/export-glb.py  vuelve a exportar los modelos
dist/         resultado del build
```

**Importante:** los archivos de `src/` no son módulos separados. El build los une en el orden
de `manifest.json` y comparten un mismo ámbito (como si fuera un solo archivo). Si agregas un
archivo nuevo, añádelo al manifiesto en el lugar donde deba ejecutarse.

## Comandos

```
npm install          # una vez
npm run build        # dist/catroan.html (minificado y ofuscado) + dist/catroan.dev.html (legible)
npm run dev          # solo la versión legible
npm run lint         # revisión estática del juego unido (nombres inexistentes = error)
npm run export-glb   # exporta todos los modelos a assets/models (necesita Python + Playwright)
npm start            # abre el juego en Electron
npm run dist:linux   # AppImage para Linux
npm run dist:win     # instalador y portátil para Windows (con Docker)
```

- `dist/desktop/`: copia para Electron, con three.js y la fuente locales (funciona sin internet).

- `dist/catroan.html`: lo que se publica. Código minificado, nombres internos renombrados
  (ofuscación ligera), sin comentarios ni mensajes de consola.
- `dist/catroan.dev.html`: idéntico al código fuente, para probar y depurar.

## Modelos .glb

`assets/models/index.json` lista cada modelo con su categoría y tamaño en metros. Los modelos
están centrados y apoyados en el suelo (y = 0), con sus texturas pixeladas incluidas, y se pueden
abrir en Blender (Archivo → Importar → glTF 2.0). Son una copia: el juego sigue generando sus
modelos con código, con color por jugador y variaciones.

## Multijugador

- **Crear partida**: genera una clave (como `K7M-2QX`) y la carta de la partida; luego eliges modo y jugadores (2 a 4).
  El anfitrión espera en el tablero; cada quien pone su nombre (los demás lo ven al guardar) y tira sus dados al entrar;
  nadie construye hasta que todos tiren. Con **Bots: Sí**, el hexágono **Comenzar** arranca antes y llena los lugares
  libres con bots; con **Bots: No**, la partida empieza sola cuando se ocupan todos los lugares.
- **Complemento 5–6 jugadores** (vista Jugar, solo o en línea): tablero grande de 30 hexágonos.
- Máximo **2 trueques con cada jugador por turno**.
- **Unirse**: escribes la clave. Chat con **T**. Si alguien se desconecta, un bot juega por él hasta que vuelva.
- Quien está actuando corre las reglas y manda el estado; los demás lo aplican (ver `CLAUDE.md`).
- Dentro de claude.ai usa la capacidad `room` del artifact. Fuera, un canal entre pestañas del mismo navegador
  (para probar). El .exe tendrá su propio transporte por IP (pendiente).

## Para Claude Code

Lee `CLAUDE.md`: reglas que no se rompen, estándar visual y pendientes.
