const KEY = 'homepage.widgets.v1';
const defaults = () => ({ feeds: [], articles: [], rssUpdated: null, channels: [], streams: [], liveUpdated: null, holodexKey: '' });
let data = load();
let host;
let timer;
let message = '';
let rssStatus = '';
let liveStatus = '';
let busyRss = false;
let busyLive = false;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function load() { try { return { ...defaults(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch { return defaults(); } }
function persist() { localStorage.setItem(KEY, JSON.stringify(data)); }
export function exportWidgets() { const { holodexKey, ...backup } = data; return structuredClone(backup); }
export function importWidgets(value) {
  if (!value || typeof value !== 'object') return;
  data = { ...defaults(), ...value, holodexKey: data.holodexKey, feeds: Array.isArray(value.feeds) ? value.feeds : [], articles: Array.isArray(value.articles) ? value.articles : [], channels: Array.isArray(value.channels) ? value.channels : [], streams: Array.isArray(value.streams) ? value.streams : [] };
  persist(); render();
}
const safeUrl = value => { try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
const formatDate = date => { const d = new Date(date); return Number.isNaN(d.valueOf()) ? '' : new Intl.DateTimeFormat('es', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' }).format(d); };
const updated = date => date ? `Actualizado ${formatDate(date)}` : 'Todavía sin actualizar';
function render() {
  if (!host) return;
  const openDetails = [...host.querySelectorAll('details')].map(el => el.open);
  host.innerHTML = `
  <section class="widget widget-rss" aria-labelledby="rss-title">
    <div class="widget-header"><div><span class="widget-kicker">TU LECTURA</span><h2 id="rss-title">En tu radar</h2></div><button class="widget-refresh" data-action="refresh-rss" ${busyRss ? 'disabled' : ''} aria-label="Actualizar RSS">↻</button></div>
    <div class="widget-body"><p class="widget-meta">${esc(rssStatus || updated(data.rssUpdated))}</p>
      ${data.articles.length ? `<ul class="widget-list">${data.articles.slice(0,6).map(a => `<li><a href="${esc(safeUrl(a.link))}" target="_blank" rel="noopener noreferrer"><span>${esc(a.title)}</span><small>${esc(a.source)}${a.date ? ' · '+esc(formatDate(a.date)) : ''}</small></a></li>`).join('')}</ul>` : '<p class="widget-empty">Tus lecturas favoritas, en un solo lugar. Añade un feed para empezar.</p>'}
      <details class="widget-settings"><summary>Gestionar feeds <span>${data.feeds.length}</span></summary><form data-form="feed"><label>URL del feed RSS o Atom<input name="url" type="url" placeholder="https://ejemplo.com/feed.xml" required></label><button type="submit">Añadir feed</button></form>${data.feeds.map((f,i)=>`<div class="widget-manage"><span>${esc(f.url)}</span><button data-action="remove-feed" data-index="${i}" aria-label="Eliminar feed">×</button></div>`).join('')}<p class="widget-help">Para actualizar se envía la dirección de cada feed a AllOrigins, un intermediario público. Sus titulares guardados siguen disponibles sin conexión.</p></details>
    </div>
  </section>
  <section class="widget widget-live" aria-labelledby="live-title">
    <div class="widget-header"><div><span class="widget-kicker">TUS TALENTOS</span><h2 id="live-title">En directo</h2></div><button class="widget-refresh" data-action="refresh-live" ${busyLive ? 'disabled' : ''} aria-label="Actualizar directos">↻</button></div>
    <div class="widget-body">${message ? `<p class="widget-notice" role="status">${esc(message)}</p>` : ''}<p class="widget-meta">${esc(liveStatus || updated(data.liveUpdated))}</p>
      ${data.streams.length ? `<ul class="widget-list">${data.streams.slice(0,8).map(s => `<li><a href="${esc(safeUrl('https://www.youtube.com/watch?v='+encodeURIComponent(s.id)))}" target="_blank" rel="noopener noreferrer"><span>${s.status === 'live' ? '<b class="live-badge">EN VIVO</b> ' : ''}${esc(s.title)}</span><small>${esc(s.channel)} · ${s.status === 'live' ? 'Ahora' : esc(formatDate(s.start))}</small></a></li>`).join('')}</ul>` : '<p class="widget-empty">Sigue tus canales favoritos y descubre sus próximos directos aquí.</p>'}
      <details class="widget-settings"><summary>Configurar talentos <span>${data.channels.length}</span></summary><form data-form="key"><label>Clave API de Holodex<input name="key" type="password" value="${esc(data.holodexKey)}" autocomplete="off" placeholder="Tu clave API"></label><button type="submit">Guardar clave</button></form><p class="widget-help">Solicita una clave en <a href="https://holodex.net/" target="_blank" rel="noopener noreferrer">Holodex</a>. Se guarda en este navegador y se envía a Holodex al actualizar.</p><form data-form="channel"><label>ID del canal de YouTube<input name="id" placeholder="UC…" pattern="UC[A-Za-z0-9_-]{22}" required></label><button type="submit">Seguir canal</button></form>${data.channels.map((c,i)=>`<div class="widget-manage"><span>${esc(c)}</span><button data-action="remove-channel" data-index="${i}" aria-label="Dejar de seguir canal">×</button></div>`).join('')}<p class="widget-help">Se consultan los directos de YouTube de los canales indicados. Con la página abierta se muestra un aviso al detectar uno nuevo en vivo.</p></details>
    </div>
  </section>`;
  host.querySelectorAll('details').forEach((el, i) => { el.open = !!openDetails[i]; });
}
async function refreshRss() {
  if (busyRss || !data.feeds.length) return;
  busyRss = true; rssStatus = 'Actualizando lecturas…'; render();
  const results = await Promise.allSettled(data.feeds.map(async f => {
    const resp = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(f.url), { signal: AbortSignal.timeout(12000) });
    if (!resp.ok) throw Error('feed');
    const xml = new DOMParser().parseFromString(await resp.text(), 'text/xml');
    if (xml.querySelector('parsererror')) throw Error('xml');
    const title = xml.querySelector('channel > title, feed > title')?.textContent || new URL(f.url).hostname;
    return [...xml.querySelectorAll('item, entry')].slice(0,10).map(item => {
      const link = item.querySelector('link')?.getAttribute('href') || item.querySelector('link')?.textContent || '';
      return { title: item.querySelector('title')?.textContent || 'Sin título', link: safeUrl(link.trim()), date: item.querySelector('pubDate, published, updated')?.textContent || '', source: title, feed: f.url };
    }).filter(item => item.link);
  }));
  const good = results.filter(r=>r.status==='fulfilled');
  if (good.length) {
    const failed = new Set(data.feeds.filter((_,i)=>results[i].status==='rejected').map(f=>f.url));
    data.articles = [...good.flatMap(r=>r.value), ...data.articles.filter(a=>failed.has(a.feed))].sort((a,b)=>(Date.parse(b.date)||0)-(Date.parse(a.date)||0)).slice(0,50);
    data.rssUpdated = new Date().toISOString(); persist();
  }
  rssStatus = good.length === results.length ? '' : `${results.length-good.length} feed(s) no se pudieron actualizar. Mostrando datos guardados.`;
  busyRss = false; render();
}
async function refreshLive() {
  if (busyLive || !data.channels.length || !data.holodexKey) return;
  busyLive = true; liveStatus = 'Buscando directos…'; render();
  try {
    const response = await fetch('https://holodex.net/api/v2/live?org=Hololive&status=live%2Cupcoming&max_upcoming_hours=168&limit=100', { headers: { 'X-APIKEY': data.holodexKey }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('No se pudo conectar con Holodex. Comprueba tu clave y conexión.');
    const result = await response.json(); if (!Array.isArray(result)) throw new Error('Respuesta inesperada de Holodex.');
    const streams = result.filter(s => data.channels.includes(s.channel?.id) && ['live','upcoming'].includes(s.status)).map(s => ({ id:s.id, title:s.title, status:s.status, channel:s.channel?.name || '', start:s.start_actual || s.start_scheduled || s.available_at })).sort((a,b) => (a.status === 'live' ? -1 : 0) - (b.status === 'live' ? -1 : 0) || (Date.parse(a.start)||0)-(Date.parse(b.start)||0));
    if (data.liveUpdated) {
      const wasLive = new Set(data.streams.filter(s=>s.status==='live').map(s=>s.id));
      const started = streams.filter(s=>s.status==='live' && !wasLive.has(s.id));
      if (started.length) message = `🔴 ${started.map(s=>s.channel).join(', ')} ${started.length === 1 ? 'está' : 'están'} en directo`;
    }
    data.streams = streams; data.liveUpdated = new Date().toISOString(); persist(); liveStatus = '';
  } catch (e) { liveStatus = e.message || 'No se pudo actualizar. Mostrando datos guardados.'; }
  busyLive = false; render();
}
export function initWidgets(root) {
  host = root; render();
  host.addEventListener('submit', event => {
    const form = event.target; if (!form.dataset.form) return; event.preventDefault();
    const fields = new FormData(form);
    if (form.dataset.form === 'feed') { const url=safeUrl(fields.get('url')); if (url && !data.feeds.some(f=>f.url===url)) data.feeds.push({url}); persist(); render(); refreshRss(); }
    if (form.dataset.form === 'key') { data.holodexKey=String(fields.get('key')).trim(); persist(); render(); refreshLive(); }
    if (form.dataset.form === 'channel') { const id=String(fields.get('id')).trim(); if (/^UC[A-Za-z0-9_-]{22}$/.test(id) && !data.channels.includes(id)) data.channels.push(id); persist(); render(); refreshLive(); }
  });
  host.addEventListener('click', event => {
    const button=event.target.closest('[data-action]'); if (!button) return;
    const index=Number(button.dataset.index);
    if (button.dataset.action==='refresh-rss') refreshRss();
    if (button.dataset.action==='refresh-live') refreshLive();
    if (button.dataset.action==='remove-feed') { const [removed]=data.feeds.splice(index,1); data.articles=data.articles.filter(a=>a.feed!==removed?.url); persist(); render(); }
    if (button.dataset.action==='remove-channel') { data.channels.splice(index,1); data.streams=[]; persist(); render(); refreshLive(); }
  });
  clearInterval(timer); timer=setInterval(()=>{ if (!document.hidden && navigator.onLine) refreshLive(); }, 120000);
  if (navigator.onLine) { refreshRss(); refreshLive(); }
}
