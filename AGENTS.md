# Guía para trabajar en Inicio

## Propósito y preferencias

Este repositorio contiene una página de inicio personal, mínima y ampliable con widgets. Sus dispositivos objetivo son Safari en macOS y Brave en iOS y tablet Android. El usuario eligió una estética inspirada en Liquid Glass y quiere animaciones que comuniquen el estado de forma visual. Conserva la legibilidad, la adaptación a pantallas pequeñas y la opción de reducir movimiento.

Las prioridades acordadas son favoritos, feeds RSS y seguimiento de algunos talentos de Hololive en YouTube. La búsqueda debe ofrecer motores centrados en privacidad: no añadir Google ni Bing como predeterminados. El usuario aceptó trasladar datos entre navegadores mediante importación y exportación; no se ha solicitado sincronización automática. Los avisos deseados inicialmente son dentro del sitio mientras está abierto, no notificaciones de fondo.

## Arquitectura actual

- Proyecto estático, sin framework, compilación ni dependencias de producción: `index.html`, `style.css`, `app.js` y `widgets.js`.
- `app.js` gestiona búsqueda, favoritos, fecha, conectividad, copia JSON y registro del service worker. `widgets.js` administra los widgets RSS y Holodex y sus datos locales.
- `sw.js` precarga los archivos de la aplicación y usa una estrategia de red primero con caché como alternativa para recursos del mismo origen. Actualiza el nombre de caché y la lista de archivos cuando corresponda al cambiar los recursos offline.
- `manifest.webmanifest` describe la aplicación instalable. La disponibilidad de instalación, página de inicio y nueva pestaña varía por navegador y sistema; compruébala en los dispositivos objetivo.
- Los datos están en `localStorage` del navegador, bajo `inicio.bookmarks.v1`, `inicio.engine` y `homepage.widgets.v1`. El formato de exportación tiene `version: 1`. Trata los cambios de formato como migraciones y conserva la importación de copias existentes.
- Las fuentes RSS se consultan mediante AllOrigins, que recibe las URL. Los datos recientes se guardan en el navegador. Evita utilizarlo para feeds privados.
- Holodex necesita una clave personal y IDs de canales de YouTube. La clave se almacena en el navegador y se excluye de la copia exportada. El widget consulta periódicamente mientras la página está visible y muestra un aviso en ella cuando detecta un directo nuevo. No promete notificaciones con la página cerrada.
- El widget de divisas enlaza al conversor oficial de Mastercard; no calcula tasas en el sitio ni integra su API.

## Desarrollo y comprobación

Sirve la raíz con `python3 -m http.server 8000` y abre `http://localhost:8000`. No uses `file://` para probar módulos o service workers. Para probar en otros dispositivos hace falta un origen HTTPS accesible. Carga la página con conexión al menos una vez antes de probar offline y ten en cuenta que el navegador puede borrar sus datos o caché.

No existe una suite automatizada configurada. Como mínimo, comprueba la sintaxis de los archivos JavaScript con `node --check app.js`, `node --check widgets.js` y `node --check sw.js`, y prueba los cambios relevantes en navegador. Para cambios de funcionamiento, revisa en particular persistencia de favoritos, exportación/importación, primera carga y recarga offline, estados vacíos y errores de red. No afirmes que una integración externa funciona sin haberla probado con datos y credenciales válidos.

Consulta [docs/ROADMAP.md](docs/ROADMAP.md) para el estado y el trabajo pendiente. Mantén la documentación alineada con el comportamiento real y evita incluir credenciales o datos privados en el repositorio.
