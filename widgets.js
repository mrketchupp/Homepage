const KEY = 'homepage.widgets.v1';
const defaults = () => ({ feeds: [], articles: [], rssUpdated: null, channels: [], streams: [], liveUpdated: null, holodexKey: '' });
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const text = (value, limit = 500) => typeof value === 'string' ? value.slice(0, limit) : '';
const channelPattern = /^UC[A-Za-z0-9_-]{22}$/;
const safeUrl = value => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
function normalize(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults();
  const feeds = Array.isArray(value.feeds) ? value.feeds.filter(f => f && safeUrl(f.url)).slice(0, 100).map(f => ({ url: safeUrl(f.url) })) : [];
  const channels = Array.isArray(value.channels) ? [...new Set(value.channels.filter(c => typeof c === 'string' && channelPattern.test(c)))].slice(0, 100) : [];
  const articles = Array.isArray(value.articles) ? value.articles.filter(a => a && typeof a.title === 'string' && safeUrl(a.link)).slice(0, 100).map(a => ({ title: text(a.title), link: safeUrl(a.link), date: validDate(a.date) || '', source: text(a.source, 100), feed: safeUrl(a.feed) })) : [];
  const streams = Array.isArray(value.streams) ? value.streams.filter(s => s && typeof s.id === 'string' && /^[A-Za-z0-9_-]{11}$/.test(s.id) && ['live', 'upcoming'].includes(s.status)).slice(0, 500).map(s => ({ id: s.id, title: text(s.title), status: s.status, channel: text(s.channel, 100), channelId: channelPattern.test(s.channelId) ? s.channelId : '', start: validDate(s.start) || '' })) : [];
  return { feeds, articles, channels, streams, rssUpdated: validDate(value.rssUpdated), liveUpdated: validDate(value.liveUpdated), holodexKey: text(value.holodexKey, 300) };
}
function load() { try { return normalize(JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { return defaults(); } }
let data = load();
let host;
let settings;
let settingsType = 'rss';
let timer;
let pageSize = 2;
const pages = { rss: 0, live: 0 };
let message = '';
let rssStatus = '';
let liveStatus = '';
let busyRss = false;
let busyLive = false;
function persist() { localStorage.setItem(KEY, JSON.stringify(data)); }
export function exportWidgets() { const { holodexKey, ...backup } = data; return JSON.parse(JSON.stringify(backup)); }
export function importWidgets(value) { data = { ...normalize(value), holodexKey: data.holodexKey }; pages.rss = pages.live = 0; persist(); render(); }
export function setWidgetPageSize(n) { const size = Math.max(1, Math.min(3, Math.floor(Number(n)) || 1)); if (size !== pageSize) { pageSize = size; pages.rss = pages.live = 0; render(); } }
const formatDate = date => { const d = new Date(date); return Number.isNaN(d.valueOf()) ? 'Sin hora anunciada' : new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d); };
const updated = date => date ? `Actualizado ${formatDate(date)}` : 'Todavía sin actualizar';
function pagination(type, total) {
  const count = Math.max(1, Math.ceil(total / pageSize));
  pages[type] = Math.min(pages[type], count - 1);
  return `<div class="widget-pager" aria-label="Páginas de ${type === 'rss' ? 'lecturas' : 'directos'}"><button data-action="page-${type}" data-delta="-1" ${pages[type] === 0 ? 'disabled' : ''} aria-label="Página anterior">‹</button><span>${pages[type] + 1} / ${count}</span><button data-action="page-${type}" data-delta="1" ${pages[type] === count - 1 ? 'disabled' : ''} aria-label="Página siguiente">›</button></div>`;
}
function render() {
  if (!host) return;
  const rssPager = pagination('rss', data.articles.length);
  const livePager = pagination('live', data.streams.length);
  const articles = data.articles.slice(pages.rss * pageSize, (pages.rss + 1) * pageSize);
  const streams = data.streams.slice(pages.live * pageSize, (pages.live + 1) * pageSize);
  host.innerHTML = `
    <section class="widget widget-rss" id="rss-panel" data-widget="rss" aria-labelledby="rss-title">
      <div class="widget-header"><div><span class="widget-kicker">TU LECTURA</span><h2 id="rss-title">En tu radar</h2></div><button class="widget-refresh ${busyRss ? 'is-loading' : ''}" data-action="refresh-rss" ${busyRss || !data.feeds.length ? 'disabled' : ''} aria-label="Actualizar RSS">↻</button></div>
      <div class="widget-body" aria-busy="${busyRss}"><p class="widget-meta" role="status">${esc(rssStatus || updated(data.rssUpdated))}</p>
        ${articles.length ? `<ul class="widget-list">${articles.map(a => `<li><a href="${esc(a.link)}" target="_blank" rel="noopener noreferrer"><span class="widget-item-title" title="${esc(a.title)}">${esc(a.title)}</span><small>${esc(a.source)}${a.date ? ' · ' + esc(formatDate(a.date)) : ''}</small></a></li>`).join('')}</ul>` : `<div class="widget-empty"><span class="empty-icon" aria-hidden="true">◉</span><p>${data.feeds.length ? 'No hay lecturas guardadas. Actualiza para consultar tus feeds.' : 'Tus lecturas favoritas, en un solo lugar.'}</p><button data-action="settings-rss">${data.feeds.length ? 'Gestionar feeds' : 'Añadir un feed'}</button></div>`}
      </div>
      <div class="widget-footer"><button class="widget-configure" data-action="settings-rss">Gestionar feeds <span>${data.feeds.length}</span></button>${rssPager}</div>
    </section>
    <section class="widget widget-live" id="live-panel" data-widget="live" aria-labelledby="live-title">
      <div class="widget-header"><div><span class="widget-kicker">TUS TALENTOS</span><h2 id="live-title">En directo</h2></div><button class="widget-refresh ${busyLive ? 'is-loading' : ''}" data-action="refresh-live" ${busyLive || !data.channels.length || !data.holodexKey ? 'disabled' : ''} aria-label="Actualizar directos">↻</button></div>
      <div class="widget-body" aria-busy="${busyLive}"><p class="widget-meta" role="status">${esc(liveStatus || updated(data.liveUpdated))}</p>${message ? `<p class="widget-notice" role="status">${esc(message)}</p>` : ''}
        ${streams.length ? `<ul class="widget-list">${streams.map(s => `<li><a href="https://www.youtube.com/watch?v=${encodeURIComponent(s.id)}" target="_blank" rel="noopener noreferrer"><span class="widget-item-title" title="${esc(s.title)}">${s.status === 'live' ? '<b class="live-badge">EN VIVO</b> ' : ''}${esc(s.title)}</span><small>${esc(s.channel)} · ${s.status === 'live' ? 'Ahora' : esc(formatDate(s.start))}</small></a></li>`).join('')}</ul>` : `<div class="widget-empty"><span class="empty-icon" aria-hidden="true">▷</span><p>${data.channels.length && data.holodexKey ? 'No hay directos anunciados para tus canales.' : 'Tus próximos directos de YouTube, aquí.'}</p><button data-action="settings-live">${data.channels.length && data.holodexKey ? 'Gestionar talentos' : 'Configurar talentos'}</button></div>`}
      </div>
      <div class="widget-footer"><button class="widget-configure" data-action="settings-live">Tus talentos <span>${data.channels.length}</span></button>${livePager}</div>
    </section>`;
}
function renderSettings() {
  const rss = settingsType === 'rss';
  settings.innerHTML = `<div class="dialog-head"><div><span class="section-kicker">${rss ? 'TU LECTURA' : 'TUS TALENTOS'}</span><h2 id="widget-settings-title">${rss ? 'Gestionar feeds' : 'Configurar talentos'}</h2></div><button type="button" class="icon-button" data-action="close-settings" aria-label="Cerrar">×</button></div>
    ${rss ? `<form data-form="feed"><label class="field">URL del feed RSS o Atom<input name="url" type="url" placeholder="https://ejemplo.com/feed.xml" required></label><button class="primary-button" type="submit">Añadir feed</button></form>${data.feeds.map((f, i) => `<div class="widget-manage"><span>${esc(f.url)}</span><button data-action="remove-feed" data-index="${i}" aria-label="Eliminar feed">×</button></div>`).join('')}<p class="widget-help">AllOrigins recibe la dirección de cada feed para actualizarlo. Usa feeds públicos. Las últimas lecturas quedan guardadas en este navegador.</p>` : `<form data-form="key"><label class="field">Clave API de Holodex<input name="key" type="password" value="${esc(data.holodexKey)}" autocomplete="off" placeholder="Tu clave API"></label><button class="primary-button" type="submit">Guardar clave</button></form><p class="widget-help">${data.holodexKey ? 'Clave guardada en este navegador.' : 'Añade tu clave para consultar los directos.'} Se envía únicamente a Holodex y no se incluye en la copia de seguridad. <a href="https://holodex.net/" target="_blank" rel="noopener noreferrer">Ir a Holodex</a>.</p><form data-form="channel"><label class="field">ID del canal de YouTube<input name="id" placeholder="UC…" pattern="UC[A-Za-z0-9_-]{22}" required></label><button class="primary-button" type="submit">Seguir canal</button></form>${data.channels.map((c, i) => `<div class="widget-manage"><span>${esc(c)}</span><button data-action="remove-channel" data-index="${i}" aria-label="Dejar de seguir canal">×</button></div>`).join('')}<p class="widget-help">Con la página visible se actualizan los directos cada dos minutos y se muestra un aviso al detectar uno nuevo en vivo.</p>`}`;
}
export function openWidgetSettings(type) { if (!settings) return; settingsType = type === 'live' ? 'live' : 'rss'; renderSettings(); settings.showModal(); }
async function request(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try { return await fetch(url, { ...options, signal: controller.signal }); } finally { clearTimeout(timeout); }
}
async function refreshRss() {
  if (busyRss || !data.feeds.length) return;
  busyRss = true; rssStatus = 'Actualizando lecturas…'; render();
  const feeds = data.feeds.map(f => ({ ...f }));
  const results = await Promise.allSettled(feeds.map(async f => {
    const response = await request('https://api.allorigins.win/raw?url=' + encodeURIComponent(f.url));
    if (!response.ok) throw new Error('feed');
    const xml = new DOMParser().parseFromString(await response.text(), 'text/xml');
    if (xml.querySelector('parsererror')) throw new Error('xml');
    const title = xml.querySelector('channel > title, feed > title')?.textContent || new URL(f.url).hostname;
    return [...xml.querySelectorAll('item, entry')].slice(0, 20).map(item => ({ title: item.querySelector('title')?.textContent || 'Sin título', link: safeUrl((item.querySelector('link[rel="alternate"], link')?.getAttribute('href') || item.querySelector('link')?.textContent || '').trim()), date: item.querySelector('pubDate, published, updated')?.textContent || '', source: title, feed: f.url })).filter(item => item.link);
  }));
  const good = results.filter(r => r.status === 'fulfilled');
  if (good.length) {
    const failed = new Set(feeds.filter((_, i) => results[i].status === 'rejected').map(f => f.url));
    const current = new Set(data.feeds.map(f => f.url));
    data.articles = [...good.flatMap(r => r.value), ...data.articles.filter(a => failed.has(a.feed))].filter(a => current.has(a.feed)).sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)).slice(0, 100);
    data.rssUpdated = new Date().toISOString(); persist();
  }
  rssStatus = good.length === results.length ? '' : `${results.length - good.length} feed(s) sin actualizar. Datos guardados.`;
  busyRss = false; render();
}
async function channelStreams(id) {
  const streams = [];
  for (let offset = 0; ; offset += 100) {
    const query = new URLSearchParams({ channel_id: id, status: 'live,upcoming', type: 'stream', max_upcoming_hours: '168', limit: '100', offset: String(offset) });
    const response = await request('https://holodex.net/api/v2/live?' + query, { headers: { 'X-APIKEY': data.holodexKey } });
    if (!response.ok) throw new Error(response.status === 401 || response.status === 403 ? 'Comprueba tu clave de Holodex.' : 'No se pudo conectar con Holodex.');
    const result = await response.json();
    if (!Array.isArray(result)) throw new Error('Respuesta inesperada de Holodex.');
    streams.push(...result.filter(s => s.channel?.id === id && ['live', 'upcoming'].includes(s.status) && s.type !== 'clip').map(s => ({ id: s.id, title: text(s.title), status: s.status, channel: text(s.channel?.name, 100), channelId: id, start: s.start_actual || s.start_scheduled || s.available_at || '' })));
    if (result.length < 100) break;
  }
  return streams;
}
async function refreshLive() {
  if (busyLive || !data.channels.length || !data.holodexKey) return;
  busyLive = true; liveStatus = 'Buscando directos…'; render();
  const channels = [...data.channels];
  const results = await Promise.allSettled(channels.map(channelStreams));
  const good = results.filter(r => r.status === 'fulfilled');
  if (good.length) {
    const failed = new Set(channels.filter((_, i) => results[i].status === 'rejected'));
    const current = new Set(data.channels);
    const streams = [...new Map([...good.flatMap(r => r.value), ...data.streams.filter(s => failed.has(s.channelId))].filter(s => current.has(s.channelId)).map(s => [s.id, s])).values()].sort((a, b) => (a.status === 'live' ? -1 : 0) - (b.status === 'live' ? -1 : 0) || (Date.parse(a.start) || 0) - (Date.parse(b.start) || 0));
    if (data.liveUpdated) {
      const wasLive = new Set(data.streams.filter(s => s.status === 'live').map(s => s.id));
      const started = streams.filter(s => s.status === 'live' && !wasLive.has(s.id));
      if (started.length) { message = `${started.map(s => s.channel).join(', ')} ${started.length === 1 ? 'está' : 'están'} en directo`; setTimeout(() => { message = ''; render(); }, 15000); }
    }
    data.streams = streams; data.liveUpdated = new Date().toISOString(); persist();
  }
  liveStatus = good.length === results.length ? '' : (results.find(r => r.status === 'rejected')?.reason?.message || 'No se pudo actualizar.') + ' Mostrando datos guardados.';
  busyLive = false; render();
}
function action(event) {
  const button = event.target.closest('[data-action]'); if (!button) return;
  const name = button.dataset.action;
  const index = Number(button.dataset.index);
  if (name === 'refresh-rss') refreshRss();
  if (name === 'refresh-live') refreshLive();
  if (name === 'settings-rss') openWidgetSettings('rss');
  if (name === 'settings-live') openWidgetSettings('live');
  if (name === 'close-settings') settings.close();
  if (name === 'page-rss' || name === 'page-live') { const type = name.slice(5); pages[type] += Number(button.dataset.delta); render(); }
  if (name === 'remove-feed') { const [removed] = data.feeds.splice(index, 1); data.articles = data.articles.filter(a => a.feed !== removed?.url); persist(); render(); renderSettings(); }
  if (name === 'remove-channel') { const [removed] = data.channels.splice(index, 1); data.streams = data.streams.filter(s => s.channelId && s.channelId !== removed); persist(); render(); renderSettings(); refreshLive(); }
}
export function initWidgets(root) {
  host = root;
  settings = document.createElement('dialog'); settings.id = 'widget-settings-dialog'; settings.setAttribute('aria-labelledby', 'widget-settings-title'); document.body.append(settings);
  host.addEventListener('click', action); settings.addEventListener('click', action);
  settings.addEventListener('submit', event => {
    const form = event.target; if (!form.dataset.form) return; event.preventDefault();
    const fields = new FormData(form);
    if (form.dataset.form === 'feed') { const url = safeUrl(fields.get('url')); if (url && !data.feeds.some(f => f.url === url)) data.feeds.push({ url }); persist(); render(); renderSettings(); refreshRss(); }
    if (form.dataset.form === 'key') { data.holodexKey = String(fields.get('key')).trim(); persist(); render(); renderSettings(); refreshLive(); }
    if (form.dataset.form === 'channel') { const id = String(fields.get('id')).trim(); if (channelPattern.test(id) && !data.channels.includes(id)) data.channels.push(id); persist(); render(); renderSettings(); refreshLive(); }
  });
  render(); clearInterval(timer); timer = setInterval(() => { if (!document.hidden && navigator.onLine) refreshLive(); }, 120000);
  if (navigator.onLine) { refreshRss(); refreshLive(); }
}
