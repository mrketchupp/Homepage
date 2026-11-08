# Configuración con Liquid Glass

## Alcance

`settings.css` aplica el mismo lenguaje visual de la homepage a las ventanas de Ajustes, Añadir favorito, talentos/RSS y Tu fondo. Se carga después de `style.css` y `visual.css`, y está incluida en `ASSETS` de `sw.js`. La caché actual de la aplicación es `inicio-v6`; conserva el arranque con caché primero y la separación de respuestas de API.

La superficie combina dos gradientes translúcidos, un fondo oscuro para conservar legibilidad, `backdrop-filter: blur(34px) saturate(1.45)`, borde luminoso y reflejos/sombras internas. La apariencia puede variar según el soporte del navegador y el fondo visible detrás del panel.

Ajustes organiza las acciones existentes en:

- Fondo de pantalla: imagen, luz y encuadre.
- Tus talentos: Holodex y los canales seguidos.
- Tus lecturas: fuentes RSS y Atom.
- Exportar/importar una copia, con aviso de sustitución y exclusión de la clave Holodex.
- Nota de que los ajustes se guardan en el navegador actual.

Esta revisión modifica presentación y acceso a controles existentes. No implementa activación/desactivación de widgets ni sincronización automática.

## Controles y accesibilidad

- `settings-dialog` usa `aria-labelledby` y `aria-describedby`; `bookmark-dialog` tiene `aria-labelledby`. Los otros diálogos ya disponen de título asociado.
- El input de importación usa `sr-only` en lugar de `hidden`, de modo que sigue siendo un control de archivo nativo accesible por teclado. El foco en el input resalta su etiqueta contenedora mediante `:focus-within`.
- Los campos comparten superficie, borde y estados de foco. Los botones comparten relieve, hover y pulsación. El foco visible se dibuja con contorno claro.
- En móvil los campos de texto y selectores usan 16 px, para evitar el zoom automático habitual de Safari con texto menor. Los botones, los cierres, los resultados de búsqueda y los controles de gestión y paginación de talentos tienen un objetivo táctil mínimo de 44 px en móvil.
- El interruptor de fondo sigue siendo un checkbox nativo, con estado `checked`, etiqueta y foco. Su aspecto se dibuja con CSS; no depende solo de un elemento decorativo.
- Los deslizadores siguen siendo inputs `range` con etiquetas y valores de salida. Hay reglas para pistas y tiradores de Chromium/WebKit y Firefox.
- Los diálogos largos mantienen altura máxima y desplazamiento interno. La página principal conserva su requisito de una pantalla sin scroll. Al cerrar una ventana secundaria cuyo botón de apertura ya no es visible, el foco regresa al botón de Ajustes.

El panel Tu fondo mantiene un backdrop sin desenfoque y con sombra ligera para que los cambios se puedan observar detrás. No elimines esa excepción al unificar estilos de los diálogos.

## Preferencias y alternativas

Si el navegador no admite `backdrop-filter` ni su prefijo WebKit, la superficie usa un fondo opaco. Con `prefers-reduced-transparency: reduce` o `prefers-contrast: more`, el panel también se vuelve opaco y desactiva el desenfoque. Las preferencias solo se aplican donde el navegador las admite; no sustituyen una comprobación de contraste visual.

Con `prefers-reduced-motion: reduce`, se desactivan las animaciones de aparición del diálogo y del backdrop. El estilo base ya limita otras animaciones de la aplicación.

## Verificaciones realizadas

Pruebas en Chromium con la implementación actual:

- Ajustes abre y cabe en 1440×900, 390×844, 320×568 y 844×390; sin desbordamiento horizontal dentro del panel. Los paneles altos conservan desplazamiento interno.
- Escape cierra la ventana principal y devuelve el foco al botón de Ajustes. Cerrar un panel secundario también recupera un disparador visible cuando su ventana de origen ya está cerrada.
- Tab desde Exportar alcanza el input nativo de Importar. Se descargó una copia y se importó un archivo de prueba: se aplicaron los favoritos y se mostró la confirmación.
- Se navegaron los paneles de Fondo y RSS y se abrió Añadir favorito. Los deslizadores y el interruptor cambian el fondo, conservan sus controles nativos y guardan los ajustes.
- Movimiento reducido desactiva la animación de aparición. La preferencia de contraste alto elimina el desenfoque del panel y activa el acabado opaco.
- Tras instalar la caché, se desconectó el navegador, se recargó y se abrió Ajustes: `settings.css` y el efecto Glass siguieron disponibles offline.
- No se observaron errores JavaScript en la prueba integrada. La legibilidad se revisó visualmente en las capturas sobre la imagen compartida.
- El panel de talentos con tres perfiles públicos guardados se capturó a 1440×1000, sin desbordamiento horizontal. No se utilizó ni capturó una clave API para esa captura.

Quedan pendientes Safari/macOS y Brave/iOS/Android, la evaluación completa con lector de pantalla y la alternativa en un navegador que carezca de `backdrop-filter`. La prueba de contraste alto no equivale a una auditoría formal de todos los contrastes ni a probar cada preferencia de transparencia en todos los sistemas.

## Capturas actuales

- [Ajustes en escritorio](screenshots/settings-desktop.jpg).
- [Ajustes en móvil](screenshots/settings-mobile.jpg).
- [Control del fondo con vista previa](screenshots/settings-background.jpg).
- [Panel de talentos](screenshots/settings-talents.jpg).

El panel de talentos usa los perfiles públicos guardados de Mori Calliope, Inugami Korone y Ouro Kronii. Las capturas no incluyen claves ni anuncian nuevos directos en vivo.
