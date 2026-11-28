# Tareas para Claude Code

Lee **`CLAUDE.md` completo** antes de empezar. Sus reglas valen aquí, también la de compartir tus dudas con Fernando
antes de cada tarea. Las decisiones de abajo **ya las tomó Fernando**: no se las vuelvas a preguntar.

## Decisiones de Fernando

- El guía del tutorial ahora es **Nándor**, con la cara de Fernando. Deja de llamarse Ulises en todo lo visible.
- **El comerciante de la tienda es el mismo Nándor**, con su ropa de comerciante. La idea: en el tutorial te ayuda, y
  en la partida te vende lo que consiguió en sus viajes por los biomas del tablero. Misma cara, mismos lentes, mismo
  color de piel; cambia solo el atuendo de cada rol.
- **Une tú los PR #1 y #2 a `main`** (paso 0). Fernando ya lo autorizó.
- Commits **sin** la línea `Co-Authored-By`.
- Para lo nuevo: una rama por tarea y un PR por tarea. **Esos PR no los unas**; Fernando los prueba y los une.

## Orden

0. Unir los PR #1 y #2.
1. Corregir los fallos encontrados (rama `correcciones`).
2. Poner la cara de Nándor en el guía y en el comerciante (rama `nandor`).
3. Hacer la parte 4 del tutorial (rama `tutorial-4`). Sale después de unir `nandor`, o encima de esa rama, porque los
   textos ya dicen Nándor.

---

## Paso 0 — Unir los PR #1 y #2

- **PR #1 (`editar-paneles`):** apaga la edición de paneles fuera del modo edición y agrega el botón de la escuadra
  en `#hud-right`.
- **PR #2 (`tutorial-3`):** parte 3 del tutorial (objetos y flores, el pueblo, misiones, brujo y amuletos).

Pasos:

1. Únelos a `main` en ese orden. En `dist/catroan.html` y `dist/catroan.dev.html` habrá conflictos, porque los dos los
   reconstruyeron. No los resuelvas a mano: toma cualquiera de las dos versiones y corre `npm run build`.
2. `CLAUDE.md` lo tocan los dos PR, en secciones distintas. Revisa que queden los dos cambios:
   - "Edición de paneles" en el estándar visual;
   - la parte 3 en el pendiente 9.
3. Corre `npm run lint`, abre el juego y revisa:
   - una partida normal;
   - el botón de editar paneles;
   - "Cómo jugar → Parte 3".

   Todo con 0 errores de página.

---

## Tarea 1 — Fallos encontrados en la sesión anterior

Salieron al probar la parte 3 con Playwright. Arregla cada uno con el menor cambio posible y muestra captura de antes
y después.

1. **El panel de misiones se queda abierto y con datos viejos** (`core/missions.js`, panel de pergamino).
   - Al sellar la entrega de Doña Lupe, el panel sigue abierto. Cuando después aparece la misión del brujo, el panel
     todavía dice "Nadie te ha pedido nada todavía".
   - En dos recorridos, con ese panel abierto, no se pudo tocar el **!** morado del tablero.
   - Haz que el panel se vuelva a llenar cuando cambian las misiones mientras está abierto, o que se cierre al sellar.
     Recomendado: volver a llenarlo.
   - Revisa también si un panel de pergamino abierto se come el primer clic en el tablero. Si es así, que el clic que
     lo cierra también llegue al tablero.
2. **El clic en Doña Lupe falló a veces.**
   - Una vez, tocar a Doña Lupe en el pueblo (folleto junto al pozo) no hizo nada, aunque se veía completa. Al repetir
     el recorrido sí funcionó.
   - Pruébalo a mano varias veces, de lejos, de cerca y a distintas horas del día.
   - Revisa `villageClick` en `scenes/village.js`: hace el rayo solo contra `clickables` y el aviso de controles cruza
     la pantalla. Si no lo puedes reproducir, dilo y sigue.
