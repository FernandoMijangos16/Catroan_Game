# electron/ — versión de escritorio

- `main.js`: la ventana. Carga `dist/desktop/` (el build sin internet: three.js r160 y Pixelify Sans copiados) por
  un esquema propio `app://` para que los módulos carguen y `localStorage` tenga un origen fijo. Abre maximizada,
  sin barra de menús; **F11** cambia a pantalla completa y **F12** (o Ctrl+Shift+I) abre la consola para ver errores. "Salir" del menú cierra la app (`window.close()`).
- `icon.png`: ícono de 512 px, renderizado con los modelos del juego (hexágono de pradera, ciudad roja, árboles).
- `lan.js` + `preload.cjs`: multijugador en red local. El anfitrión abre un servidor WebSocket (puerto 47213);
  la página solo ve `window.catroanDesk` (enviar/recibir texto), nada más de Node.
- `build-win.sh`: genera los .exe dentro de Docker (`electronuserland/builder:wine`), sin Wine local.
- `archive-release.sh`: antes de cada `npm run dist*` mueve los ejecutables anteriores a
  `release/versiones-antiguas/<fecha>_<hora>/`, así nunca se pierde una versión.

## Comandos

```
npm start            # build + abre el juego en Electron
npm run dist:linux   # release/Catroan-<versión>.AppImage
npm run dist:win     # release/Catroan-Setup-<versión>.exe (instalador) y Catroan-Portable-<versión>.exe (Docker)
npm run dist         # las tres salidas
```

## Notas

- El Wine local de CachyOS se queda colgado al generar el desinstalador de NSIS; por eso los .exe se hacen con Docker.
- Los .exe no van firmados: Windows muestra SmartScreen ("Windows protegió su PC") la primera vez. Se abre con
  **Más información → Ejecutar de todas formas**. Firmarlos requiere un certificado de firma de código (de pago).
- La primera vez que el anfitrión crea una partida **Local**, Windows pregunta si Catroan puede usar la red: hay que
  permitir **redes privadas**. Si no, los demás no lo encuentran.
