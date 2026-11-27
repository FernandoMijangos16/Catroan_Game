# Tareas para Claude (sesión en el navegador)

Fernando está de viaje y **no podrá contestar dudas**. Trabaja solo, con criterio, y deja todo listo para que lo
revise al volver.

## Antes de empezar

1. Lee **`CLAUDE.md` completo**. Ahí están las reglas del proyecto, el estándar visual y el mapa del código.
2. Una excepción a `CLAUDE.md` mientras Fernando viaja: **no esperes respuesta a tus dudas.**
   - Elige la opción que recomendarías y sigue.
   - Anota cada decisión en la sección **"Decisiones que tomé"** de tu resumen final.
3. Prepara el entorno:
   - `npm install`.
   - Para las capturas: Playwright con Chromium. En esta sesión no existe la ruta de Python de `CLAUDE.md`; si falta,
     instálalo (`pip install playwright && python -m playwright install chromium`) o usa Playwright de Node.

## Reglas para esta sesión

- **Una rama nueva desde `main` por tarea**: `editar-paneles` para las tareas 1 y 2, `tutorial-3` para la tarea 3.
- **No unas a `main`.** Sube las ramas y abre un PR por tarea; Fernando los revisa y los une.
- Commits **sin** la línea `Co-Authored-By`.
- No generes ejecutables (`npm run dist`).
- **`npm run lint` después de cada cambio.** Nunca dejes un comentario `//` a media línea con código después.
- Revisa todo cambio visual con capturas, en 1280×720 y 1920×1080. Toda prueba debe terminar con **0 errores de página**.
- Responde y escribe los resúmenes en **español**.
- Haz solo lo que se pide aquí. No reorganices ni renombres.

---

## Tarea 1 — La interfaz se oscurece al pasar el mouse o picar botones

**Qué pasa:** al pasar el mouse sobre cualquier panel del tablero se oscurece y aparecen el marco punteado, las
esquinas de latón y la placa con su nombre. Afecta a:
- los letreros de jugadores;
- la barra de acciones;
- el inventario;
- los botones de arriba a la derecha.

Pasa aunque solo quieras picar un botón. Es el modo para mover y cambiar el tamaño de los paneles, que hoy está
siempre activo.

**Dónde está:**
- `src/styles/main.css`, cerca de la línea 700:
  - `.edfr.hov::after` y `.fwin.hov::after` ponen el fondo oscuro `rgba(20,14,8,.22)` y el borde punteado.
  - `.edfr.hov>.edc` y `.edfr.hov>.edtag` muestran las esquinas y la placa.
- `src/main/start.js`:
  - `addGrip()` (línea ~39) agrega la clase `hov` con un `pointermove` global (línea ~42).
  - `edCorners()` y `edTag()` crean las esquinas y la placa.
- `src/ui/inventory.js` (línea ~69): las ventanas flotantes del inventario (`.fwin`) ponen `hov` con `pointerenter`.

**Qué debe pasar:** fuera del modo edición, pasar el mouse o picar no oscurece nada ni muestra marcos, esquinas ni
placas, y los paneles no se pueden arrastrar ni cambiar de tamaño. Todo eso pasa a la tarea 2.

## Tarea 2 — Botón 3D para activar y desactivar la edición de paneles

**Qué hacer:**
- **El botón:** agrega un botón nuevo en `#hud-right` (`src/index.html`), junto al sonido (`#b-sound`) y la pausa
  (`#b-pause`). Esos son los botones 3D de herramientas de arriba a la derecha.
- **Su ícono:** debe ser un modelo nuevo en `iconModel` (`src/models/icons.js`), con el mismo estilo de los demás:
  low poly, latón y madera, sombreado plano. Por ejemplo, una escuadra de carpintero o un lápiz con regla.
  - Míralo girando, como `engrane` y `cuerno`: que se lea bien de frente y de canto.
  - El botón activo debe distinguirse: una variante del ícono o un brillo de latón, como hacen `cuerno`/`cuerno-off`
    con el sonido.
