# Arranque offline, RSS y conversión integrada

## Entrega inmediata de la aplicación

El objetivo offline incluye abrir rápido aunque exista una conexión lenta. Después de la primera visita e instalación, `sw.js` entrega la interfaz desde `inicio-v6` antes de intentar la red. Precarga HTML, CSS, módulos, manifiesto, icono y fondo. El navegador puede instalar una nueva versión del worker y precargar una nueva caché; el arranque de una página ya instalada no espera esa descarga.

La caché principal usa **caché primero**, no red primero. Al cambiar los recursos que forman la aplicación, actualiza el nombre de caché y la lista `ASSETS`. No uses la caché de recursos para guardar API, solicitudes autenticadas o datos de usuario. `/api/` se excluye explícitamente; las peticiones autenticadas de Holodex tampoco pasan por el almacenamiento del worker.

`widgets.js` muestra los datos locales sincrónicamente y difiere las consultas RSS/Holodex mediante `requestAnimationFrame` y `setTimeout`, después del primer pintado. `currency.js` hace lo mismo para la cotización. Los datos se renuevan sin impedir la interacción. Al recuperar conexión se actualizan RSS y directos; el conversor busca un tipo cuando corresponde a su política de renovación.

La primera instalación requiere conexión y debe completarse antes de esperar disponibilidad offline. El borrado de datos o la expulsión de la caché por el navegador puede obligar a descargar de nuevo. La disponibilidad del inicio, instalación y nueva pestaña varía entre navegadores.

## Almacenamientos y actualización

| Datos | Dónde | Política |
| --- | --- | --- |
| Aplicación y fondo | Cache Storage `inicio-v6` | Caché primero; actualización con nueva versión del worker. |
| Avatares e imágenes públicas | Cache Storage `inicio-images-v1` | Hasta 60 imágenes, hosts permitidos, sin credenciales. |
| Favoritos y ajustes | `localStorage` | Persisten en cada navegador; copia JSON manual. |
| Agenda y lecturas | `homepage.widgets.v1` | Datos locales primero; actualización online y marca de fecha/estado. |
| Catálogo Hololive | `inicio.holodex-directory.v1` | Directorio público derivado, TTL de 24 horas; búsqueda local y offline. No forma parte del backup. |
| Cotizaciones | `inicio.currency.cache.v1` | Hasta 40 pares; se renuevan tras 24 horas si hay conexión. Los datos más antiguos pueden seguir utilizándose offline como guardados. |
| Preferencias del conversor | `inicio.currency.settings.v1` | Importe y par en este navegador, todavía fuera del backup. |
| Cotizaciones del servidor | Memoria de `server.py` | Hasta 40 pares durante una hora; se pierden al reiniciar. |

El color rojo de emisión en vivo se retira cuando no hay conexión, falla la actualización o los datos están desactualizados. Una foto guardada o un título no confirman que una emisión siga en vivo.

## Prueba de red lenta

En el entorno de pruebas se instaló la aplicación, se retrasó el origen cuatro segundos y se midió la aparición de la página: unos 109 ms desde la caché. También pasó la reapertura sin conexión. La prueba demuestra que el arranque instalado no espera ese retraso; no predice el tiempo exacto de todos los navegadores o dispositivos. Las consultas externas se realizan después y no bloquean la vista local.

## Conversión con Mastercard

La conversión está en la interfaz, sin redirigir para el cálculo normal. La cadena es:

1. El navegador solicita `/api/currency?from=USD&to=EUR` al mismo origen.
2. `server.py` consulta una unidad con comisión bancaria cero al servicio público que usa la web de Mastercard.
3. El servidor valida el par, el importe unitario, la comisión, el tipo y la fecha de la respuesta.
4. El navegador multiplica el tipo por el importe local y muestra la fecha del tipo.

El endpoint utilizado es `https://www.mastercard.com/marketingservices/public/mccom-services/currency-conversions/conversion-rates`. Es un servicio público de la web, no una garantía de API contractual estable: puede cambiar, limitar peticiones o no estar disponible. No se añaden claves ni se sustituyen sus tipos por los de otro proveedor.

La web oficial no permite este flujo desde un origen ajeno mediante CORS y no puede usarse como iframe por su política de origen. El servidor hace la consulta sin esa limitación del navegador. No envía el importe escrito por el usuario; siempre consulta `transaction_amount=1`, `bank_fee=0` y el último tipo disponible. La fecha mostrada es `fxDate` de la respuesta, no la fecha del ordenador ni una cotización inventada.

El resultado es una **estimación sin comisión bancaria**, no un compromiso de cargo final. El banco puede aplicar comisiones u otras condiciones. El widget admite las divisas ofrecidas por su selector y conserva el enlace al conversor oficial.

