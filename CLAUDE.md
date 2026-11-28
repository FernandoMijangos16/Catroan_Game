# SwapHolm — guía para Claude Code

SwapHolm (antes Catroan) es un juego tipo Catan en 3D low poly para navegador, hecho con three.js. Lo creó Fernando junto con Claude
(claude.ai). Esta guía cuenta cómo está hecho, qué **no** se toca y qué falta. Léela completa antes de cambiar algo.

## Cómo trabajar con Fernando

- Responde en **español**. Los textos del juego van en español (de México) y son cortos. Los comentarios del código
  van en inglés, como los que ya hay.
- **Antes de empezar cada pedido nuevo, comparte tus dudas y espera la respuesta.** Pregunta poco y concreto, y
  propón una opción recomendada. Es una preferencia de Fernando y siempre se ha seguido.
- Haz lo que pidió y nada más. No reorganices, no renombres ni "mejores" cosas que no pidió.
- Si un cambio es visual, revísalo con capturas antes de darlo por terminado. Si dudas de cómo se verá, enséñale una
  captura antes de seguir.
- Al terminar, resume qué cambió, qué se probó y qué quedó pendiente, sin rodeos.

## Versiones

- La versión está solo en `package.json`; `build.mjs` la pone en el menú (`APP_VERSION`) y los instaladores la usan.
- **1.0 = la primera publicación.** Antes, cada actualización grande sube el número del medio (0.8 → 0.9) y cada
  entrega de solo correcciones sube el último (0.8.0 → 0.8.1). Historia: 0.2 claude.ai, 0.3 escritorio y red local,
  0.4 lote de notas, 0.5 SwapHolm, 0.6 semilla y dificultad, 0.7 eventos, 0.8 pausa y guardado, 0.9 tutorial.
- Al cambiar la versión, etiqueta el commit en git (`v0.8.0`).

## Construir y probar

```
npm install
npm run build      # dist/catroan.html (minificado, se publica) + dist/catroan.dev.html (legible) + dist/desktop/ (Electron)
npm run dev        # solo la versión legible
npm run lint       # revisión estática del juego ya unido: nombres inexistentes = error
npm run export-glb # exporta todos los modelos a assets/models (Python + Playwright)
npm start          # el juego en Electron
npm run dist:linux # AppImage · npm run dist:win → .exe con Docker (ver electron/README.md)
```

- **Los archivos de `src/` no son módulos.** `build.mjs` los une en el orden de `src/manifest.json` dentro de un solo
  `<script type="module">`, así que todo comparte un mismo ámbito. Si agregas un archivo, ponlo en el manifiesto donde
  deba ejecutarse.
- Las funciones declaradas con `function` existen desde el principio. Las `const`/`let` no existen hasta que se
  ejecuta su línea, por eso el estado en línea `NG` está declarado en `core/util.js`, que es el primer archivo.
- **Corre `npm run lint` después de cada cambio.** Una vez, una variable que ya no existía (`QBOARD`) hacía fallar
  cada clic en el tablero sin mostrar nada en pantalla. Las advertencias de variables sin usar son inofensivas.
- **Cuidado con comentarios `//` dentro de líneas largas:** todo lo que va después del `//` deja de ejecutarse. Ya
  pasó una vez y se perdió una asignación.
- **Pruebas en el navegador:** con Playwright y Chromium (en esta máquina: `~/.cache/catroan_venv/bin/python`). Abre `dist/catroan.dev.html` (three.js viene de un CDN).
  - Para llegar a funciones internas, inyecta código justo antes del último `</script>`; queda dentro del mismo
    ámbito. Ejemplo: `window.__dbg = { G: () => G, rollDice, endTurn };`.
  - Ayudas de prueba: `window.__autoSetup = true` (tú también colocas pueblos en automático) y
    `window.__slowAct = n` (multiplica cuánto duran los avisos de acción).
  - Toda prueba debe terminar con **0 errores de página**.
  - El multijugador se prueba con dos pestañas del mismo navegador: con `window.__tabRooms = true` se usa una sala
    local por `BroadcastChannel`; sin eso, se usa la sala en línea real (PeerJS, necesita internet). La red local se
    prueba con dos ventanas de Electron (`--user-data-dir` distinto y `--remote-debugging-port` para Playwright).
- Al editar con scripts, reemplaza texto exacto. Nunca cortes funciones buscando "la siguiente función": así se
  borraron 1200 líneas una vez.

