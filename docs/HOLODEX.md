# Agenda de Hololive: comportamiento y prueba

## Funciones actuales

Los widgets disponibles son RSS, directos y divisas. Son tarjetas fijas: todavía no se pueden añadir, desactivar ni reordenar desde la interfaz. Las pestañas móviles cambian el widget visible, pero no lo desactivan ni eliminan sus datos.

La agenda combina imágenes, texto e indicadores de estado:

- Avatares a partir del campo `photo` de Holodex y miniaturas públicas de YouTube con formato `mqdefault.jpg`.
- Título del directo y nombre del canal. La configuración también muestra nombres y avatares, conservando el ID del canal.
- Un círculo rojo luminoso y «Ahora» para emisiones activas, sin etiqueta visible EN VIVO. El nombre y el estado siguen disponibles en etiquetas accesibles.
- Un reloj y día, mes y hora local para emisiones programadas. Si no hay hora válida, muestra «Sin hora anunciada».
- Acentos rosas para Mori Calliope, ámbar para Korone y azules para Kronii; otros canales usan una paleta estable. Son colores de presentación definidos en el proyecto, no colores oficiales obtenidos de la API.
- Marca de última actualización, iconos de carga, correcto, advertencia o sin conexión y controles de paginación. RSS comparte ese lenguaje visual.

La tira superior muestra hasta cinco talentos y un acceso al resto. A alturas de 600 px o menos se oculta para conservar el espacio de la agenda; todos los talentos siguen presentes en la configuración. Los perfiles se guardan en `channelInfo`, dentro del almacenamiento y la exportación de widgets, y se renuevan después de 24 horas sin bloquear la consulta de directos.

No se necesita otra API con credenciales: Holodex proporciona el perfil con la misma clave y YouTube sirve sus imágenes públicas. La primera descarga de imágenes requiere conexión. El service worker `inicio-v4` mantiene la aplicación y una caché independiente `inicio-images-v1` guarda hasta 60 imágenes de `i.ytimg.com`, `yt3.ggpht.com` y `yt3.googleusercontent.com`; no guarda la API, claves ni solicitudes con cabeceras de autenticación. Las imágenes descargadas pueden abrirse offline mientras permanezcan en esa caché. Si una miniatura falla, primero se usa el avatar del canal. Si tampoco hay foto disponible, aparecen iniciales o un icono de reproducción. Los fallos de miniaturas se recuerdan durante la sesión para evitar repetir peticiones fallidas en cada renderizado.

Los indicadores no presentan datos antiguos como un directo confirmado: al renderizar sin conexión, con fallo de actualización, sin fecha válida o tras más de cinco minutos, aparecen en gris como guardados/sin verificar y se retira el resplandor rojo. Las animaciones respetan movimiento reducido. El estilo de avatares, miniaturas, estados y utilidades vive en `visual.css`.

Al pulsar un avatar de la tira se abre el canal de YouTube. Al pulsar una entrada se abre `https://www.youtube.com/watch?v=ID` en una pestaña nueva. Holodex suministra los datos; no es el destino del clic. La consulta incluye eventos en vivo y próximos dentro de siete días, por canal y con paginación. La agenda se actualiza al abrir la página, manualmente y cada dos minutos mientras la página está visible y hay conexión. Los avisos de nuevos directos aparecen dentro de la página, sin notificaciones de fondo.

Los resultados pueden incluir eventos para miembros. El widget no muestra ni comprueba permisos de acceso; YouTube gestiona el acceso al abrir el enlace. Los datos guardados offline no confirman el estado actual de una emisión: consulta la marca de actualización.

## Canales comprobados

Se verificó la identidad de los canales mediante la API de Holodex antes de probarlos.

| Talento | ID de canal de YouTube |
| --- | --- |
| Mori Calliope | `UCL_qhgtOy0dy1Agp8vkySQg` |
| Inugami Korone | `UChAnqc_AY5_I3Px5dig3X1Q` |
| Ouro Kronii | `UCmbs8T6MWqUHP1tIQvSgKrg` |

Para reproducir la configuración, abre Ajustes → Conectar Holodex, guarda tu clave API personal y busca «Calliope», «Korone» o «Kronii» por nombre. Al pulsar «Seguir», la aplicación guarda el ID y el perfil correspondientes sin que tengas que conocer el identificador. La entrada manual por ID sigue disponible dentro de la opción avanzada. La selección usada en las capturas corresponde a una sesión temporal de prueba; no está impuesta como configuración predeterminada para todos los visitantes. Nunca introduzcas la clave en los archivos del proyecto ni en esta documentación.

## Búsqueda por nombre

El directorio se consulta mediante `/channels?type=vtuber&org=Hololive&limit=100&offset=...`, con la misma clave. Se guarda 24 horas en `inicio.holodex-directory.v1`; las pulsaciones filtran localmente nombres ingleses, nativos y alias disponibles, ignorando acentos y el orden de los términos. Los resultados se paginan en grupos de seis y los ya seguidos se identifican como tales. El catálogo guardado se puede buscar sin conexión. Es un dato público derivado y no se incluye en la copia JSON ni contiene la clave.

