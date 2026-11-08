# Estado y hoja de ruta

Este documento distingue la implementación actual de las ideas futuras. No implica que las mejoras estén terminadas ni que deban realizarse sin revisar prioridades con el usuario.

## Implementado

- Página estática adaptable con estética oscura inspirada en Liquid Glass, estados visuales y soporte de movimiento reducido.
- Favoritos con alta y eliminación, buscadores Startpage, Ecosia, DuckDuckGo y Brave, fecha y estado de conexión.
- Importación y exportación JSON local. La clave de Holodex no se exporta.
- Aplicación instalable con manifiesto y caché de recursos del mismo origen mediante service worker. La primera visita requiere conexión; la caché depende del navegador.
- RSS y Atom mediante AllOrigins, con conservación local de artículos y mensaje de error si falla una actualización.
- Consulta de directos de YouTube de canales seleccionados mediante Holodex y aviso dentro de la página al detectar un directo nuevo durante una sesión abierta.
- Enlace al conversor oficial de Mastercard.

## Pendiente de verificar

- Probar la instalación y apertura offline, y la configuración como inicio o nueva pestaña, en Safari de macOS y Brave de iOS y Android. No asumir que todos permiten sustituir la nueva pestaña o conservan la caché indefinidamente.
- Probar feeds RSS y Atom reales, incluidos errores parciales y contenido guardado offline, considerando la disponibilidad y privacidad del intermediario.
- Probar la API de Holodex con una clave válida y canales seleccionados, los límites de consulta, la precisión de los resultados y los avisos al cambiar un directo a estado en vivo. Confirmar comportamiento de pestañas en segundo plano y al volver a estar visibles.
- Probar copias entre navegadores, así como la accesibilidad de teclado, lectores de pantalla y reducción de movimiento.

## Candidatos para próximas iteraciones

1. Permitir mostrar, ocultar y reordenar widgets; la versión actual muestra tarjetas fijas.
2. Mejorar la gestión de marcadores: edición, agrupación y búsqueda. La versión actual permite añadirlos y eliminarlos.
3. Mejorar la configuración y presentación de los talentos seguidos, sin limitar futuras plataformas a YouTube en el diseño de datos.
4. Evaluar una integración directa con Mastercard solo si se dispone del acceso autorizado a su API. Hasta entonces usar el enlace oficial, sin inventar tasas.
5. Evaluar alternativas al proxy RSS público, sus implicaciones de privacidad y coste, y la necesidad de alojar un servicio propio.
6. Si el usuario lo desea más adelante, estudiar sincronización automática; actualmente cada navegador guarda sus propios datos y se trasladan mediante archivos.

Las tareas, notas, temas configurables y notificaciones de fondo se mencionaron como posibilidades durante la planificación, pero no forman parte de la implementación actual ni son requisitos confirmados para la primera versión.

## Limitaciones técnicas conocidas

- La consulta Holodex obtiene hasta 100 resultados generales y después filtra los canales elegidos; puede omitir directos si el conjunto supera ese límite. Investigar el filtrado por canal y la paginación antes de depender de una agenda completa.
- La importación comprueba la estructura básica de los favoritos, pero no valida de forma exhaustiva cada elemento de los widgets ni es transaccional. Una copia dañada puede dejar datos inconsistentes; mejorar la validación y probar la recuperación.
- Las consultas usan `AbortSignal.timeout`; comprobar su compatibilidad con las versiones de Safari y Brave objetivo y ofrecer una alternativa si es necesario.
