const CACHE_KEY = 'inicio.currency.cache.v1';
const SETTINGS_KEY = 'inicio.currency.settings.v1';
const TTL = 86400000;
const MAX_PAIRS = 40;
const currencies = [
  ['USD', 'Dólar estadounidense'], ['EUR', 'Euro'], ['MXN', 'Peso mexicano'],
  ['JPY', 'Yen japonés'], ['GBP', 'Libra esterlina'], ['CAD', 'Dólar canadiense'],
  ['CHF', 'Franco suizo'], ['AUD', 'Dólar australiano'], ['KRW', 'Won surcoreano'],
  ['CNY', 'Yuan chino'], ['BRL', 'Real brasileño']
];
const validCurrency = value => currencies.some(([code]) => code === value);
function validQuote(value, from, to) {
  return value && value.source === 'Mastercard' && value.bankFee === 0 && value.from === from && value.to === to &&
    typeof value.rate === 'number' && Number.isFinite(value.rate) && value.rate > 0 &&
    typeof value.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.date) && Number.isFinite(Date.parse(value.date)) &&
    typeof value.updatedAt === 'string' && Number.isFinite(Date.parse(value.updatedAt));
}
function loadCache() {
  try {
    const entries = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (!Array.isArray(entries)) return new Map();
    return new Map(entries.filter(entry => {
      if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !/^[A-Z]{3}:[A-Z]{3}$/.test(entry[0])) return false;
      const [from, to] = entry[0].split(':');
      return validQuote(entry[1], from, to);
    }).slice(-MAX_PAIRS));
  } catch { return new Map(); }
}
function loadSettings() {
  try {
    const value = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (value && validCurrency(value.from) && validCurrency(value.to) && typeof value.amount === 'number' && Number.isFinite(value.amount) && value.amount >= 0 && value.amount <= 999999999) return value;
  } catch { /* Use defaults when storage is unavailable. */ }
  return { from: 'USD', to: 'EUR', amount: 100 };
}
const formatRate = rate => new Intl.NumberFormat('es', { maximumFractionDigits: 6 }).format(rate);
function rateDate(value) {
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(value + 'T12:00:00Z'));
}
export function initCurrency(root) {
  if (!root) return;
  const cache = loadCache();
  let selection = loadSettings();
  let lastError = '';
  let unavailable = false;
  let busy = false;
  let pendingPair = '';
  let requestNumber = 0;
  let controller;
  root.innerHTML = `<div class="widget-header"><div class="widget-heading"><svg class="widget-symbol" aria-hidden="true"><use href="#i-swap"/></svg><div><span class="widget-kicker">TIPO DE TU TARJETA</span><h2 id="exchange-title">Divisas</h2></div></div></div>
    <div class="widget-body currency-body"><form class="currency-form" aria-label="Convertir divisas"><div class="currency-amount-row"><label class="currency-amount"><span class="sr-only">Importe a convertir</span><input id="currency-amount" type="number" min="0" max="999999999" step="0.01" inputmode="decimal" aria-label="Importe a convertir"></label><button class="currency-refresh icon-button" type="submit" aria-label="Actualizar tipo de cambio" title="Actualizar tipo de cambio"><svg aria-hidden="true"><use href="#i-swap"/></svg></button></div><div class="currency-pair"><label><span class="sr-only">Divisa de origen</span><select id="currency-from" aria-label="Divisa de origen"></select></label><button type="button" class="currency-swap icon-button" aria-label="Intercambiar divisas"><svg aria-hidden="true"><use href="#i-swap"/></svg></button><label><span class="sr-only">Divisa de destino</span><select id="currency-to" aria-label="Divisa de destino"></select></label></div></form><div class="currency-output"><strong id="currency-result" aria-live="polite">—</strong><small id="currency-rate"></small></div><p class="widget-meta currency-meta" id="currency-status" role="status"></p></div>
    <div class="widget-footer currency-footer"><a class="text-link" href="https://www.mastercard.com/us/en/personal/get-support/currency-exchange-rate-converter.html" target="_blank" rel="noopener noreferrer">Mastercard<svg aria-hidden="true"><use href="#i-arrow"/></svg></a><span title="Estimación sin comisión bancaria; el importe final depende del banco.">Sin comisión bancaria</span></div>`;
  const amountInput = root.querySelector('#currency-amount');
  const fromInput = root.querySelector('#currency-from');
  const toInput = root.querySelector('#currency-to');
  const result = root.querySelector('#currency-result');
  const rate = root.querySelector('#currency-rate');
  const status = root.querySelector('#currency-status');
  const refresh = root.querySelector('.currency-refresh');
  for (const select of [fromInput, toInput]) for (const [code, name] of currencies) {
    const option = document.createElement('option'); option.value = code; option.textContent = code; option.title = name; select.append(option);
  }
  amountInput.value = selection.amount;
  fromInput.value = selection.from;
  toInput.value = selection.to;
  const pair = () => `${selection.from}:${selection.to}`;
  function remember() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(selection)); } catch { /* Session stays usable without storage. */ }
  }
  function show() {
    const quote = cache.get(pair());
    const age = quote ? Date.now() - Date.parse(quote.updatedAt) : Infinity;
    const saved = quote && (!navigator.onLine || age >= TTL || lastError || busy);
    const amount = Number(amountInput.value);
    const validAmount = amountInput.value !== '' && Number.isFinite(amount) && amount >= 0 && amount <= 999999999;
    root.dataset.state = !navigator.onLine ? 'offline' : busy ? 'loading' : lastError ? 'warning' : quote ? 'ready' : 'empty';
    refresh.disabled = busy || !navigator.onLine;
    refresh.classList.toggle('is-loading', busy);
    root.querySelector('.currency-body').setAttribute('aria-busy', String(busy));
    if (quote && validAmount) {
      result.textContent = new Intl.NumberFormat('es', { style: 'currency', currency: selection.to }).format(amount * quote.rate);
      rate.textContent = `1 ${selection.from} = ${formatRate(quote.rate)} ${selection.to}`;
      status.textContent = `${saved ? 'Guardado · ' : ''}Tipo del ${rateDate(quote.date)}${busy ? ' · actualizando' : ''}${lastError ? ' · sin actualizar' : ''}`;
    } else {
      result.textContent = '—'; rate.textContent = validAmount ? '' : 'Introduce un importe válido';
      status.textContent = !navigator.onLine ? 'Sin un tipo guardado para estas divisas' : busy ? 'Consultando Mastercard…' : unavailable ? 'Requiere servicio de conversión' : lastError || 'Consulta un tipo de cambio';
    }
    status.title = lastError || 'Estimación con el tipo de Mastercard. No incluye comisión bancaria ni otros cargos de tu banco.';
  }
  async function update(force = false) {
    const key = pair();
    const saved = cache.get(key);
    if (!navigator.onLine || (!force && saved && Date.now() - Date.parse(saved.updatedAt) < TTL)) { show(); return; }
    if (busy && pendingPair === key) return;
    controller?.abort();
    controller = new AbortController();
    const localController = controller;
    const sequence = ++requestNumber;
    pendingPair = key; busy = true; lastError = ''; unavailable = false; show();
    const timeout = setTimeout(() => localController.abort(), 12000);
    try {
      const params = new URLSearchParams({ from: selection.from, to: selection.to });
      const response = await fetch('/api/currency?' + params, { signal: localController.signal, cache: 'no-store', credentials: 'same-origin' });
      if (response.status === 404) { const error = new Error('Requiere servicio de conversión'); error.unavailable = true; throw error; }
      if (!response.ok) throw new Error('No se pudo actualizar el tipo de Mastercard');
      const data = await response.json();
      const [from, to] = key.split(':');
      if (!validQuote(data, from, to)) throw new Error('La respuesta de Mastercard no contiene un tipo válido');
      const quote = { rate: data.rate, from, to, date: data.date, updatedAt: data.updatedAt, source: 'Mastercard', bankFee: 0 };
      cache.delete(key); cache.set(key, quote);
      while (cache.size > MAX_PAIRS) cache.delete(cache.keys().next().value);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify([...cache])); } catch { /* Keep the quote in memory for this session. */ }
    } catch (error) {
      if (sequence === requestNumber) {
        unavailable = Boolean(error.unavailable);
        lastError = error.name === 'AbortError' ? 'La consulta tardó demasiado. Conservamos el último tipo disponible.' : error.message;
      }
    } finally {
      clearTimeout(timeout);
      if (sequence === requestNumber) { busy = false; pendingPair = ''; show(); }
    }
  }
  function selectPair() {
    controller?.abort(); requestNumber++; busy = false; pendingPair = '';
    selection.from = fromInput.value; selection.to = toInput.value;
    lastError = ''; unavailable = false; remember(); show(); update();
  }
  amountInput.addEventListener('input', () => {
    const amount = Number(amountInput.value);
    if (amountInput.value !== '' && Number.isFinite(amount) && amount >= 0 && amount <= 999999999) { selection.amount = amount; remember(); }
    show();
  });
  fromInput.addEventListener('change', selectPair); toInput.addEventListener('change', selectPair);
  root.querySelector('.currency-swap').addEventListener('click', () => { [fromInput.value, toInput.value] = [toInput.value, fromInput.value]; selectPair(); });
  root.querySelector('form').addEventListener('submit', event => { event.preventDefault(); update(true); });
  window.addEventListener('offline', show); window.addEventListener('online', () => { show(); update(); });
  show();
  requestAnimationFrame(() => setTimeout(() => update(), 0));
}