- **El estado:**
  - Apagado por defecto, guardado en `localStorage` con la clave `hexterra-editpanels`. Todas las claves empiezan
    con `hexterra-`.
  - Pon una clase en `body` (por ejemplo `editing`) y haz que todo el CSS y la lógica de edición dependan de ella:
    `.hov`, las esquinas, la placa, arrastrar, cambiar tamaño, y el doble clic en la placa para volver a lo normal.
- **Textos (`title`):** "Editar paneles: apagado · toca para mover y cambiar el tamaño de los paneles" y "Editar
  paneles: activado · toca para terminar".
- **Al activarlo**, muestra un aviso corto con `sysNote` o `notify(..., 'sys')`: "Arrastra la placa de cada panel
  para moverlo y sus esquinas para cambiar el tamaño".
- **Dónde debe funcionar:** en el tablero y en el pueblo en primera persona. En el pueblo, `#hud-right` está dentro de
  `#corner` y es una columna: revisa ahí su lugar y su tamaño.
- **Qué no debe romperse:** los tamaños y lugares ya guardados (`hexterra-ksize` y los demás) se siguen aplicando con
  la edición apagada.
- **Tutorial y pausa:** el botón no debe estorbar al tutorial. En `core/tutorial.js` todo pasa por `tutAllow`: decide
  si se puede usar durante el tutorial y anótalo.
- **`CLAUDE.md`:** actualiza "Lo que no se mueve" o "Estándar visual" con el botón nuevo y la regla de que la edición
  solo existe con el botón activado.

**Pruebas:**
- Capturas con la edición apagada (al pasar el mouse no se oscurece nada) y encendida (marcos, esquinas y placas como
  hoy).
- Mover un panel con la edición encendida, apagarla y comprobar que se queda donde lo dejaste.
- Recargar y comprobar que se recuerda el estado.
- Abrir la pausa (Esc) y el tutorial, y comprobar que no se rompen.

---

## Tarea 3 (solo si las tareas 1 y 2 quedaron terminadas y probadas) — Tutorial, parte 3

Lee la sección del tutorial en `CLAUDE.md` (pendiente 9) y el código de las partes 1 y 2:
- `src/core/tutorial.js`: guion, plan, dados fijos, `tutTopUp`, `tutSkipToPart2`.
- `src/ui/tutorial-guide.js`: el panel de Ulises, `tutSay`, `tutAct`, `tutDodge`.

**Qué cubre la parte 3:** sigue la misma partida después del capítulo 8.
- Misiones (folletos de los pueblos, entregar en la oficina).
- El brujo y los amuletos.
- Objetos y flores.
- El pueblo en primera persona: WASD para caminar, Q y E para girar, entrar a un pueblo y volver al tablero.

Eventos de temporada, camino más largo y cómo se gana quedan para una parte 4. Si te sobra tiempo, también puedes
hacerla.

**Cómo hacerlo:**
- Igual que las partes 1 y 2:
  - Pasos `tutSay`/`tutAct`.
  - Solo se permite lo que Ulises pide (`tutAllow` con claves nuevas donde haga falta).
  - Ulises completa lo que falte con `tutTopUp`.
- Las misiones están apagadas durante el tutorial (`assignQuestFor0` y `villageQuests` regresan si `TUT.on`). Para
  esta parte, crea la misión del tutorial a propósito, con contenido fijo (no al azar).
- Agrega un botón "Parte 3 · …" en "Cómo jugar" (`src/ui/menu.js`) con su `tutSkipToPart3`, que arme el estado como
  quedaría al terminar la parte 2.
- Con la primera persona apagada (`scenesOn()` falso), salta o explica con texto lo que solo existe en escenas.

**Pruebas:**
- Recorre la parte 3 de principio a fin con Playwright: clic en lo marcado, "Siguiente", etc.
- Recorre también "Parte 2 → Parte 3" seguidas.
- Toma capturas de cada capítulo.
- Las pruebas de las partes 1 y 2 deben seguir pasando.

---

## Al terminar

Deja un resumen en español en cada PR y en tu último mensaje con estas secciones:

1. Qué cambió.
2. Cómo lo probaste, con las capturas.
3. **Decisiones que tomé** (sin poder preguntarle a Fernando).
4. Qué quedó pendiente o con dudas.
