# net/ — multijugador

- `net.js`: transporte y salas. `netBase()` da la sala: la capacidad `room` de claude.ai, o `localRoomBase()` (un
  canal entre pestañas para probar). Claves de sala, presencia y chat (T).
- `net-game.js`: la partida en línea. Asientos rotados (cada cliente es el jugador 0), quien actúa manda el estado
  (`netSnap` / `netApply`), decisiones de otros con `netAsk`, cambios fuera de turno con `netOp`, espera en el tablero,
  desconexión → bot, reconexión.

Para el .exe: escribir un transporte con la misma interfaz que `localRoomBase` (servidor WebSocket del anfitrión en
Electron, clave a partir de su IP local). `net-game.js` no debería cambiar.