## Mapa del código (`src/`)

| Carpeta | Contenido |
|---|---|
| `core/` | estado `G`, datos (`data.js`), reglas, turnos y bots (`bots.js`: `botTurn`, `roadPlan`), dados (`actions.js`: `drawDice`), registro y colocación inicial (`registration.js`: `startPick`), misiones, amuletos, cartas, objetos (`specials.js`), tratos, modos (`modes.js`) |
| `models/` | modelos 3D hechos con código: personas, animales, árboles (`TreeBatch`), recursos (`makeResourceItem`), iconos (`iconModel`), cartas (`cardMesh`), amuletos (`amuletModel`), trofeos, avatares, caballo, barco… |
| `textures/` | texturas de píxeles compartidas, letreros, texto grabado; `colorize`, `GEO`, `mesh()`, `sg()` |
| `scenes/` | tablero (`hexTileMesh`, `tileColor`, `boardHouse`, `numberToken`), costa, pueblo en primera persona, vida de aldeanos, día/noche, mercado, ladrón en el callejón, mensajero, oficina (cartas y sellos), muelle, transiciones |
| `ui/` | menú (`menu.js`, `menu-title.js`), letreros de jugadores, barra de acciones, avisos de acción (`action-messages.js`), abanico de cartas, inventario, oferta de trato (`trade-offer.js`), vistas 3D pequeñas (`mini-views.js`: `miniView`, `spinner`) |
| `net/` | `net.js`: transporte, salas por clave y chat (T). `net-game.js`: la partida en línea |
| `audio/`, `main/` | sonidos sintetizados; bucle principal y arranque |

## Reglas que no se rompen

1. **El jugador local siempre es el índice 0.** Todo el código lo supone (`p === 0` es "tú").
   - En línea, cada cliente rota los asientos para que el suyo sea el 0 (`gSeat`/`lSeat` en `net-game.js`).
   - Todo campo que guarde un índice de jugador debe convertirse al enviar y al recibir el estado.
2. **Partida en línea.**
   - Las reglas las corre quien está actuando: el dueño del asiento en turno, o el anfitrión si es un bot. Ese
     cliente manda el estado completo (`netSnap`/`netApply`); los demás solo lo aplican y redibujan.
   - Las decisiones de otro jugador se piden con `netAsk` (descartar al salir 7, responder un trato).
   - Los cambios pequeños fuera de turno van con `netOp` (aceptar misión, recursos iniciales).
   - Si agregas un campo nuevo a `G` o a un jugador que afecte el juego, inclúyelo en `netSnap`/`netApply`. Los
     jugadores deben ser datos simples (JSON).
   - Si el anfitrión se va, la partida termina. Si un jugador se va, un bot toma su lugar y él lo recupera al volver.
   - Todo lo que llega de otros jugadores es desconfiable: se limpian nombres (`cleanName`) y objetos
     (`cleanItems`), y el HTML pasa por una lista blanca (`netHtml`). No lo quites.
3. **Mensajes.** `notify(html, color)` muestra el aviso y en línea lo reenvía.
   - El color es el del jugador que actúa.
   - Los textos sobre el jugador 0 van en segunda persona ("Sacaste", "te robó"). `netPersp` los convierte para los
     demás: si escribes una frase nueva en segunda persona, agrégala a esa tabla.
   - Los recursos y objetos van con `resImg`/`specImg`/`resList`.
   - Los nombres en notas de la barra inferior van con `nameTag(nombre, color)`.
4. **Avisos de acción** (cuadro de arriba): quién · acción (modelo 3D) · con qué · → a quién. Los trueques van así:
   quién propone · lo que da (con cantidad) · ⇄ · lo que pide · a quién (jugador, Comercio, Puerto o Pirata). En los textos se dice siempre "comercio", nunca "banco". Una sola
   flecha, nunca dos.
5. **Modos.** `isClassic()` = solo Catan base: nada de misiones, brujo, amuletos, objetos, flores ni eventos.
   `scenesOn()` = escenas en primera persona; sin ellas, todo se resuelve con paneles simples. Todo lo nuevo debe
   respetar las dos opciones.
6. **Dados.** Salen de una bolsa con las 36 combinaciones de dos dados; se rellena cuando quedan 5 (`drawDice`, el
   estado está en `G.bag`). No se cambia.
