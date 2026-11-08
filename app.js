import { initBackground, exportBackground, importBackground } from './background.js';
import { initWidgets, exportWidgets, importWidgets, openWidgetSettings, setWidgetPageSize } from './widgets.js';

initBackground();

const $ = selector => document.querySelector(selector);
const bookmarkKey = 'inicio.bookmarks.v1';
const defaults = [
  { name: 'YouTube', url: 'https://www.youtube.com/' },
  { name: 'Holodex', url: 'https://holodex.net/' },
  { name: 'Wikipedia', url: 'https://es.wikipedia.org/' }
];
function safeUrl(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function validBookmarks(value) {
  return Array.isArray(value) && value.every(item => item && typeof item.name === 'string' && item.name.trim() && safeUrl(item.url));
}
function loadBookmarks() {
  try { const value = JSON.parse(localStorage.getItem(bookmarkKey)); return validBookmarks(value) ? value : defaults; } catch { return defaults; }
}
let bookmarks = loadBookmarks();
let bookmarkPage = 0;
let bookmarkPageSize = 5;
let bookmarkColumns = 5;
let bookmarkRows = 1;
const icon = name => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
function notify(text) {
  $('#toast').textContent = text;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { $('#toast').textContent = ''; }, 4500);
}
function saveBookmarks() {
  localStorage.setItem(bookmarkKey, JSON.stringify(bookmarks));
  renderBookmarks();
}
function renderBookmarks() {
  const list = $('#bookmarks');
  list.replaceChildren();
  list.style.gridTemplateColumns = `repeat(${bookmarkColumns}, minmax(0, 1fr))`;
  list.style.gridAutoFlow = 'row';
  list.dataset.rows = String(bookmarkRows);
  const pageCount = Math.max(1, Math.ceil(bookmarks.length / bookmarkPageSize));
  bookmarkPage = Math.max(0, Math.min(bookmarkPage, pageCount - 1));
  const pageNav = $('#bookmark-pages');
  pageNav.replaceChildren();
  if (pageCount > 1) {
    for (const [delta, name, label] of [[-1, 'left', 'Favoritos anteriores'], [1, 'right', 'Favoritos siguientes']]) {
      const button = document.createElement('button');
      button.innerHTML = icon(name);
      button.setAttribute('aria-label', label);
      button.disabled = delta === -1 ? bookmarkPage === 0 : bookmarkPage === pageCount - 1;
      button.onclick = () => { bookmarkPage += delta; renderBookmarks(); };
      pageNav.append(button);
      if (delta === -1) {
        const count = document.createElement('span');
        count.textContent = `${bookmarkPage + 1}/${pageCount}`;
        pageNav.append(count);
      }
    }
  }
  if (!bookmarks.length) {
    const p = document.createElement('p'); p.className = 'empty'; p.textContent = 'Añade tus lugares favoritos.'; list.append(p); return;
  }
  const visible = bookmarks.slice(bookmarkPage * bookmarkPageSize, (bookmarkPage + 1) * bookmarkPageSize);
  visible.forEach((item, index) => {
    const wrap = document.createElement('div'); wrap.className = 'bookmark';
    const a = document.createElement('a'); a.href = safeUrl(item.url); a.title = item.name;
    const letter = document.createElement('span'); letter.className = 'bookmark-icon'; letter.setAttribute('aria-hidden', 'true'); letter.textContent = item.name.trim().charAt(0).toUpperCase();
    const name = document.createElement('span'); name.className = 'bookmark-name'; name.textContent = item.name;
    a.append(letter, name);
    const remove = document.createElement('button'); remove.className = 'bookmark-delete'; remove.textContent = '×'; remove.setAttribute('aria-label', `Eliminar ${item.name}`);
    remove.onclick = () => { bookmarks.splice(bookmarkPage * bookmarkPageSize + index, 1); saveBookmarks(); };
    wrap.append(a, remove); list.append(wrap);
  });
}
const bookmarkDialog = $('#bookmark-dialog');
$('#add-bookmark').onclick = () => bookmarkDialog.showModal();
document.querySelectorAll('.close-dialog').forEach(button => { button.onclick = () => button.closest('dialog').close(); });
$('#bookmark-form').onsubmit = event => {
  event.preventDefault(); const fields = new FormData(event.currentTarget);
  const url = safeUrl(fields.get('url')); const name = fields.get('name').trim();
  if (!url || !name) return;
  bookmarks.push({ name, url }); bookmarkPage = Math.floor((bookmarks.length - 1) / bookmarkPageSize);
  saveBookmarks(); event.currentTarget.reset(); bookmarkDialog.close(); notify('Favorito añadido');
};
$('#settings-open').onclick = () => $('#settings-dialog').showModal();
$('#configure-live').onclick = () => { $('#settings-dialog').close(); openWidgetSettings('live'); };
$('#configure-rss').onclick = () => { $('#settings-dialog').close(); openWidgetSettings('rss'); };
const engine = $('#engine');
const savedEngine = localStorage.getItem('inicio.engine');
if ([...engine.options].some(option => option.value === savedEngine)) engine.value = savedEngine;
engine.onchange = () => localStorage.setItem('inicio.engine', engine.value);
$('#search').onsubmit = event => {
  event.preventDefault(); const query = $('#query').value.trim();
  if (query) location.href = engine.value + encodeURIComponent(query);
};
function connection() {
  $('#connection').textContent = navigator.onLine ? 'En línea' : 'Sin conexión';
  $('#connection').classList.toggle('offline', !navigator.onLine);
}
window.addEventListener('online', connection); window.addEventListener('offline', connection); connection();
function date() { $('#date').textContent = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()); }
date(); setInterval(date, 60000);
initWidgets($('#widgets'));
const tabs = [...document.querySelectorAll('[data-tab]')];
function selectTab(tab) {
  $('.dashboard').dataset.active = tab.dataset.tab;
  tabs.forEach(item => { item.setAttribute('aria-selected', String(item === tab)); item.tabIndex = item === tab ? 0 : -1; });
}
tabs.forEach((tab, index) => {
  tab.onclick = () => selectTab(tab);
  tab.onkeydown = event => {
    let next;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(index + tabs.length - 1) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs[tabs.length - 1];
    if (next) { event.preventDefault(); selectTab(next); next.focus(); }
  };
});
selectTab(tabs[0]);
function fitLayout() {
  const mobile = window.innerWidth < 760;
  const width = $('.favorites-section').clientWidth;
  const doubleRow = mobile && window.innerHeight > 520;
  const columns = doubleRow ? 4 : Math.max(1, Math.min(6, Math.floor(width / (mobile ? 76 : 160))));
  const rows = doubleRow ? 2 : 1;
  const pageSize = columns * rows;
  if (bookmarkPageSize !== pageSize || bookmarkColumns !== columns || bookmarkRows !== rows) {
    bookmarkPageSize = pageSize; bookmarkColumns = columns; bookmarkRows = rows; renderBookmarks();
  }
  const height = $('#widget-deck').clientHeight;
  const itemHeight = window.innerHeight <= 520 ? 60 : 78;
  const reserved = window.innerHeight <= 520 ? 100 : 155;
  setWidgetPageSize(Math.floor((height - reserved) / itemHeight));
}
renderBookmarks();
const observer = new ResizeObserver(fitLayout); observer.observe($('.shell')); observer.observe($('#widget-deck'));
fitLayout();
$('#export').onclick = () => {
  const data = { version: 1, bookmarks, engine: engine.value, widgets: exportWidgets(), background: exportBackground() };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'inicio-copia.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$('#import').onchange = async event => {
  try {
    if (!event.target.files[0]) return;
    const data = JSON.parse(await event.target.files[0].text());
    if (data.version !== 1 || !validBookmarks(data.bookmarks) || !data.widgets || typeof data.widgets !== 'object' || Array.isArray(data.widgets)) throw new Error();
    importWidgets(data.widgets);
    importBackground(data.background);
    bookmarks = data.bookmarks; bookmarkPage = 0; saveBookmarks();
    if ([...engine.options].some(option => option.value === data.engine)) { engine.value = data.engine; localStorage.setItem('inicio.engine', engine.value); }
    $('#settings-dialog').close(); notify('Copia importada');
  } catch { notify('No se pudo importar. Comprueba que sea una copia válida de Inicio.'); }
  event.target.value = '';
};
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});
