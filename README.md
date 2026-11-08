# Inicio

Una página de inicio personal, ligera y adaptable, con favoritos, RSS, seguimiento de directos y búsqueda con motores centrados en la privacidad.

## Uso local

Sirve esta carpeta mediante HTTP, por ejemplo `python3 -m http.server 8000`, y abre `http://localhost:8000`. Los módulos y el almacenamiento offline no funcionan correctamente al abrir el archivo directamente. Para usarla en otros dispositivos es necesario alojarla en una dirección HTTPS. Visítala una vez con conexión para guardar la aplicación en el navegador; después podrá abrirse sin conexión mientras el navegador conserve su caché. El modo privado y la limpieza de datos pueden eliminarla.

Los marcadores y ajustes se guardan en cada navegador. Utiliza Ajustes → Exportar datos e Importar datos para trasladarlos. Las búsquedas y enlaces necesitan conexión. La disponibilidad como página de inicio o nueva pestaña depende de cada navegador.

## Widgets

Los feeds RSS se consultan mediante un intermediario público, que recibe la URL del feed; no añadas feeds privados. Las actualizaciones requieren conexión y dependen de la disponibilidad de ese servicio. Los datos descargados se conservan localmente.

El seguimiento de directos utiliza Holodex y requiere una clave API propia y los identificadores de los canales de YouTube. El servicio y sus límites determinan los resultados. Los avisos se muestran dentro de la página mientras está abierta; no son notificaciones en segundo plano. La clave se guarda en el navegador y no se incluye en las copias de seguridad.

El enlace de divisas abre el conversor oficial de Mastercard; necesita conexión. No se calculan tipos de cambio sin acceso autorizado a la API oficial.

## Estado y siguientes pasos

Esta es una primera versión. Ya incluye favoritos sencillos (sin carpetas ni edición), buscador, widgets de RSS y directos, enlace al conversor de Mastercard y copia de seguridad manual. Los widgets todavía no se pueden reordenar ni ocultar y la personalización visual aún no está implementada. Consulta [docs/ROADMAP.md](docs/ROADMAP.md) para el plan y las limitaciones conocidas, y [AGENTS.md](AGENTS.md) para orientaciones destinadas a futuros colaboradores y modelos.

Se ha comprobado la carga en Chromium, la persistencia de un favorito y la reapertura sin conexión tras instalar la caché. Aún deben probarse Safari en macOS y Brave en iOS y Android, además de las integraciones RSS y Holodex con datos y credenciales reales.