7. **Recursos iniciales.** El 2° pueblo da **siempre 3 recursos** si toca al menos un terreno que produce (también en
   la costa, aunque toque menos terrenos), y el jugador los reparte como quiera entre esos tipos
   (`startAllowance`/`startPick`). Los bots eligen lo que menos producen.
8. **Objetos y flores** salen en cantidades según el objeto (`SPECIAL[k].drop`).
   - Nombres propios, no de Catan: cartas Guardia, Punto de desarrollo, Rutas y senderos, Temporada de abundancia y
     Avaricia; trofeo Guardia más poderosa. Sin nombres de personajes con marca (Nintendo, etc.) en bots ni aldeanos.
9. **Nombre y título.** El juego se llama **SwapHolm** en todo lo visible (el modo con misiones también). Los
   identificadores internos siguen diciendo `catroan` (modo `'catroan'`, salas, `catroan-tok`, `catroanDesk`, carpeta
   de datos de Electron) para no romper partidas ni preferencias.
   - Título del menú (`buildWordmark` en `ui/menu-title.js`): cada vez que se abre el menú sale un bioma al azar de
     `LOGO_BIOMES`; la O es ese hexágono (`logoHex`, de la altura de las letras, gira sobre su eje) y las letras se arman
     con el recurso que produce (`resourceLetter`: copias de `makeResourceItem` con `InstancedMesh`, pegadas y algo
     revueltas; madera, ladrillo y metal van a lo largo del trazo, dos por casilla). Las letras **no giran**. El ícono de la app es ese hexágono (bosque, con ciudad) inclinado.
10. **Todo modelo 3D que se muestre en la interfaz gira sobre su propio eje** (`spinner` + `userData.inner`). Las
    excepciones son los modelos que caen en el menú (cada uno conserva su inclinación), los recursos que forman las
    letras del título y Ulises en el tutorial (te está hablando: mira hacia ti).
11. **Las claves de `localStorage` empiezan con `hexterra-`** a propósito, para no perder las preferencias guardadas.
    El token de reconexión en línea es `sessionStorage` `catroan-tok`.
12. **Selección en el tablero** (`ui/board-input.js`): marcas de misión, lupas, pueblos y puertos compiten y gana lo
    que golpea el rayo o lo más cercano en pantalla. Antes un puerto se comía el clic de un pueblo costero al alejar
    la cámara. No vuelvas a un orden fijo.

## Estándar visual (lo más importante)

El juego tiene una estética muy definida. **Nada nuevo puede verse como de otro juego.**

- **Look:** 3D low poly con sombreado plano y texturas pixeladas de baja resolución generadas con código
  (`pxTex`, `pixTex`, filtro `NearestFilter`, `image-rendering: pixelated`). La referencia es el estilo
  PS1/CloverPit: realista pero de baja resolución, gastado, cálido.
- **Mundo:** rural de época, con pueblos de nombres en español (también hay nombres de programación y videojuegos).
  Materiales: madera, latón, pergamino, papel de oficina, terciopelo, piedra.
- **Todo sale del código:** no hay imágenes, modelos externos ni íconos de librerías.
  - No uses emojis en la interfaz: `deEmo` los cambia por íconos 3D (mapa `EMO` en `models/icons.js`). Si necesitas
    un símbolo nuevo, agrega un modelo a `iconModel` con el mismo estilo.
- **Tipografía:** Pixelify Sans. No agregues otras fuentes.
- **Interfaz:**
  - Botones como placas de latón.
  - Paneles de madera oscura o terciopelo con bordes de latón.
  - Notas en papel (`--paperimg`).
  - Cartas de terciopelo del color del dueño, con esquinas de mineral según el tipo y puntas redondeadas.
  - Sellos SÍ (derecha, verde) y NO (izquierda, rojo) con la marca APROBADO/RECHAZADO de la oficina
    (`stampMark`).
- **Reutiliza antes de crear:** `hexTileMesh`, `tileColor`, `TreeBatch`, `makeAnimal`, `makePerson`, `boardHouse`,
  `makeResourceItem`, `makeSpecialItem`, `amuletModel`, `iconModel`, `trophyModel`, `stampModel`, `inkPadModel`,
  `cardMesh`, `numberToken`, `robberModel`, `groundTex`, `colorize`, `GEO`, `mesh()`.
- **No agregues:** diseño plano moderno, efectos de vidrio, degradados llamativos, texturas realistas en alta
  resolución, sombreado suave, modelos de otro estilo, íconos de librerías ni texto en inglés.
