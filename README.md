# Inicio

Una página de inicio personal, rápida y adaptable: favoritos, buscadores centrados en privacidad, lecturas RSS, directos de Hololive y conversión de divisas de Mastercard.

## Ejecutar

Desde la raíz del repositorio:

```sh
python3 server.py
```

Abre `http://localhost:8000`. El servidor usa solo la biblioteca estándar de Python y sirve tanto la web como `/api/currency`, necesario para la conversión integrada. Opcionalmente admite `--port 8001` y `--bind 127.0.0.1`.

La interfaz también se puede servir como archivos estáticos con `python3 -m http.server 8000`, pero ese servidor no ofrece la conversión: el widget conserva el enlace al conversor oficial. GitHub Pages tampoco ejecuta `server.py`. Para otros dispositivos hace falta alojar la web en HTTPS; el servidor local no incorpora HTTPS por sí mismo.

No abras `index.html` mediante `file://`: los módulos y el service worker necesitan HTTP local o HTTPS.

## Arranque rápido y offline

La primera visita requiere conexión para instalar la aplicación. Después, el service worker entrega primero la interfaz y los archivos guardados, sin esperar a la red. Favoritos, ajustes y datos locales se muestran de inmediato; las consultas de internet comienzan después del primer pintado y actualizan los widgets en segundo plano.

Las nuevas versiones de la aplicación se precargan al instalar una nueva versión del service worker. Las respuestas de las API no forman parte de esa caché: cada módulo conserva y etiqueta sus propios datos guardados. Si el navegador elimina su caché o sus datos, habrá que descargar la aplicación otra vez.

La prueba con el origen retrasado cuatro segundos mostró la página instalada en unos 109 ms en el entorno de prueba; no es una garantía de tiempo para todos los dispositivos. Se comprobó también la reapertura offline. Los detalles están en [docs/OFFLINE-AND-CURRENCY.md](docs/OFFLINE-AND-CURRENCY.md).

## Una pantalla

La vista principal ocupa la pantalla disponible sin scroll. En escritorio muestra tres widgets en un panel compacto de hasta 280 px de alto. En móvil se cambia de widget mediante pestañas. Los favoritos muestran hasta seis por fila en escritorio y ocho en dos filas de cuatro en móvil con más de 520 px de alto; después se pagina. Las pantallas bajas conservan una fila. Las listas se paginan según el espacio disponible. La configuración abre modales que pueden tener scroll interno.

Los widgets siguen siendo fijos: todavía no se pueden añadir, desactivar ni reordenar. Las pestañas seleccionan la tarjeta visible sin desactivarla.

## Favoritos, búsqueda y datos

Puedes añadir y eliminar favoritos y elegir Startpage, Ecosia, DuckDuckGo o Brave para buscar en internet. Los marcadores, ajustes y datos se guardan en cada navegador. Ajustes → Exportar datos e Importar datos permite trasladar favoritos, configuración de widgets y del fondo; la clave Holodex queda excluida. La sincronización automática no está implementada.

Las opciones y cotizaciones de divisas y el catálogo derivado de Holodex aún no se incluyen en esas copias: cada navegador los conserva por separado. La posibilidad de usar la web como inicio, aplicación instalada o nueva pestaña depende del navegador y del sistema.

## Seguir talentos por nombre

Abre Ajustes → Conectar Holodex, guarda tu clave personal y escribe el nombre del talento. El buscador consulta un catálogo Hololive de Holodex y permite seleccionar el canal por su nombre y foto. El ID se guarda internamente: no hace falta conocerlo. La entrada manual por ID sigue disponible como opción avanzada.

El catálogo se guarda durante 24 horas para buscar sin nuevas peticiones por cada tecla y seguir buscando offline después de haberlo descargado. Reconoce nombres ingleses, japoneses y variantes sin acentos; las búsquedas como «calliope morí», «Korone» o «Kronii» se comprobaron con el directorio real. La consulta realizada el 8 de noviembre de 2026 a las 22:16 UTC devolvió 138 canales. Ese conteo puede cambiar.

La agenda consulta eventos en vivo y próximos siete días por canal, al abrir, manualmente, al recuperar conexión y cada dos minutos mientras la página está visible. Los datos guardados aparecen primero. Los avisos solo se muestran dentro de la página, sin notificaciones de fondo.

