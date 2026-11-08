# Inicio

Una página de inicio personal, ligera y adaptable, con favoritos, RSS, seguimiento de directos y búsqueda con motores centrados en la privacidad.

## Uso local

Sirve esta carpeta mediante HTTP, por ejemplo `python3 -m http.server 8000`, y abre `http://localhost:8000`. Los módulos y el almacenamiento offline no funcionan correctamente al abrir el archivo directamente. Para usarla en otros dispositivos es necesario alojarla en una dirección HTTPS. Visítala una vez con conexión para guardar la aplicación en el navegador; después podrá abrirse sin conexión mientras el navegador conserve su caché. El modo privado y la limpieza de datos pueden eliminarla.

Los marcadores y ajustes se guardan en cada navegador. Utiliza Ajustes → Exportar datos e Importar datos para trasladarlos. Las búsquedas y enlaces necesitan conexión. La disponibilidad como página de inicio o nueva pestaña depende de cada navegador.

## Una pantalla

La vista principal ocupa la pantalla disponible sin desplazamiento de página. En escritorio muestra las tarjetas RSS, directos y divisas en un panel compacto de hasta 280 px de alto, que se adapta al espacio disponible. En pantallas pequeñas puedes cambiar de widget mediante pestañas. Los favoritos tienen una fila de hasta seis elementos en escritorio y dos filas de cuatro en móvil cuando el alto supera 520 px: caben ocho favoritos antes de paginar. En pantallas bajas se conserva una fila. Las listas de lecturas y directos también se reparten en páginas según el espacio disponible, con controles para avanzar y retroceder. La configuración se abre en ventanas modales, cuyo contenido sí puede desplazarse si lo necesita.

La interfaz usa iconos SVG y respeta la preferencia del sistema de reducir movimiento.

## Fondo

La imagen compartida por el usuario está incluida como fondo de prueba en `assets/background.jpg`, activada por defecto y disponible offline después de la primera carga. En Ajustes → Fondo puedes alternar entre la imagen y el degradado, ajustar el oscurecimiento (20–85 %), el desenfoque (0–12 px) y el encuadre horizontal y vertical (0–100 %), o restablecer los valores iniciales.

Los controles se aplican al momento y se guardan en cada navegador. Sus valores se incluyen en las copias JSON; las copias anteriores siguen siendo compatibles. La imagen es un archivo fijo del proyecto: todavía no se puede sustituir desde la interfaz.

## Widgets

Los feeds RSS se consultan mediante un intermediario público, que recibe la URL del feed; no añadas feeds privados. Las actualizaciones requieren conexión y dependen de la disponibilidad de ese servicio. Los datos descargados se conservan localmente.

El seguimiento de directos utiliza Holodex y requiere una clave API propia y los identificadores de los canales de YouTube. La consulta se realiza por canal y pagina los resultados. Los avisos se muestran dentro de la página mientras está abierta; no son notificaciones en segundo plano. La clave se guarda en el navegador y no se incluye en las copias de seguridad ni en el código del proyecto.

El enlace de divisas abre el conversor oficial de Mastercard; necesita conexión. No se calculan tipos de cambio sin acceso autorizado a la API oficial.

### Qué muestra el widget de directos

La agenda muestra avatares de los talentos y miniaturas de los vídeos, además del título, canal y fecha y hora de inicio en la zona horaria del navegador. Un círculo rojo luminoso y el texto «Ahora» identifican los directos activos; un reloj identifica los próximos. Las emisiones activas se ordenan primero. Los nombres y estados conservan etiquetas accesibles: no dependen solo del color. La tarjeta indica última actualización, errores y paginación. No muestra espectadores, duración ni descripción.

Los acentos de Mori Calliope son rosas, los de Korone ámbar y los de Kronii azules; otros talentos reciben un color estable de la paleta. Son decisiones visuales del proyecto. La tira de avatares muestra hasta cinco talentos y un acceso al resto; en pantallas de 600 px de alto o menos se oculta para dejar sitio a los directos. La configuración sigue mostrando todos los talentos con su nombre y avatar.