- Las animaciones son suaves (con aceleración y frenado) y los avisos se mantienen cortos.
- **Las vistas del menú se encogen solas si no caben** en la altura de la ventana (`fitMenuView` en `ui/menu.js`); si
  agregas o muestras filas en una vista, llama `fitMenuView()` después.
- **Menú de pausa** (`ui/pause.js`): Esc (si no hay nada que cerrar antes) o el engrane de arriba a la derecha. Capa
  oscura sobre el juego, PAUSA con recursos en el lugar del título y las opciones con la letra del menú: Reanudar,
  Guardar, Guardar y salir, Reiniciar (con confirmación), Ajustes (volumen `hexterra-vol`, pantalla completa,
  animaciones rápidas `hexterra-fast`), Ayuda (pendiente) y Salir; abajo un resumen (ronda, evento, puntos).
  - Sin conexión todo se detiene: `PAUSE.frozen` retiene cada `wait()` y el bucle solo dibuja. **Usa `wait()` para
    esperar en el juego**, no `setTimeout`, o eso seguirá corriendo en pausa.
  - En línea solo oscurece (los demás siguen) y no hay Guardar ni Reiniciar.
  - Salir y Reiniciar recargan la página (`PAUSE.gen` corta las esperas viejas); Reiniciar deja sus opciones en
    `sessionStorage` y `restartPending` abre la partida nueva al arrancar.
- **Edición de paneles** (mover y cambiar el tamaño de inventario, barra de acciones, letreros y botones): **solo existe
  con el botón de la escuadra activado** (`#b-edit` en `#hud-right`, ícono `escuadra` / `escuadra-on`). Apagado por
  defecto y guardado en `hexterra-editpanels`; encendido pone `body.editing`, y todo el CSS y la lógica de edición
  (`.hov`, esquinas, placa, arrastrar, cambiar tamaño, doble clic para volver a lo normal) dependen de esa clase
  (`editOn()`, `setEditPanels()` en `main/start.js`). Apagado, pasar el mouse o picar no oscurece nada ni muestra marcos,
  y los tamaños y lugares guardados se siguen aplicando. En el tutorial se apaga y el botón queda bloqueado
  (`tutAllow('editar')`).
- **Doble clic omite animaciones** (`skipAnims` en `core/util.js`): usa `wait()` para esperar (se puede interrumpir) y
  las escenas avanzan con `dt` en el bucle; así todo lo nuevo también se puede omitir.

## Lo que no se mueve (salvo que Fernando lo pida)

- **Menú principal:**
  - Fondo del pueblo en primera persona con capa oscura al 70 %, día o noche según la hora y un botón para
    cambiarlo.
  - Lluvia de modelos oscuros e inclinados, sobre todo a los costados y algunos por el centro.
  - El título SwapHolm arriba (con la O de bioma).
  - Las opciones Jugar, Multijugador, Cómo jugar y Salir.
- **Jugar:**
  - Dos mini tableros inclinados (Clásico y Catroan) con modelos girando en su eje.
  - El interruptor de primera persona.
  - La sección Complementos: la primera casilla es el complemento **5–6 jugadores**; las otras, "próximamente".
  - El número de jugadores (en línea 2–4, o 2–6 con el complemento; solo, 5–6 con el complemento) y, en línea,
    **Bots: Sí / No**.
- **Multijugador:**
  - Carta grande con el nombre de la partida y la clave, con los botones 3D Copiar y Siguiente.
  - La espera en el tablero con el panel de jugadores y el hexágono 3D "Comenzar" (llena con bots; no aparece con
    Bots: No). El nombre se envía al guardar el letrero (`netRegName`), antes de los dados.
  - Trueques entre jugadores: máximo `TRADE_MAX` (2) por pareja y turno (`tradeCount`, `G.trades`, va en `netSnap`).
  - Al entrar, cada quien pone su nombre y tira sus dados.
  - El chat con T.
- **Tablero:** el inventario en la orilla izquierda, los letreros de jugadores arriba a la derecha con los botones 3D
  de herramientas (paso del día, ciclo de día y noche, editar paneles, sonido y pausa), la barra de
  acciones en hexágonos abajo, "Terminar turno", el abanico de cartas abajo a la izquierda y la caja de amuletos
  detrás de la baraja.