3. **La nota del guía tapa la línea de controles del pueblo.**
   - En primera persona, el papel del guía (abajo a la izquierda) queda encima de "WASD / ↑↓ para caminar · …". Pasa a
     1280×720 y a 1920×1080.
   - Mueve la línea de ayuda o haz que la nota la esquive. Que se lea completa.
4. **Avisos encima de la nota del guía.**
   - A 1920×1080, el aviso del amuleto ("Pluma del viento: toca el letrero del rival · cancelar") se dibuja encima de
     la nota.
   - En la parte 3 ya agregué `#tut.tuck`: la nota se aparta mientras hay una pregunta con botones (`PB.ask`).
   - Decide con Fernando si los avisos normales (`PB.note`) también deben apartarla, o si conviene mover la nota.
5. **`tradeLetter` truena si la oficina se cierra sin respuesta** (`core/trades.js`).
   - Revisa `if (r === null) return;` y luego `r.ok`.
   - Si `officeScene` regresa `undefined` (por ejemplo, al salir con `exitMarket`), sale el error "Cannot read
     properties of undefined (reading 'ok')".
   - Cámbialo a `if (!r) return;`.
6. **Pregúntale a Fernando:** `startTutorial` siempre enciende la primera persona (`GAME_OPTS.firstPerson = true`).
   - Por eso el camino con paneles simples del tutorial nunca se usa, aunque `CLAUDE.md` dice que existe.
   - ¿El tutorial debe respetar el interruptor de primera persona? Recomendado: sí, si estaba apagado.

---

## Tarea 2 — Nándor: la cara de Fernando en el guía y en el comerciante

La cabeza ya está hecha en **`src/models/nandor-head.js`**. Todavía **no** está en `src/manifest.json`.

- Vista previa:
  https://raw.githubusercontent.com/FernandoMijangos16/SwapHolm/capturas-claude/nandor/nandor-muestra.png
- Rasgos: rizos castaño oscuro con fleco y costados cortos, cejas gruesas, ojos gris azulado de párpado pesado, nariz
  marcada, labios llenos, bigote delgado, barba rala y lentes de aros hexagonales azul marino con patillas doradas.

### Qué trae `nandor-head.js`

- `nandorFaceMat(expr)`: la cara de 16×16, una por expresión: sonrisa, serio, risa, cansado, duda, triste, sorpresa,
  guiño y enojo. Tiene caché propia y se agrega a `CACHED_MATS`.
- `nandorHead(expr, { glasses = true })`: devuelve `{ head, face }`.
  - `head` tiene la misma forma que la cabeza de `makePerson`: cuello en y = 0, caja `PGEO.rbox` con la cara en el
    material 4, orejas y cabello, más los lentes en 3D.
  - `face` funciona con `setFaceExpr` y trae `make: nandorFaceMat`.
- `useNandorHead(p, expr)`: cambia la cabeza de una persona hecha con `makePerson` y le pone el nombre "Nándor".
  - Ahora **quita todo lo que había en la cabeza**, sombrero incluido. Ve el punto 4 de los pasos.
- Usa `THREE`, `PGEO`, `GEO`, `mesh`, `mat`, `sg` y `CACHED_MATS`, así que va **después de `models/people.js`** en el
  manifiesto.

### Pasos

1. Agrega `models/nandor-head.js` a `src/manifest.json`, justo después de `models/people.js`.
2. En `setFaceExpr` (`models/people.js`), usa la cara propia cuando exista:

   ```js
   F.mesh.material[4] = F.make ? F.make(expr) : faceMat(F.skin, F.hair, { ...F, expr });
   ```

   Los demás aldeanos no tienen `make`, así que no cambian.
3. **El color de piel del cuerpo** debe ser `NANDOR.skin` (`0xe0b49a`), para que manos y cuello combinen con la cara.
   - El guía usa `TRAVELER.o.skin` (`models/traveler.js`).
   - El comerciante usa `MERCHANT.o.skin` (`scenes/market-stall.js`).