Los perfiles se obtienen del campo `photo` de Holodex y se guardan localmente en `channelInfo` durante 24 horas antes de renovar la consulta. Las miniaturas proceden de las imágenes públicas de YouTube. Se utiliza la misma clave Holodex, sin otra API con credenciales. Las imágenes requieren conexión para descargarse por primera vez; después pueden estar disponibles offline mientras permanezcan en la caché limitada a 60 imágenes. Si fallan, aparecen iniciales o un icono de reproducción.

Sin conexión, con una actualización fallida o con datos de más de cinco minutos, el estado se presenta en gris como guardado/sin verificar y se retira el resplandor rojo. RSS comparte iconos y señales visuales de carga, actualización correcta, advertencia y desconexión. Las animaciones respetan la preferencia de movimiento reducido.

Pulsar un directo abre su página de **YouTube en una nueva pestaña**. Holodex proporciona los datos de la agenda; el enlace «Ir a Holodex» solo aparece en la configuración. Con la página visible y conexión, la agenda se consulta cada dos minutos; también se puede actualizar manualmente. Los avisos de nuevos directos aparecen dentro del sitio.

Los tres widgets actuales son fijos: todavía no hay un catálogo para añadir otros ni controles para activar, desactivar o reordenar tarjetas. Las pestañas de móvil cambian cuál se ve, sin desactivar el widget ni borrar sus datos.

## Estado y siguientes pasos

Esta es una primera versión. Ya incluye favoritos sencillos (sin carpetas ni edición), buscador, widgets de RSS y directos, enlace al conversor de Mastercard y copia de seguridad manual. Los widgets todavía no se pueden reordenar. La personalización del fondo se complementa con la identidad visual de los talentos y los estados de los widgets; los colores de talento todavía no son configurables. Consulta [docs/ROADMAP.md](docs/ROADMAP.md) para el plan y las limitaciones conocidas, y [AGENTS.md](AGENTS.md) para orientaciones destinadas a futuros colaboradores y modelos.

Se han comprobado en Chromium la carga, la persistencia de favoritos, la reapertura sin conexión tras instalar la caché, la paginación de lecturas y la configuración modal. El widget de Holodex cargó datos reales en Chromium con una credencial temporal de prueba. Se verificó que las listas y pestañas caben sin scroll desde 320×568 hasta escritorio, incluida orientación horizontal. La clave debe introducirse una vez por navegador en Ajustes → Conectar Holodex; nunca está incluida en el código ni en las copias. Aún deben probarse Safari en macOS y Brave en iOS y Android, además de feeds RSS reales y la transición de un directo a estado en vivo.

La revisión visual del nuevo fondo en Chromium incluye capturas y ocho favoritos visibles en móvil sin controles de paginación. También han pasado las pruebas de tamaños desde 320×568 hasta 1440×900, incluida orientación horizontal, con listas vacías y pobladas sin desbordamientos. Se comprobaron los controles del fondo, su persistencia y exportación, y la disponibilidad offline de la imagen.

La prueba con Mori Calliope, Inugami Korone y Ouro Kronii está documentada en [docs/HOLODEX.md](docs/HOLODEX.md), con capturas actuales y resultados fechados.

La revisión de avatares, miniaturas y estados visuales está en validación. Sus pruebas y capturas deben actualizarse en [docs/HOLODEX.md](docs/HOLODEX.md) al completar la revisión; los resultados anteriores no sustituyen esa comprobación.

Las [capturas actuales](docs/HOLODEX.md#capturas-actuales) muestran avatares reales. En el entorno de pruebas las miniaturas de YouTube están bloqueadas, por lo que aparece la alternativa del avatar. La demostración del indicador rojo está marcada como simulación; los estados reales dependen de la última respuesta de Holodex.