Si hay una cotización guardada, el importe puede recalcularse sin conexión. Se presenta como guardada si no hay red, está pendiente una renovación o falla la consulta. Si no hay tipo para el par seleccionado, no aparece un resultado numérico ficticio.

## Ejecutar y alojar el backend

```sh
python3 server.py
```

Sirve la aplicación y el endpoint en `http://127.0.0.1:8000`. No necesita paquetes de Python adicionales. `--port` y `--bind` permiten cambiar puerto e interfaz. Para servir a dispositivos remotos y usar service workers hace falta un alojamiento HTTPS apropiado; el servidor de desarrollo no configura TLS.

Los servidores estáticos, incluido `python3 -m http.server` o GitHub Pages, no ejecutan `/api/currency`. La interfaz puede seguir funcionando y aprovechar los datos previamente guardados, pero una nueva consulta mostrará que necesita el servicio de conversión y conservará el enlace oficial. Para alojar el conjunto hay que ejecutar el backend o implementar un endpoint equivalente en el mismo origen; esta revisión no configura un hosting de producción.

El endpoint solo acepta los códigos `from` y `to`; no es un proxy de URL arbitraria. El servidor bloquea solicitudes a metadatos Git y archivos ocultos. Las cotizaciones se devuelven con `Cache-Control: no-store`; no se mezclan con la caché de la aplicación. Las preferencias y cotizaciones del conversor aún no se exportan en las copias JSON.

## RSS: uso y límites

Añade una URL de RSS o Atom en «Gestionar feeds». Debe ser la dirección del feed, no una portada HTML. Por ejemplo, `https://www.nasa.gov/feed/` publica un feed. El widget extrae título, fuente, fecha y enlace original; no descarga el contenido completo para leer artículos offline.

Las consultas se hacen al abrir, al pulsar actualizar y al recuperar conexión, primero directamente, sin cookies, y con AllOrigins como alternativa cuando el sitio no permite el acceso desde el navegador. Ese intermediario recibe la dirección del feed; no introduzcas feeds privados, autenticados o con tokens secretos. Si un feed o AllOrigins falla, se conservan los artículos guardados que correspondan.

El feed NASA se verificó en la interfaz real: se añadieron diez publicaciones y se conservaron tras desconectar y recargar. La lectura directa respondió HTTP 200 y permite CORS. AllOrigins respondió HTTP 200 en una comprobación desde servidor, pero agotó el tiempo en otra desde navegador; la alternativa pública sigue dependiendo de su disponibilidad.


## Resultados integrados de esta revisión

Pruebas realizadas en Chromium el 8 de noviembre de 2026:

- Catálogo real de 138 canales; selección de Mori Calliope, Inugami Korone y Ouro Kronii por nombre, con ID interno, nombres y fotos. Se probó «calliope morí» con acento/orden invertido y «ころね» contra el catálogo guardado sin conexión.
- Con un retraso de cuatro segundos en el servidor de origen, la vista instalada y visible tardó 109 ms en la ejecución final. Se comprobó además la reapertura offline. Es una medida local, no un compromiso de rendimiento universal.
- Consulta real de Mastercard USD→EUR: 1 USD = 0,898472 EUR, con fecha del tipo 7 de noviembre de 2026. La interfaz mostró 100 USD = 89,85 EUR. Se utilizó la fecha devuelta, aunque fuera anterior al día de consulta.
- Cambiar el importe a 200 no lanzó otra petición ni envió ese importe en la URL. El cálculo offline con 50 y el tipo guardado mostró 44,92 EUR. Un par sin cotización no presenta un número ficticio.
- Feed real NASA: diez entradas, con títulos, fuente, fechas y enlaces. Se comprobó su conservación al desconectar y recargar.
- Sin errores JavaScript en las pruebas integradas. Matriz de vista sin scroll con widgets vacíos/poblados, títulos largos y paginación: 1440×900, 1280×720, 820×1180, 390×844, 375×667, 320×568 y 844×390.
- Pruebas aisladas del conversor: backend ausente/404, error conservando el tipo guardado, parámetros inválidos, caché de servidor y ausencia de importe en la consulta externa.

Las comprobaciones integradas no sustituyen pruebas en Safari y Brave reales. El directorio deriva de Holodex; las publicaciones de NASA y cotizaciones son instantáneas que cambian.

## Capturas de esta revisión

Contienen favoritos de ejemplo y datos obtenidos de fuentes reales. No contienen claves.

- [Escritorio con RSS y conversión integrada](screenshots/features-desktop.png).
- [Búsqueda de talentos por nombre](screenshots/search-talents.png).
- [Conversión en móvil](screenshots/currency-mobile.png).
- [RSS en móvil](screenshots/rss-mobile.png).