Los avatares proceden de Holodex y las miniaturas de imágenes públicas de YouTube. Un círculo rojo luminoso identifica una emisión activa; un reloj identifica las próximas. Los colores de Calliope, Korone y Kronii son decisiones visuales del proyecto. Sin conexión, con error o con datos antiguos, se muestra el estado guardado en gris. Hay etiquetas accesibles y soporte de movimiento reducido.

Pulsar un directo abre su vídeo en YouTube en una pestaña nueva. Pulsar un avatar de la tira abre el canal de YouTube. Si falla una miniatura se usa el avatar; si tampoco está disponible, iniciales o un icono. Las imágenes descargadas pueden funcionar offline mientras permanezcan en la caché limitada a 60 imágenes. Las pruebas y sus límites están en [docs/HOLODEX.md](docs/HOLODEX.md).

## RSS

En Gestionar feeds, pega la **URL del feed RSS o Atom**, añade el feed y listo. La portada de un sitio no equivale a su feed. Por ejemplo, NASA publica `https://www.nasa.gov/feed/`. El widget descarga titulares, fuente, fecha y enlace al artículo original; no guarda los artículos completos.

Se actualiza al abrir, al pulsar actualizar y al recuperar conexión. Los últimos titulares quedan guardados para consultarlos offline. Se intenta leer el feed directamente sin cookies. Si el sitio impide el acceso desde el navegador, se usa AllOrigins, un intermediario público que recibe la dirección; utiliza solo feeds públicos. Si el feed o el intermediario falla, se conservan los resultados anteriores. NASA se comprobó de extremo a extremo en Chromium: se añadieron diez publicaciones reales y se conservaron offline. El proxy respondió HTTP 200 en una prueba de servidor, pero agotó el tiempo en otra prueba de navegador; por eso se prioriza la lectura directa cuando el feed lo permite.

## Divisas dentro de la página

El widget permite indicar importe, elegir las divisas y calcular con una cotización de Mastercard. `server.py` consulta el servicio público usado por la web oficial; necesita el backend porque ese servicio no permite la consulta directa desde esta página mediante CORS y la web oficial no se puede incrustar como iframe.

El importe se calcula en el navegador. El servidor consulta siempre una unidad y comisión bancaria cero; no envía tu importe a Mastercard. El resultado es una estimación sin comisión bancaria y muestra la fecha real del tipo. No garantiza el cargo final de tu banco. Los tipos guardados permiten reutilizar una cotización offline; no se inventan tipos para pares sin datos.

El servidor guarda hasta 40 pares durante una hora y el navegador conserva hasta 40 pares, renovándolos tras 24 horas cuando haya conexión. Si el backend no está disponible, permanece el enlace al conversor oficial. El endpoint público puede cambiar. Consulta [docs/OFFLINE-AND-CURRENCY.md](docs/OFFLINE-AND-CURRENCY.md) para despliegue, cachés y alcance.

## Fondo

La imagen compartida está en `assets/background.jpg`. En Ajustes → Fondo de pantalla puedes alternar imagen/degradado, oscurecimiento, desenfoque y encuadre. Los ajustes se aplican y guardan al momento, y se incluyen en la copia JSON. La imagen sigue siendo un archivo fijo: todavía no se puede sustituir desde la interfaz.

## Estado y continuidad

Consulta [docs/ROADMAP.md](docs/ROADMAP.md) para lo implementado y pendiente, [AGENTS.md](AGENTS.md) para futuras sesiones y [docs/HOLODEX.md](docs/HOLODEX.md) para las capturas y verificaciones visuales. La prueba del indicador rojo está identificada como simulación; las capturas con datos reales tienen fecha. No contienen la clave.

Se verificaron la interfaz de conversión, la carga real de RSS, las búsquedas de talentos, las imágenes de los perfiles y el arranque con red lenta. Siguen pendientes las pruebas en Safari/macOS y Brave/iOS/Android.

[Capturas y resultados de la revisión de búsqueda, arranque rápido, RSS y conversión](docs/OFFLINE-AND-CURRENCY.md#resultados-integrados-de-esta-revisión).
