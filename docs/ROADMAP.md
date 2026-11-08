# Estado y hoja de ruta

Este documento distingue la implementación actual de las ideas futuras. No implica que las mejoras estén terminadas ni que deban realizarse sin revisar prioridades con el usuario.

## Implementado

- Página estática adaptable con estética oscura inspirada en Liquid Glass, iconos SVG, estados visuales y soporte de movimiento reducido.
- Vista principal sin scroll de página: tres widgets en un panel compacto de hasta 280 px de alto en escritorio, ajustado al espacio disponible; pestañas en pantallas pequeñas. Favoritos con hasta seis elementos por fila en escritorio y ocho en dos filas de cuatro en móvil con más de 520 px de alto; en pantallas bajas se conserva una fila. Se pagina al superar esa capacidad y las listas de widgets también se adaptan al espacio. La configuración abre modales que sí admiten scroll interno.
- Favoritos con alta y eliminación, buscadores Startpage, Ecosia, DuckDuckGo y Brave, fecha y estado de conexión.
- Fondo de prueba con la imagen del usuario en `assets/background.jpg`, activado por defecto. Controles para alternar imagen/degradado, oscurecimiento 20–85 %, desenfoque 0–12 px, encuadre horizontal/vertical y restablecimiento; persistencia en `inicio.background.v1`.
- Importación y exportación JSON local, con normalización de los elementos de widgets y ajustes opcionales del fondo compatibles con las copias existentes de versión 1. La clave de Holodex no se exporta.
- Aplicación instalable con manifiesto y caché primero de recursos del mismo origen mediante service worker (`inicio-v5`), incluidos el módulo y la imagen del fondo. Los recursos instalados se muestran sin esperar la red, las nuevas versiones se precargan con el worker y las API quedan excluidas. Los módulos muestran datos locales antes de consultar online después del primer pintado. La primera visita requiere conexión; la caché depende del navegador.
- RSS y Atom por URL de feed, con lectura directa sin cookies y AllOrigins como alternativa para CORS, con titulares guardados localmente y actualización al abrir, manualmente y al recuperar conexión. No descarga artículos completos.
- Búsqueda de talentos por nombre desde el directorio Hololive de Holodex, con caché de 24 horas, búsqueda local sin peticiones por tecla y entrada manual avanzada. El ID se guarda internamente. Consulta de directos de YouTube de canales seleccionados mediante Holodex por canal y con paginación; aviso dentro de la página al detectar un directo nuevo durante una sesión abierta. Las peticiones usan un tiempo límite con `AbortController`.
- Avatares de Holodex (`photo`) con perfiles locales `channelInfo` y TTL de 24 horas; miniaturas públicas de YouTube (`mqdefault.jpg`). No se requiere otra clave. La tira muestra hasta cinco talentos y acceso al resto, se oculta a alturas de 600 px o menos y la configuración conserva todos los nombres y avatares.
- Identidad visual de Calliope en rosa, Korone en ámbar y Kronii en azul; paleta estable para otros. Círculo rojo con resplandor para directos activos, reloj para próximos y gris para datos guardados sin confirmar. Las etiquetas accesibles, las fechas y el movimiento reducido complementan los estados visuales. `visual.css` separa esta capa del estilo base.
- Caché `inicio-images-v1` de hasta 60 imágenes públicas, limitada a hosts de YouTube/Google: `i.ytimg.com`, `yt3.ggpht.com` y `yt3.googleusercontent.com`. Las peticiones omiten credenciales; la API y las peticiones autenticadas no se guardan. Primera descarga con conexión; uso offline solo si las imágenes siguen guardadas. Si falla una miniatura se intenta el avatar; si falta la foto, iniciales o reproducción.
- Conversión integrada con `currency.js` y el backend sin dependencias `server.py`, que consulta el servicio público utilizado por Mastercard. Estimación con fecha del tipo y comisión bancaria cero; el importe se calcula localmente y no se envía al proveedor. Hasta 40 pares guardados, con caché de una hora en servidor y renovación tras 24 horas en navegador. Conserva el enlace oficial y distingue la falta de backend estático. No se exportan todavía ajustes y cotizaciones del conversor.

## Verificaciones realizadas

- En Chromium: carga, persistencia de un favorito y reapertura offline tras instalar la caché.
- En Chromium: normalización de widgets malformados, paginación de lecturas y apertura de configuración modal.
- Holodex respondió HTTP 200 con una credencial real. También se probó el widget desde Chromium: cargó dos directos reales de un canal temporal de prueba y la exportación excluyó la clave. No se guardaron credenciales en el repositorio ni se eligieron talentos del usuario por defecto.

- En Chromium: sin desbordamiento horizontal ni vertical, tanto vacío como con listas paginadas, a 1440×900, 1280×720, 820×1180, 390×844, 375×667, 320×568 y 844×390. Se comprobó que los elementos de las listas no se superponen al pie de las tarjetas, el cambio de pestañas y la paginación de favoritos.

