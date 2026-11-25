# electron/ — versión de escritorio (pendiente)

La ventana de Electron carga el juego construido (`dist/catroan.html`) con three.js y la fuente copiados dentro del
proyecto, para que funcione sin internet. El proceso principal levantará el servidor WebSocket del anfitrión para el
multijugador por IP. Salidas: instalador (nsis) y portátil para Windows.

Desde Linux, electron-builder necesita Wine para generar el .exe (`sudo pacman -S wine` en CachyOS / Arch) o la imagen
de Docker `electronuserland/builder:wine`. Ver `CLAUDE.md`.
