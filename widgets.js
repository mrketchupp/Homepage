const KEY = 'homepage.widgets.v1';
const defaults = () => ({ feeds: [], articles: [], rssUpdated: null, channels: [], channelInfo: {}, streams: [], liveUpdated: null, holodexKey: '' });
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const text = (value, limit = 500) => typeof value === 'string' ? value.slice(0, limit) : '';
const channelPattern = /^UC[A-Za-z0-9_-]{22}$/;
const videoPattern = /^[A-Za-z0-9_-]{11}$/;
const safeUrl = value => { try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
const safeImage = value => { try { const url = new URL(value); return url.protocol === 'https:' && ['yt3.ggpht.com', 'yt3.googleusercontent.com', 'i.ytimg.com'].includes(url.hostname) ? url.href : ''; } catch { return ''; } };
const validDate = value => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
const known = {
  UCL_qhgtOy0dy1Agp8vkySQg: { name: 'Mori Calliope', color: '#f19cc0' },
  UChAnqc_AY5_I3Px5dig3X1Q: { name: 'Inugami Korone', color: '#f7bc69' },
  UCmbs8T6MWqUHP1tIQvSgKrg: { name: 'Ouro Kronii', color: '#8cafff' }
};
const palette = ['#b9a4f5', '#8acdb9', '#e8ae91', '#9fbde9', '#d9a3d7'];
function talentColor(id = '') {
  if (known[id]) return known[id].color;
  return palette[[...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length];
}
function normalizeProfile(profile, id) {
  return { id, name: text(profile?.name || known[id]?.name, 100), photo: safeImage(profile?.photo), updated: validDate(profile?.updated) };
}
function normalize(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults();
  const feeds = Array.isArray(value.feeds) ? value.feeds.filter(f => f && safeUrl(f.url)).slice(0, 100).map(f => ({ url: safeUrl(f.url) })) : [];
  const channels = Array.isArray(value.channels) ? [...new Set(value.channels.filter(c => typeof c === 'string' && channelPattern.test(c)))].slice(0, 100) : [];
  const channelInfo = {};
  if (value.channelInfo && typeof value.channelInfo === 'object') for (const id of channels) if (value.channelInfo[id]) channelInfo[id] = normalizeProfile(value.channelInfo[id], id);
  const articles = Array.isArray(value.articles) ? value.articles.filter(a => a && typeof a.title === 'string' && safeUrl(a.link)).slice(0, 100).map(a => ({ title: text(a.title), link: safeUrl(a.link), date: validDate(a.date) || '', source: text(a.source, 100), feed: safeUrl(a.feed) })) : [];
  const streams = Array.isArray(value.streams) ? value.streams.filter(s => s && typeof s.id === 'string' && videoPattern.test(s.id) && ['live', 'upcoming'].includes(s.status)).slice(0, 500).map(s => ({ id: s.id, title: text(s.title), status: s.status, channel: text(s.channel, 100), channelId: channelPattern.test(s.channelId) ? s.channelId : '', start: validDate(s.start) || '' })) : [];
  return { feeds, articles, channels, channelInfo, streams, rssUpdated: validDate(value.rssUpdated), liveUpdated: validDate(value.liveUpdated), holodexKey: text(value.holodexKey, 300) };
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
const profileRequests = new Set();
const failedThumbnails = new Set();
function persist() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* Keep this session usable if storage is full. */ } }
export function exportWidgets() { const { holodexKey, ...backup } = data; return JSON.parse(JSON.stringify(backup)); }
export function importWidgets(value) { data = { ...normalize(value), holodexKey: data.holodexKey }; pages.rss = pages.live = 0; persist(); render(); }
export function setWidgetPageSize(n) { const size = Math.max(1, Math.min(3, Math.floor(Number(n)) || 1)); if (size !== pageSize) { pageSize = size; pages.rss = pages.live = 0; render(); } }
const formatDate = date => { const d = new Date(date); return Number.isNaN(d.valueOf()) ? 'Sin hora anunciada' : new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(d); };
const updated = date => date ? `Actualizado ${formatDate(date)}` : 'Todavía sin actualizar';
const svg = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${{
  rss: '<circle cx="5" cy="19" r="1"/><path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/>',
  play: '<path d="m9 5 10 7-10 7z"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  offline: '<path d="m3 3 18 18M5 9a12 12 0 0 1 2-1M9 6a13 13 0 0 1 12 3M8 13a7 7 0 0 1 4-1M14 13l2 1M11 17l1 1 1-1"/>',
  warning: '<path d="m12 3 10 18H2zM12 9v4M12 17h.01"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1"/>'
}[name] || ''}</svg>`;
function staleLive() { return !navigator.onLine || Boolean(liveStatus) || !data.liveUpdated || Date.now() - Date.parse(data.liveUpdated) > 300000; }
function channelName(id) { return data.channelInfo[id]?.name || known[id]?.name || data.streams.find(s => s.channelId === id)?.channel || 'Canal de YouTube'; }
function initials(name) { return name.split(/\s+/).slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase() || 'YT'; }
function stateForChannel(id) {
  if (staleLive()) return 'stale';
  if (data.streams.some(stream => stream.channelId === id && stream.status === 'live')) return 'live';
  if (data.streams.some(stream => stream.channelId === id && stream.status === 'upcoming')) return 'upcoming';
  return 'idle';
}
function stateLabel(state) { return { live: 'En vivo', upcoming: 'Próximo directo', idle: 'Sin próximos directos anunciados', stale: 'Datos guardados, estado sin verificar' }[state]; }
function avatar(id, signal = true) {
  const name = channelName(id);
  const photo = safeImage(data.channelInfo[id]?.photo);
  const state = stateForChannel(id);
  return `<span class="talent-avatar ${photo ? '' : 'is-missing'}" style="--talent-color:${talentColor(id)}">${photo ? `<img src="${esc(photo)}" alt="" width="36" height="36" loading="lazy" referrerpolicy="no-referrer">` : ''}<span class="avatar-fallback" aria-hidden="true">${esc(initials(name))}</span>${signal ? `<span class="talent-signal signal-${state}" aria-hidden="true">${state === 'upcoming' ? svg('clock') : state === 'stale' ? svg('offline') : ''}</span>` : ''}</span>`;
}
function roster() {
  if (!data.channels.length) return '';
  return `<div class="talent-roster" aria-label="Talentos seguidos">${data.channels.slice(0, 5).map(id => `<a class="talent-roster-link" href="https://www.youtube.com/channel/${id}" target="_blank" rel="noopener noreferrer" title="${esc(channelName(id))} · ${esc(stateLabel(stateForChannel(id)))}" aria-label="${esc(channelName(id))}: ${esc(stateLabel(stateForChannel(id)))}">${avatar(id)}<span class="talent-name">${esc(channelName(id))}</span></a>`).join('')}${data.channels.length > 5 ? `<button class="talent-more" data-action="settings-live" aria-label="Gestionar los ${data.channels.length} talentos">+${data.channels.length - 5}</button>` : ''}</div>`;
}
function cardState(busy, status, count) { return !navigator.onLine ? 'offline' : busy ? 'loading' : status ? 'warning' : count ? 'ready' : 'empty'; }
function stateIcon(state) { return svg({ offline: 'offline', loading: 'refresh', warning: 'warning', ready: 'check', empty: 'clock' }[state], 'widget-state-icon'); }
function pagination(type, total) {
  const count = Math.max(1, Math.ceil(total / pageSize));
  pages[type] = Math.max(0, Math.min(pages[type], count - 1));
  return `<div class="widget-pager" aria-label="Páginas de ${type === 'rss' ? 'lecturas' : 'directos'}"><button data-action="page-${type}" data-delta="-1" ${pages[type] === 0 ? 'disabled' : ''} aria-label="Página anterior">‹</button><span>${pages[type] + 1} / ${count}</span><button data-action="page-${type}" data-delta="1" ${pages[type] === count - 1 ? 'disabled' : ''} aria-label="Página siguiente">›</button></div>`;
}
function streamMarkup(stream) {
  const stale = staleLive();
  const state = stale ? 'stale' : stream.status;
  const label = stale ? `Datos guardados · ${stream.status === 'live' ? 'último estado: en vivo' : formatDate(stream.start)}` : stream.status === 'live' ? 'En vivo ahora' : formatDate(stream.start);
  const name = data.channelInfo[stream.channelId]?.name || stream.channel;
  const fallbackPhoto = safeImage(data.channelInfo[stream.channelId]?.photo);
  const useAvatar = failedThumbnails.has(stream.id) && Boolean(fallbackPhoto);
  const imageUrl = useAvatar ? fallbackPhoto : `https://i.ytimg.com/vi/${encodeURIComponent(stream.id)}/mqdefault.jpg`;
  return `<li class="stream-item" data-stream-state="${state}" style="--talent-color:${talentColor(stream.channelId)}"><a class="stream-link" href="https://www.youtube.com/watch?v=${encodeURIComponent(stream.id)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(name)}: ${esc(stream.title)}. ${esc(label)}. Abrir en YouTube"><span class="stream-thumb ${useAvatar ? 'thumb-is-avatar' : ''}"><img data-channel-id="${esc(stream.channelId)}" data-video-id="${esc(stream.id)}" ${useAvatar ? 'data-avatar-fallback="true"' : ''} src="${esc(imageUrl)}" alt="" width="120" height="68" loading="lazy" referrerpolicy="no-referrer"><span class="thumb-fallback" aria-hidden="true">${svg('play')}</span><span class="thumbnail-play" aria-hidden="true">${svg('play')}</span></span><span class="stream-copy"><span class="stream-channel">${esc(name)}</span><span class="widget-item-title stream-title" title="${esc(stream.title)}">${esc(stream.title)}</span><span class="stream-status"><span class="stream-signal signal-${state}" role="img" aria-label="${esc(label)}" title="${esc(label)}">${state === 'upcoming' ? svg('clock') : state === 'stale' ? svg('offline') : ''}</span><span class="stream-time">${esc(stale ? 'Guardado' : stream.status === 'live' ? 'Ahora' : formatDate(stream.start))}</span></span></span></a></li>`;
}
function render() {
  if (!host) return;
  const focused = host.contains(document.activeElement) ? { action: document.activeElement.dataset.action, delta: document.activeElement.dataset.delta } : null;
  const rssPager = pagination('rss', data.articles.length);
  const livePager = pagination('live', data.streams.length);
  const articles = data.articles.slice(pages.rss * pageSize, (pages.rss + 1) * pageSize);
  const streams = data.streams.slice(pages.live * pageSize, (pages.live + 1) * pageSize);
  const rssState = cardState(busyRss, rssStatus, data.articles.length);
  const liveState = cardState(busyLive, liveStatus, data.streams.length);
  host.innerHTML = `
    <section class="widget widget-rss" id="rss-panel" data-widget="rss" data-state="${rssState}" aria-labelledby="rss-title">
      <div class="widget-header"><div class="widget-heading">${svg('rss', 'widget-symbol')}<div><span class="widget-kicker">TU LECTURA</span><h2 id="rss-title">En tu radar</h2></div></div><button class="widget-refresh ${busyRss ? 'is-loading' : ''}" data-action="refresh-rss" ${busyRss || !data.feeds.length ? 'disabled' : ''} aria-label="Actualizar RSS">${svg('refresh')}</button></div>
      <div class="widget-body" aria-busy="${busyRss}"><p class="widget-meta" role="status">${stateIcon(rssState)}<span>${esc(!navigator.onLine ? 'Sin conexión · lecturas guardadas' : rssStatus || updated(data.rssUpdated))}</span></p>
        ${articles.length ? `<ul class="widget-list">${articles.map(a => `<li><a class="feed-link" href="${esc(a.link)}" target="_blank" rel="noopener noreferrer"><span class="feed-symbol" aria-hidden="true">${svg('rss')}</span><span class="feed-copy"><span class="widget-item-title" title="${esc(a.title)}">${esc(a.title)}</span><small>${esc(a.source)}${a.date ? ' · ' + esc(formatDate(a.date)) : ''}</small></span></a></li>`).join('')}</ul>` : `<div class="widget-empty"><span class="empty-icon" aria-hidden="true">${svg('rss')}</span><p>${data.feeds.length ? 'No hay lecturas guardadas. Actualiza para consultar tus feeds.' : 'Tus lecturas favoritas, en un solo lugar.'}</p><button data-action="settings-rss">${data.feeds.length ? 'Gestionar feeds' : 'Añadir un feed'}</button></div>`}
      </div>
      <div class="widget-footer"><button class="widget-configure" data-action="settings-rss">Gestionar feeds <span>${data.feeds.length}</span></button>${rssPager}</div>
    </section>
    <section class="widget widget-live" id="live-panel" data-widget="live" data-state="${liveState}" aria-labelledby="live-title">
      <div class="widget-header"><div class="widget-heading">${svg('play', 'widget-symbol')}<div><span class="widget-kicker">TUS TALENTOS</span><h2 id="live-title">En directo</h2></div></div><button class="widget-refresh ${busyLive ? 'is-loading' : ''}" data-action="refresh-live" ${busyLive || !data.channels.length || !data.holodexKey ? 'disabled' : ''} aria-label="Actualizar directos">${svg('refresh')}</button></div>
      ${roster()}
      <div class="widget-body" aria-busy="${busyLive}"><p class="widget-meta" role="status">${stateIcon(liveState)}<span>${esc(!navigator.onLine ? 'Sin conexión · agenda guardada' : liveStatus || updated(data.liveUpdated))}</span></p>${message ? `<p class="widget-notice" role="status">${esc(message)}</p>` : ''}
        ${streams.length ? `<ul class="widget-list stream-list">${streams.map(streamMarkup).join('')}</ul>` : `<div class="widget-empty"><span class="empty-icon" aria-hidden="true">${svg('play')}</span><p>${data.channels.length && data.holodexKey ? 'No hay directos anunciados para tus canales.' : 'Tus próximos directos de YouTube, aquí.'}</p><button data-action="settings-live">${data.channels.length && data.holodexKey ? 'Gestionar talentos' : 'Configurar talentos'}</button></div>`}
      </div>
      <div class="widget-footer"><button class="widget-configure" data-action="settings-live">Tus talentos <span>${data.channels.length}</span></button>${livePager}</div>
    </section>`;
  if (focused?.action) {
    const candidates = [...host.querySelectorAll('[data-action]')];
    const next = candidates.find(button => button.dataset.action === focused.action && button.dataset.delta === focused.delta && !button.disabled) || candidates.find(button => button.dataset.action === focused.action && !button.disabled);
    next?.focus({ preventScroll: true });
  }
  host.dispatchEvent(new CustomEvent('widgets-rendered', { bubbles: true }));
}
function renderSettings() {
  const rss = settingsType === 'rss';
  settings.innerHTML = `<div class="dialog-head"><div><span class="section-kicker">${rss ? 'TU LECTURA' : 'TUS TALENTOS'}</span><h2 id="widget-settings-title">${rss ? 'Gestionar feeds' : 'Configurar talentos'}</h2></div><button type="button" class="icon-button" data-action="close-settings" aria-label="Cerrar">×</button></div>
    ${rss ? `<form data-form="feed"><label class="field">URL del feed RSS o Atom<input name="url" type="url" placeholder="https://ejemplo.com/feed.xml" required></label><button class="primary-button" type="submit">Añadir feed</button></form>${data.feeds.map((f, i) => `<div class="widget-manage"><span>${esc(f.url)}</span><button data-action="remove-feed" data-index="${i}" aria-label="Eliminar feed">×</button></div>`).join('')}<p class="widget-help">AllOrigins recibe la dirección de cada feed para actualizarlo. Usa feeds públicos. Las últimas lecturas quedan guardadas en este navegador.</p>` : `<form data-form="key"><label class="field">Clave API de Holodex<input name="key" type="password" value="${esc(data.holodexKey)}" autocomplete="off" placeholder="Tu clave API"></label><button class="primary-button" type="submit">Guardar clave</button></form><p class="widget-help">${data.holodexKey ? 'Clave guardada en este navegador.' : 'Añade tu clave para consultar los directos.'} Se envía únicamente a Holodex y no se incluye en la copia de seguridad. <a href="https://holodex.net/" target="_blank" rel="noopener noreferrer">Ir a Holodex</a>.</p><form data-form="channel"><label class="field">ID del canal de YouTube<input name="id" placeholder="UC…" pattern="UC[A-Za-z0-9_-]{22}" required></label><button class="primary-button" type="submit">Seguir canal</button></form>${data.channels.map((id, i) => `<div class="widget-manage talent-manage" style="--talent-color:${talentColor(id)}">${avatar(id, false)}<a href="https://www.youtube.com/channel/${id}" target="_blank" rel="noopener noreferrer"><span class="talent-manage-name">${esc(channelName(id))}</span><small>${esc(id)}</small></a><button data-action="remove-channel" data-index="${i}" aria-label="Dejar de seguir a ${esc(channelName(id))}">×</button></div>`).join('')}<p class="widget-help">Con la página visible se actualizan los directos cada dos minutos. Los avatares se consultan en Holodex y las miniaturas en YouTube; si no cargan, se muestran iniciales o un icono. Los datos offline se marcan como guardados.</p>`}`;
}
export function openWidgetSettings(type) { if (!settings) return; settingsType = type === 'live' ? 'live' : 'rss'; renderSettings(); settings.showModal(); }
async function request(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try { return await fetch(url, { ...options, signal: controller.signal }); } finally { clearTimeout(timeout); }
}
function refreshProfiles() {
  if (!navigator.onLine || !data.holodexKey) return;
  for (const id of data.channels) {
    const profile = data.channelInfo[id];
    if (profileRequests.has(id) || (profile?.updated && Date.now() - Date.parse(profile.updated) < 86400000)) continue;
    profileRequests.add(id);
    request('https://holodex.net/api/v2/channels/' + id, { headers: { 'X-APIKEY': data.holodexKey } })
      .then(async response => { if (!response.ok) throw new Error('profile'); const result = await response.json(); if (result.id !== id || !data.channels.includes(id)) return; data.channelInfo[id] = normalizeProfile({ name: result.english_name || result.name, photo: result.photo, updated: new Date().toISOString() }, id); persist(); render(); if (settings?.open && settingsType === 'live' && !settings.contains(document.activeElement)) renderSettings(); })
      .catch(() => { /* Missing profiles fall back to channel initials without blocking the agenda. */ })
      .finally(() => profileRequests.delete(id));
  }
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
    streams.push(...result.filter(s => s.channel?.id === id && videoPattern.test(s.id) && ['live', 'upcoming'].includes(s.status) && s.type !== 'clip').map(s => ({ id: s.id, title: text(s.title), status: s.status, channel: text(s.channel?.name, 100), channelId: id, start: s.start_actual || s.start_scheduled || s.available_at || '' })));
    if (result.length < 100) break;
  }
  return streams;
}
async function refreshLive() {
  refreshProfiles();
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
  if (name === 'remove-channel') { const [removed] = data.channels.splice(index, 1); delete data.channelInfo[removed]; data.streams = data.streams.filter(s => s.channelId && s.channelId !== removed); persist(); render(); renderSettings(); refreshLive(); }
}
function imageFailed(event) {
  const image = event.target;
  if (image.tagName !== 'IMG') return;
  if (image.dataset.videoId) {
    failedThumbnails.add(image.dataset.videoId);
    const photo = safeImage(data.channelInfo[image.dataset.channelId]?.photo);
    if (photo && !image.dataset.avatarFallback) {
      image.dataset.avatarFallback = 'true';
      image.parentElement.classList.remove('is-missing');
      image.parentElement.classList.add('thumb-is-avatar');
      image.src = photo;
      return;
    }
  }
  image.parentElement.classList.add('is-missing');
}
export function initWidgets(root) {
  host = root;
  settings = document.createElement('dialog'); settings.id = 'widget-settings-dialog'; settings.setAttribute('aria-labelledby', 'widget-settings-title'); document.body.append(settings);
  host.addEventListener('click', action); settings.addEventListener('click', action);
  host.addEventListener('error', imageFailed, true); settings.addEventListener('error', imageFailed, true);
  settings.addEventListener('submit', event => {
    const form = event.target; if (!form.dataset.form) return; event.preventDefault();
    const fields = new FormData(form);
    if (form.dataset.form === 'feed') { const url = safeUrl(fields.get('url')); if (url && !data.feeds.some(f => f.url === url)) data.feeds.push({ url }); persist(); render(); renderSettings(); refreshRss(); }
    if (form.dataset.form === 'key') { data.holodexKey = String(fields.get('key')).trim(); persist(); render(); renderSettings(); refreshLive(); }
    if (form.dataset.form === 'channel') { const id = String(fields.get('id')).trim(); if (channelPattern.test(id) && !data.channels.includes(id)) data.channels.push(id); persist(); render(); renderSettings(); refreshLive(); }
  });
  window.addEventListener('offline', render); window.addEventListener('online', () => { render(); refreshProfiles(); });
  render(); clearInterval(timer); timer = setInterval(() => { if (!document.hidden && navigator.onLine) refreshLive(); else render(); }, 120000);
  if (navigator.onLine) { refreshRss(); refreshLive(); }
}