- En la revisión actual en Chromium: capturas del fondo; ocho favoritos en dos filas sin paginación; tamaños desde 320×568 hasta 1440×900, incluida orientación horizontal, con listas vacías y pobladas sin desbordamientos; controles del fondo, persistencia, exportación integrada e imagen disponible offline.

## Validación de la revisión visual

En Chromium se descargaron las fotos reales de los tres talentos y dos próximos directos de Calliope. Se verificaron avatares y alternativas guardadas offline, exclusión de la clave, ausencia de errores JavaScript, etiquetas accesibles, movimiento reducido y el círculo rojo en un caso simulado. Las miniaturas de YouTube están bloqueadas por el proxy del entorno; la alternativa al avatar funciona. La matriz de siete tamaños con perfiles y listas, desde 320×568 hasta escritorio y horizontal, no presentó scroll ni superposición. Los detalles, fecha y capturas están en [HOLODEX.md](HOLODEX.md).

## Revisión de arranque, nombres y conversión

La API real devolvió 138 canales Hololive a las 22:16 UTC del 8 de noviembre de 2026. Se comprobaron búsquedas por nombre, japonés y catálogo offline. El arranque instalado con el origen retrasado cuatro segundos mostró la vista en unos 109 ms y pasó también sin conexión. La interfaz cargó diez entradas reales de NASA por CORS directo y una cotización real de Mastercard, con cálculo local y datos guardados offline; las capturas y pruebas completas están en [OFFLINE-AND-CURRENCY.md](OFFLINE-AND-CURRENCY.md).

## Pendiente de verificar

- Probar la instalación y apertura offline, y la configuración como inicio o nueva pestaña, en Safari de macOS y Brave de iOS y Android. No asumir que todos permiten sustituir la nueva pestaña o conservan la caché indefinidamente.
- Ampliar las pruebas a otros feeds, Atom real y errores parciales; NASA y sus titulares offline ya se comprobaron. Considerar la disponibilidad del intermediario cuando no haya CORS directo.
- Holodex se probó con Mori Calliope, Inugami Korone y Ouro Kronii: devolvió dos próximos directos de Calliope, uno en vivo de Korone y ninguno de Kronii en la ventana consultada. Se comprobó el destino YouTube en otra pestaña y la exclusión de la clave en la exportación. Consulta [HOLODEX.md](HOLODEX.md) para fecha, alcance y capturas. Quedan pendientes los avisos al cambiar un directo a estado en vivo y el comportamiento al volver de una pestaña en segundo plano.
- Probar copias entre navegadores, así como la accesibilidad de teclado, lectores de pantalla y reducción de movimiento.

## Candidatos para próximas iteraciones

1. Permitir mostrar, ocultar y reordenar widgets; la versión actual muestra tarjetas fijas.
2. Mejorar la gestión de marcadores: edición, agrupación y búsqueda. La versión actual permite añadirlos y eliminarlos.
3. Mejorar la configuración de los talentos y permitir ajustar sus colores si resulta necesario. Los avatares, miniaturas y nombres en configuración ya están implementados; los enlaces de los directos siguen abriendo YouTube en una pestaña nueva. Considerar futuras plataformas sin darlas por integradas.
4. Preparar un alojamiento del backend de conversión si se quiere usar la integración fuera del servidor local; conservar fecha, estimación y enlace oficial. Evaluar APIs con contrato estable si cambia el endpoint público de Mastercard. No sustituir tipos por los de otro proveedor sin identificarlo.
5. Evaluar alternativas al proxy RSS público, sus implicaciones de privacidad y coste, y la necesidad de alojar un servicio propio.
6. Si el usuario lo desea más adelante, estudiar sincronización automática; actualmente cada navegador guarda sus propios datos y se trasladan mediante archivos.

Las tareas, notas, temas configurables y notificaciones de fondo se mencionaron como posibilidades durante la planificación, pero no forman parte de la implementación actual ni son requisitos confirmados para la primera versión.

## Limitaciones técnicas conocidas

- La imagen del fondo es un asset fijo; los controles ajustan su apariencia, pero aún no permiten elegir ni cargar otra imagen desde la interfaz.

- La importación normaliza los elementos de widgets, pero las escrituras de favoritos, motor y widgets en `localStorage` aún no forman una operación transaccional. Un fallo de almacenamiento durante la importación puede dejar una copia aplicada parcialmente; conviene añadir validación previa de toda la copia y recuperación.
- El conversor requiere `/api/currency`; un alojamiento estático como GitHub Pages no ejecuta `server.py`. El servicio público de Mastercard puede cambiar y las cotizaciones y opciones aún no se incluyen en el backup.
- Holodex, AllOrigins y sus límites de servicio condicionan las actualizaciones; offline se consultan únicamente los datos guardados. Los estados en vivo pasan a guardados/sin verificar al renderizar sin conexión, con fallo de consulta o tras más de cinco minutos desde la última actualización. Las imágenes pueden faltar por red, restricciones, eliminación del vídeo o expulsión de la caché; sus alternativas no implican un nuevo estado del directo.