- **Escenas:** el pueblo en primera persona, el mercado, el muelle con el pirata, la oficina, el mensajero y el
  ladrón en el callejón.
  - Primera persona: WASD/↑↓ caminan, Q E/←→ giran. Animales y aldeanos no empujan al jugador (solo lo frenan).
    "Terminar turno" también aparece en el pueblo. Las puertas tienen bisagra (`doorKick`).
  - El comerciante de la tienda es un personaje fijo (`MERCHANT`, misma semilla para su modelo y su avatar
    `merchantAvatarURL`): saluda, piensa, entrega con su brazo y cambia de cara (`setFaceExpr`). En el callejón el inventario baja como barra para entregar recursos; no hay mesa.
- **Registro:** el letrero con nombre, avatar, color y dados, y después la elección de recursos iniciales.

## Pendientes (orden sugerido)

Antes de cada uno, comparte tus dudas con Fernando.

1. ~~**Versión de escritorio con Electron**~~ **hecho.** `electron/main.js` carga `dist/desktop/` (three.js r160 y
   Pixelify Sans locales) por `app://`. Salidas: instalador `nsis`, portátil y AppImage. Los .exe se generan con
   Docker (`electronuserland/builder:wine`) porque el Wine local se cuelga. Detalles en `electron/README.md`.
2. ~~**Multijugador en el .exe**~~ **hecho** (`net/net-hub.js`, `electron/lan.js`; ver `net/README.md`). En el .exe,
   la carta de "Nueva partida" tiene el interruptor **Red: Local / En línea**. Local = WebSocket con la IP privada en
   la clave (sin internet). En línea = WebRTC con PeerJS (también en el navegador fuera de claude.ai).
   `net-game.js` no cambió.
3. ~~**Azar con semilla**~~ **hecho, solo para el tablero** (decisión de Fernando: que los bots no sean memorizables).
   `newGameState(n, board, seed)` genera terrenos, números y puertos con `mulberry32(seed)` y guarda `G.seed`; en
   línea la semilla va con el tablero del anfitrión. Dados, mazo, bots, hallazgos y misiones siguen con `Math.random`.
   El **tutorial** sí será fijo en todo (dados, bots, mazo): eso se hace con el pendiente 9.
4. **Clave de mapa:** un código para repetir o compartir el mismo tablero.
5. ~~**Guardar y continuar**~~ **hecho** (`core/save.js`). Una ranura (`hexterra-save`), solo partidas sin conexión.
   - Formato: el estado en línea (`netSnap` con el asiento 0) + tablero (tipos, números, puertos, semilla) + opciones.
     Continuar reconstruye con `newGame(n, board, seed)` y aplica el estado con `netApply`.
   - Se guarda solo al terminar cada turno (`autoSave` en `endTurn`). "Guardar" en la pausa guarda el momento si es
     tranquilo (`calmNow`: tu turno, nada a medias); si no, queda el guardado del inicio del turno. Ganar lo borra.
   - En el menú aparece "Continuar" (con ronda y fecha) si hay partida guardada.
6. **Pantalla final con estadísticas:** qué números salieron, robos, intercambios y de dónde vino cada punto.
7. ~~**Dificultad de bots**~~ **hecho** (`BOT_LEVELS` en `core/bots.js`): fila **Dificultad: Fácil · Normal · Difícil** en
   la vista Jugar (se guarda en `hexterra-botlvl`; en línea la elige el anfitrión, que es quien mueve a los bots; se
   oculta con Bots: No). Normal = los bots de siempre. Fácil: esquinas peores, comercia poco, evita disputas. Difícil:
   mejores esquinas y busca recursos que le faltan, comercia más (hasta 2 cambios), va por cruces en disputa para
   bloquear y compra más cartas.
8. ~~**Eventos de temporada**~~ **hecho** (`core/events.js` lógica, `scenes/season-fx.js` lo visual). Solo en modo SwapHolm y
   con **Eventos de temporada: Sí** (vista Jugar, `hexterra-events`; en línea lo decide el anfitrión, `G.evOn`).
   - Cada 4–6 rondas sale uno y dura 2–3 (el primero no antes de la ronda 4); se anuncia con aviso de acción y su ícono,
     y una placa arriba a la derecha dice cuál es y cuántas rondas le quedan (`#b-event`).
   - Favorece: 68 % de 1 extra; perjudica: 40 % de 1 menos, por cada pueblo/ciudad que produce (`eventYield`).
     Feria: comercio 4:1 → 3:1 y puertos 3:1 → 2:1 (`eventRate`). Polinización: más hallazgos y 68 % de 1 extra.
   - Estado `G.event`, `G.evNext`, `G.evLast`, `G.evOn` en `netSnap`; los dados de probabilidad los tira quien actúa.
   - Se ve en el tablero (colores de los hexágonos por vértice, luces, nubes, partículas, charcos, hielo en la costa,
     humo, abejas, caravana de 8 carretas) y en el pueblo (lluvia, nieve, polen y abejas, bruma, banderines).