4. **Sombreros:** el sombrero es parte del atuendo de cada rol, así que se conserva:
   - el de cuero ancho del viajero: caso `'viajero'`;
   - el de pluma del comerciante: `hat = 'pluma'` para el rol `comerciante`.

   `useNandorHead` hoy los borra. Haz que el sombrero de cada rol quede encima de los rizos, sin que el cabello lo
   atraviese.
   - Puede ser con una opción (`{ hat: 'viajero' }`), sacando la parte de sombreros de `makePerson` a una función con
     el menor cambio posible.
   - **Enséñale capturas a Fernando** de cómo queda con sombrero antes de seguir.
5. **Guía:**
   - En `travelerModel()`, después de `makePerson(...)`, llama a `useNandorHead`.
   - Se quedan la mochila, la cobija, el mapa, la olla, el farol, el bastón y la ropa.
   - La barba gris de Ulises desaparece: Nándor trae su barba en la cara.
   - Para cambiarle la expresión en el tutorial, usa `setFaceExpr(npc, 'risa')`, como con los demás.
6. **Comerciante:**
   - En la tienda (`scenes/market-stall.js`, la línea con `makePerson(mulberry32(MERCHANT.s*97), 'comerciante', …)`),
     cambia solo la cabeza por la de Nándor.
   - Se queda todo el cuerpo: ropa, brazos y animaciones (saluda, piensa, entrega con el brazo y cambia de
     cara con `setFaceExpr`).
   - Revisa que cada expresión que ya usa se vea con la cara nueva.
7. **Avatar del comerciante:** `merchantAvatarURL` dibuja un avatar 2D con `avatarCanvas` (`models/avatars.js`). Ese
   avatar también debe tener la cara de Nándor.
   - Usa los mismos píxeles de `nandorFaceMat` o dibuja la cara con los mismos colores.
   - Búscalo donde aparece: avisos de acción y mercado.
8. **Nombre Ulises → Nándor** en todo lo visible:

   | Lugar | Qué cambiar |
   |---|---|
   | Panel del tutorial (`ui/tutorial-guide.js`) | `<b>Ulises</b><span>el viajero</span>` → Nándor, el viajero |
   | Menú "Cómo jugar" (`ui/menu.js`) | "Ulises, un viajero que recorrió toda la isla…" |
   | Textos de `core/tutorial.js` | donde aparezca Ulises |
   | Comentarios que digan Ulises | `core/specials.js`, `ui/board-input.js`, `styles/main.css`, `models/traveler.js` (`TRAVELER.name`) |
   | `CLAUDE.md` | regla 10 ("Ulises en el tutorial") y pendiente 9 |

   - Los identificadores internos (`TRAVELER`, `travelerModel`, `TUT`) se quedan como están.
   - Si el comerciante dice algo de sí mismo, que encaje con la idea de Fernando: vende lo que trajo de sus viajes por
     los biomas. No inventes diálogos largos; a lo mucho una frase corta en su saludo, y enséñasela a Fernando.
9. **No cambies el estilo:** cara de 16×16 con `NearestFilter`, sin subir la resolución.
   - Si Fernando pide que se parezca más, ajusta píxeles en `nandorFaceMat`.
   - Los rizos van en posiciones fijas a propósito: Nándor siempre se ve igual.
10. Corre `npm run lint` y toma capturas de cerca y de lejos:
    - el guía en el panel del tutorial;
    - el guía en el pueblo;
    - el comerciante saludando y entregando;
    - el avatar del comerciante.

---

## Tarea 3 — Parte 4 del tutorial

Lo que falta del pendiente 9: **eventos de temporada, camino más largo, Guardia más poderosa y cómo se gana.**

### Cómo está hecho el tutorial