La consulta real del 8 de noviembre de 2026 a las 22:16 UTC devolvió 138 canales. Se comprobaron búsquedas como «calliope morí», «Korone», «Kronii» y japonés, el guardado del ID interno y el uso offline. El número de canales y sus nombres pueden cambiar con el directorio de Holodex.

La interfaz y los datos locales se muestran primero; las consultas de agenda y perfiles se difieren hasta después del primer pintado y se reanudan al recuperar conexión. El arranque instalado usa caché primero, tal como explica [OFFLINE-AND-CURRENCY.md](OFFLINE-AND-CURRENCY.md).

## Resultados anteriores a la revisión visual

Consulta en Chromium realizada el 8 de noviembre de 2026, a las 13:09 UTC:

| Talento | Resultado devuelto por Holodex |
| --- | --- |
| Mori Calliope | Dos directos programados, el 9 y el 10 de noviembre a las 01:00 UTC. |
| Inugami Korone | Un directo en vivo. |
| Ouro Kronii | Ningún directo en vivo o próximo devuelto para la ventana consultada. |

Es una instantánea de la respuesta de Holodex, no una agenda permanente ni una comprobación independiente de YouTube. Los conteos cambian con los anuncios y el estado de las emisiones.

Se comprobó la carga real en el widget, la paginación y la apertura de una pestaña con la URL correcta de YouTube. En esta última comprobación se interceptó la navegación de destino: no se reprodujo el vídeo ni se verificaron sus permisos. También se comprobó que la exportación no contenga el campo `holodexKey` y que no se produzcan errores JavaScript en la página.

Las pruebas previas de la misma versión verifican la vista sin scroll, ocho favoritos móviles en dos filas sin paginación, configuración del fondo, exportación e imagen disponible offline. Siguen pendientes las comprobaciones en Safari/macOS, Brave/iOS y Brave/Android y la detección de un evento que pase de programado a en vivo durante una sesión.

## Validación de la revisión visual

Consulta real en Chromium el 8 de noviembre de 2026, a las 21:56 UTC:

- Holodex devolvió los tres perfiles con fotos. Las imágenes de `yt3.ggpht.com` cargaron correctamente (800 px de origen) y se visualizaron como avatares compactos.
- La agenda devolvió dos próximos directos de Mori Calliope y ninguno de Korone ni Kronii en la ventana consultada. Los resultados anteriores de las 13:09 se conservan arriba como historial, no como estado actual.
- El proxy del entorno rechazó las miniaturas de YouTube con error de túnel/403. Por ello no se verificó su descarga real; sí se comprobó el paso automático al avatar del canal cuando falla una miniatura. Las capturas muestran ese avatar alternativo.
- Se comprobaron tres imágenes públicas en la caché y la carga real de avatares y alternativas tras desconectar y recargar. Los indicadores cambian a gris/guardado y no mantienen un resplandor rojo offline.
- Se comprobó que la exportación sigue excluyendo `holodexKey` y que la página no produce errores JavaScript.
- Un caso **simulado**, con un estado en vivo creado únicamente para probar el componente, verificó círculo rojo con sombra luminosa, etiqueta accesible y ausencia de una etiqueta EN VIVO visible. Al activar movimiento reducido se detiene la animación; al desconectar se retira el rojo. No corresponde a una emisión real en vivo de Calliope.
- Se verificó que la vista no tenga desplazamiento ni superposición de listas/pies, con widgets vacíos y poblados, perfiles, títulos largos y paginación en 1440×900, 1280×720, 820×1180, 390×844, 375×667, 320×568 y 844×390. También persisten favoritos y apertura offline.

La caché externa se comprobó además con pruebas aisladas del worker: límite de 60 entradas, respuestas opacas, alternativa offline, limpieza de versiones y exclusión de solicitudes autenticadas. La prueba real no demuestra que las miniaturas estén accesibles desde todos los navegadores o redes. Siguen pendientes Safari/macOS y Brave/iOS/Android, y la transición real de una emisión de programada a en vivo.

## Capturas de la revisión visual de las 21:56 UTC

Las capturas contienen ocho favoritos de ejemplo y datos reales de la consulta de las 21:56 UTC, salvo la demostración indicada. No contienen la clave.

- [Escritorio: avatares y próximos directos](screenshots/desktop.png).
- [Móvil: favoritos en dos filas y agenda visual](screenshots/mobile.png).
- [Configuración de talentos con nombres y fotos](screenshots/talents.png).
- [Estado offline con imágenes guardadas](screenshots/offline.png).
- [Demostración simulada del círculo rojo en vivo](screenshots/live-state-demo.png).

## Siguientes mejoras posibles

- Selector para activar o desactivar cada widget y añadir los disponibles.
- Distinguir con más detalle «sin próximos eventos» de errores de consulta por canal. Los nombres y avatares en la configuración ya están implementados.

Estas mejoras todavía no están implementadas.

La revisión posterior de búsqueda por nombre, conversión y RSS, con sus capturas actuales, está en [OFFLINE-AND-CURRENCY.md](OFFLINE-AND-CURRENCY.md). La búsqueda por nombre ya está implementada; la entrada manual por ID es solo avanzada.
