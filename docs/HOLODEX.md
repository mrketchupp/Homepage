# Agenda de Hololive: comportamiento y prueba

## Funciones actuales

Los widgets disponibles son RSS, directos y divisas. Son tarjetas fijas: todavía no se pueden añadir, desactivar ni reordenar desde la interfaz. Las pestañas móviles cambian el widget visible, pero no lo desactivan ni eliminan sus datos.

La agenda muestra únicamente texto, sin avatar del talento ni miniatura del vídeo:

- Título del directo y nombre del canal.
- Etiqueta «EN VIVO» y «Ahora» si está en emisión.
- Día, mes y hora de inicio para emisiones programadas, en la zona horaria del navegador. Si no hay hora válida, muestra «Sin hora anunciada».
- Fecha y hora de la última actualización del widget, errores de actualización y controles de paginación.

Al pulsar una entrada se abre `https://www.youtube.com/watch?v=ID` en una pestaña nueva. Holodex suministra los datos; no es el destino del clic. La consulta incluye eventos en vivo y próximos dentro de siete días, por canal y con paginación. La agenda se actualiza al abrir la página, manualmente y cada dos minutos mientras la página está visible y hay conexión. Los avisos de nuevos directos aparecen dentro de la página, sin notificaciones de fondo.

Los resultados pueden incluir eventos para miembros. El widget no muestra ni comprueba permisos de acceso; YouTube gestiona el acceso al abrir el enlace. Los datos guardados offline no confirman el estado actual de una emisión: consulta la marca de actualización.

## Canales comprobados

Se verificó la identidad de los canales mediante la API de Holodex antes de probarlos.

| Talento | ID de canal de YouTube |
| --- | --- |
| Mori Calliope | `UCL_qhgtOy0dy1Agp8vkySQg` |
| Inugami Korone | `UChAnqc_AY5_I3Px5dig3X1Q` |
| Ouro Kronii | `UCmbs8T6MWqUHP1tIQvSgKrg` |

Para reproducir la configuración, abre Ajustes → Conectar Holodex, guarda tu clave API personal y añade estos IDs mediante «Seguir canal». La selección usada en las capturas corresponde a una sesión temporal de prueba; no está impuesta como configuración predeterminada para todos los visitantes. Nunca introduzcas la clave en los archivos del proyecto ni en esta documentación.

## Resultados de esta revisión

Consulta en Chromium realizada el 8 de noviembre de 2026, a las 13:09 UTC:

| Talento | Resultado devuelto por Holodex |
| --- | --- |
| Mori Calliope | Dos directos programados, el 9 y el 10 de noviembre a las 01:00 UTC. |
| Inugami Korone | Un directo en vivo. |
| Ouro Kronii | Ningún directo en vivo o próximo devuelto para la ventana consultada. |

Es una instantánea de la respuesta de Holodex, no una agenda permanente ni una comprobación independiente de YouTube. Los conteos cambian con los anuncios y el estado de las emisiones.

Se comprobó la carga real en el widget, la paginación y la apertura de una pestaña con la URL correcta de YouTube. En esta última comprobación se interceptó la navegación de destino: no se reprodujo el vídeo ni se verificaron sus permisos. También se comprobó que la exportación no contenga el campo `holodexKey` y que no se produzcan errores JavaScript en la página.

Las pruebas previas de la misma versión verifican la vista sin scroll, ocho favoritos móviles en dos filas sin paginación, configuración del fondo, exportación e imagen disponible offline. Siguen pendientes las comprobaciones en Safari/macOS, Brave/iOS y Brave/Android y la detección de un evento que pase de programado a en vivo durante una sesión.

## Capturas actuales

Las capturas contienen ocho favoritos de ejemplo y datos reales de la consulta indicada; no contienen la clave.

- [Escritorio: Korone en vivo](screenshots/desktop.png).
- [Escritorio: próximo directo de Calliope](screenshots/calliope.png).
- [Móvil: favoritos en dos filas y agenda](screenshots/mobile.png).

## Siguientes mejoras posibles

- Selector para activar o desactivar cada widget y añadir los disponibles.
- Avatar del canal y/o miniatura, con alternativa si falta la imagen o no hay conexión.
- Mostrar los talentos por nombre en la configuración, y distinguir «sin próximos eventos» de errores de consulta por canal.

Estas mejoras todavía no están implementadas.