- `core/tutorial.js`:
  - `tutSay` espera Siguiente y `tutAct` espera algo del juego.
  - `TUT.allow` y `tutAllow` deciden qué se puede tocar; `TUT.dice` son los dados fijos.
  - `tutTopUp` completa recursos.
  - `tutQuest` y `tutFind` vienen de la parte 3.
  - `TUT_CHAPTERS` tiene 12 capítulos.
  - Los saltos son `tutSkipToPart2` y `tutSkipToPart3`.
  - `tutScript` encadena las partes; el final está en `tutFinish`.
- `ui/tutorial-guide.js`: panel del guía; `tutDodge` aparta la nota.
- La partida es arreglada: mismo mapa, dados en orden fijo, bots que solo tiran y pasan.

### Pide

1. Capítulos nuevos con el mismo estilo de los anteriores: frases cortas, Nándor habla en segunda persona y deja
   probar cada cosa.
   - **Eventos de temporada.** Fuerza uno con `core/events.js` (estado `G.event` y la placa `#b-event`) y explica que
     dura 2–3 rondas, la placa y qué cambia.
     - Recomendado: la **Feria**, porque se nota enseguida al comerciar (4:1 → 3:1).
     - Si `scenesOn()`, que se vea también en el pueblo.
   - **Camino más largo.** Nándor completa recursos para llegar a 5 tramos seguidos y se gana el trofeo. Explica que se
     puede perder si alguien hace uno más largo.
   - **Guardia más poderosa.** En la parte 2 ya se jugó 1 Guardia. Arregla el mazo para que salgan las que falten
     hasta 3 y se gane el trofeo.
   - **Ganar.** Llega a los puntos de victoria con el empujón que haga falta (cartas de Punto de desarrollo, ciudades,
     trofeos). Termina con la pantalla de victoria de siempre y después Volver al menú / Seguir jugando, como hoy.
2. Botón **"Parte 4 · Eventos, trofeos y ganar"** en "Cómo jugar", con `tutSkipToPart4()`, que arma el tablero como
   queda al final de la parte 3.
3. La parte 3 sigue con la parte 4. Cambia el texto de `tutFinish`, que hoy dice que eso falta.
4. **Con primera persona apagada**, los mismos pasos con paneles simples.
5. `CLAUDE.md` (pendiente 9): describe la parte 4 y marca el tutorial como completo si ya lo está.
6. Comparte tus dudas con Fernando **antes** de escribir el guion; por ejemplo, el orden de los capítulos y cuántos
   puntos se necesitan para ganar en el tutorial.

---

## Cómo probar sin perder horas

La sesión anterior tardó más de 3 horas, casi todo en pruebas.

- Antes de un recorrido completo, prueba **solo el capítulo que cambiaste**: inyecta un salto (`tutSkipToPart3()` y
  `tutSkipToPart4()`) y avanza desde ahí.
- Con tarjeta de video, el juego va a velocidad normal; con swiftshader va unas 5 veces más lento.
- Si automatizas con Playwright:
  - Para picar mosaicos de un panel 3D, busca solo dentro del que está visible (`#showcase.show .sct`). Los paneles
    cerrados dejan sus mosaicos en el HTML.
  - El botón Siguiente del guía tiene animación: si `page.click` no responde, usa `element.click()` con JavaScript.
  - No salgas de la oficina con `exitMarket()`. Usa sus botones (`#of-cancel` = guardar la pluma); si no, provocas el
    fallo 5.
  - Para llegar a funciones internas desde `page.evaluate`, agrégalas a `window.__dbg`. `THREE` y `GAME_OPTS` no
    están en el ámbito global.
- Toda prueba debe terminar con **0 errores de página**. Las partes 1, 2 y 3 deben seguir pasando.

## Al terminar

Escribe el resumen en español, en cada PR y en tu último mensaje, con estas secciones:

1. Qué cambió
2. Cómo lo probaste (con capturas)
3. Decisiones que tomé
4. Qué quedó pendiente