9. **Tutorial** ("Cómo jugar") — **partes 1 y 2 hechas** (`core/tutorial.js` guion y candados, `ui/tutorial-guide.js`
   panel, `models/traveler.js` Ulises). Lo guía **Ulises, el viajero** (mochila con cobija, mapa, olla y farol).
   - Partida fija: semilla `TUT.seed`, tú primero contra Rosa y Nico; los pueblos de los bots salen de `tutPlan()`
     (calculado del mapa), los dados de `TUT.dice` y los bots solo tiran y pasan (`tutBotTurn`).
   - Cada paso es `tutSay` (Siguiente) o `tutAct` (espera algo del juego); solo se puede usar lo de `TUT.allow`
     (`tutAllow` en la barra de acciones, terminar turno, tablero, letreros y cartas). El panel se aparta si tapa el
     lugar que pide (`tutDodge`). Al final: Volver al menú o Seguir jugando (bots normales).
   - Parte 1: bienvenida, colocación, recursos iniciales, dados y producción, construir. Parte 2 (sigue en la misma
     partida, o desde "Cómo jugar" con `tutSkipToPart2`, que arma el tablero como quedaría): el 7 (un bot saca 7, tú
     descartas en el callejón y su ladrón va a tu terreno, `TUT.robTile`; luego sacas 7 tú), comercio (mercado 4:1,
     muelle del pirata: tu 2° pueblo va en un puerto; carta de trueque a Rosa, que acepta) y cartas (la siguiente del
     mazo es una Guardia; se juega el turno siguiente, antes de tirar). Ulises completa con `tutTopUp` lo que falte.
   - Parte 3 (sigue en la misma partida, o desde "Cómo jugar" con `tutSkipToPart3`, que arma el tablero como queda al
     terminar la parte 2): objetos y flores (un camino da 2 margaritas y tu bosque, al producir, su objeto), el pueblo en
     primera persona (entras por el **!** de tu primer pueblo, caminas y aceptas el folleto de Doña Lupe junto al pozo),
     misiones (la entregas con el sello del panel; ella va a tu despacho) y el brujo y los amuletos (su choza en las
     afueras, su misión paga la **Pluma del viento** y la lanzas contra Rosa). Las dos misiones son fijas (`tutQuest`).
     - En el tutorial no hay hallazgos al azar (`bioTick`, `roadFind`, `villageGifts` regresan con `TUT.on`): los da
       Ulises cuando toca.
     - Candados nuevos: `visitar` (solo el **!** de tu pueblo para entrar), `misiones` (el panel de misiones) y
       `amuletos` (la caja de amuletos).
   - **El tutorial siempre enciende la primera persona** (decisión de Fernando: el pueblo y las escenas son parte de lo
     que se explica). El camino con paneles simples de abajo se conserva, pero hoy no se usa.
   - Con primera persona apagada, los mismos pasos usan los paneles simples (en la parte 3, aceptar la misión en el
     panel en vez de ir al pueblo).
   - Falta (parte 4): eventos, camino más largo, Guardia más poderosa (solo se menciona) y ganar.
   - Es una **partida arreglada que siempre sigue los mismos pasos**: mismo mapa, dados en orden fijo, bots con
     jugadas escritas y más facilidad para conseguir las cosas. Así todo se explica en una sola partida.
   - Debe cubrir todo:
     - la colocación inicial y los recursos iniciales;
     - los dados, la producción y las construcciones;
     - el 7 y el ladrón;
     - el comercio con banco, puerto y jugadores (carta y sellos);
     - las cartas;
     - las misiones, el brujo, los amuletos y los objetos y flores;
     - el pueblo en primera persona;
     - los eventos;
     - el camino más largo y la guardia más poderosa;
     - ganar.
   - Lo guía un aldeano.
   - Depende del azar con semilla.
10. **Más adelante, no ahora:** los Complementos y la versión para celular o tableta.
