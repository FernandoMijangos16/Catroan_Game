# net/ — multijugador

- `net.js`: salas y chat (T). `netBase()` da la sala: la capacidad `room` de claude.ai; fuera de claude.ai, `hubBase()`
  (`net-hub.js`). Con `window.__tabRooms = true` usa `localRoomBase()` (un canal entre pestañas, para pruebas).
- `net-hub.js`: la computadora del anfitrión es la sala. Misma interfaz que `localRoomBase`; todo pasa por el anfitrión,
  que reenvía los mensajes y lleva la lista de jugadores (con latido cada 2.5 s; 45 s sin noticias = desconectado).
  - **Red local** (solo .exe): servidor WebSocket en el proceso principal de Electron (`electron/lan.js`, puerto 47213).
    La clave lleva la IP privada del anfitrión (`lanKey` / `lanIPFromKey`).
  - **En línea** (.exe y navegador): WebRTC con PeerJS. La clave es el nombre de la sala en el servidor público de
    PeerJS, que solo presenta a los jugadores; los datos van directo entre computadoras (o por el TURN gratis de PeerJS).
  - Claves: 6 letras de `KEY_ABC` = 30 bits. Bit más alto 1 = clave de red local; 0 = clave en línea (`onlineKey`).
- `net-game.js`: la partida en línea. Asientos rotados (cada cliente es el jugador 0), quien actúa manda el estado
  (`netSnap` / `netApply`), decisiones de otros con `netAsk`, cambios fuera de turno con `netOp`, espera en el tablero,
  desconexión → bot, reconexión. No cambió con los transportes nuevos.
