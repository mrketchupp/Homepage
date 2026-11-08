# Estado y hoja de ruta

Este documento distingue la implementación actual de las ideas futuras. No implica que las mejoras estén terminadas ni que deban realizarse sin revisar prioridades con el usuario.

## Implementado

- Página estática adaptable con estética oscura inspirada en Liquid Glass, iconos SVG, estados visuales y soporte de movimiento reducido.
- Vista principal sin scroll de página: tres widgets en un panel compacto de hasta 280 px de alto en escritorio, ajustado al espacio disponible; pestañas en pantallas pequeñas. Favoritos con hasta seis elementos por fila en escritorio y ocho en dos filas de cuatro en móvil con más de 520 px de alto; en pantallas bajas se conserva una fila. Se pagina al superar esa capacidad y las listas de widgets también se adaptan al espacio. La configuración abre modales que sí admiten scroll interno.
- Favoritos con alta y eliminación, buscadores Startpage, Ecosia, DuckDuckGo y Brave, fecha y estado de conexión.
- Fondo de prueba con la imagen del usuario en `assets/background.jpg`, activado por defecto. Controles para alternar imagen/degradado, oscurecimiento 20–85 %, desenfoque 0–12 px, encuadre horizontal/vertical y restablecimiento; persistencia en `inicio.background.v1`.
- Importación y exportación JSON local, con normalización de los elementos de widgets y ajustes opcionales del fondo compatibles con las copias existentes de versión 1. La clave de Holodex no se exporta.
- Aplicación instalable con manifiesto y caché de recursos del mismo origen mediante service worker (`inicio-v3`), incluidos el módulo y la imagen del fondo. La primera visita requiere conexión; la caché depende del navegador.
- RSS y Atom mediante AllOrigins, con conservación local de artículos y mensaje de error si falla una actualización.
- Consulta de directos de YouTube de canales seleccionados mediante Holodex por canal y con paginación; aviso dentro de la página al detectar un directo nuevo durante una sesión abierta. Las peticiones usan un tiempo límite con `AbortController`.
- Enlace al conversor oficial de Mastercard.

## Verificaciones realizadas

- En Chromium: carga, persistencia de un favorito y reapertura offline tras instalar la caché.
- En Chromium: normalización de widgets malformados, paginación de lecturas y apertura de configuración modal.
- Holodex respondió HTTP 200 con una credencial real. También se probó el widget desde Chromium: cargó dos directos reales de un canal temporal de prueba y la exportación excluyó la clave. No se guardaron credenciales en el repositorio ni se eligieron talentos del usuario por defecto.

- En Chromium: sin desbordamiento horizontal ni vertical, tanto vacío como con listas paginadas, a 1440×900, 1280×720, 820×1180, 390×844, 375×667, 320×568 y 844×390. Se comprobó que los elementos de las listas no se superponen al pie de las tarjetas, el cambio de pestañas y la paginación de favoritos.

- En la revisión actual en Chromium: capturas del fondo; ocho favoritos en dos filas sin paginación; tamaños desde 320×568 hasta 1440×900, incluida orientación horizontal, con listas vacías y pobladas sin desbordamientos; controles del fondo, persistencia, exportación integrada e imagen disponible offline.

## Pendiente de verificar

- Probar la instalación y apertura offline, y la configuración como inicio o nueva pestaña, en Safari de macOS y Brave de iOS y Android. No asumir que todos permiten sustituir la nueva pestaña o conservan la caché indefinidamente.
- Probar feeds RSS y Atom reales, incluidos errores parciales y contenido guardado offline, considerando la disponibilidad y privacidad del intermediario.
- Holodex se probó con Mori Calliope, Inugami Korone y Ouro Kronii: devolvió dos próximos directos de Calliope, uno en vivo de Korone y ninguno de Kronii en la ventana consultada. Se comprobó el destino YouTube en otra pestaña y la exclusión de la clave en la exportación. Consulta [HOLODEX.md](HOLODEX.md) para fecha, alcance y capturas. Quedan pendientes los avisos al cambiar un directo a estado en vivo y el comportamiento al volver de una pestaña en segundo plano.
- Probar copias entre navegadores, así como la accesibilidad de teclado, lectores de pantalla y reducción de movimiento.

## Candidatos para próximas iteraciones

1. Permitir mostrar, ocultar y reordenar widgets; la versión actual muestra tarjetas fijas.
2. Mejorar la gestión de marcadores: edición, agrupación y búsqueda. La versión actual permite añadirlos y eliminarlos.
3. Mejorar la configuración y presentación de los talentos seguidos, incluidos posibles avatares o miniaturas, sin limitar futuras plataformas a YouTube en el diseño de datos. La agenda actual es textual y los enlaces de los directos abren YouTube en una pestaña nueva.
4. Evaluar una integración directa con Mastercard solo si se dispone del acceso autorizado a su API. Hasta entonces usar el enlace oficial, sin inventar tasas.
5. Evaluar alternativas al proxy RSS público, sus implicaciones de privacidad y coste, y la necesidad de alojar un servicio propio.
6. Si el usuario lo desea más adelante, estudiar sincronización automática; actualmente cada navegador guarda sus propios datos y se trasladan mediante archivos.

Las tareas, notas, temas configurables y notificaciones de fondo se mencionaron como posibilidades durante la planificación, pero no forman parte de la implementación actual ni son requisitos confirmados para la primera versión.

## Limitaciones técnicas conocidas

- La imagen del fondo es un asset fijo; los controles ajustan su apariencia, pero aún no permiten elegir ni cargar otra imagen desde la interfaz.

- La importación normaliza los elementos de widgets, pero las escrituras de favoritos, motor y widgets en `localStorage` aún no forman una operación transaccional. Un fallo de almacenamiento durante la importación puede dejar una copia aplicada parcialmente; conviene añadir validación previa de toda la copia y recuperación.
- Holodex, AllOrigins y sus límites de servicio condicionan las actualizaciones; offline se consultan únicamente los datos guardados.
