const STORAGE_KEY = 'inicio.background.v1';
const defaults = () => ({ enabled: true, dim: 50, blur: 0, positionX: 70, positionY: 50 });
const ranges = { dim: [20, 85], blur: [0, 12], positionX: [0, 100], positionY: [0, 100] };
function normalize(value) {
  const result = defaults();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  if (typeof value.enabled === 'boolean') result.enabled = value.enabled;
  for (const [key, [min, max]] of Object.entries(ranges)) {
    if (typeof value[key] === 'number' && Number.isFinite(value[key])) result[key] = Math.round(Math.min(max, Math.max(min, value[key])));
  }
  return result;
}
function load() {
  try { return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY))); } catch { return defaults(); }
}
let state = load();
let layer;
let dialog;
let storageAvailable = true;
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); storageAvailable = true; } catch { storageAvailable = false; }
}
function apply() {
  document.body.classList.toggle('has-wallpaper', state.enabled);
  const style = document.documentElement.style;
  style.setProperty('--wallpaper-dim', state.dim / 100);
  style.setProperty('--wallpaper-blur', `${state.blur}px`);
  style.setProperty('--wallpaper-x', `${state.positionX}%`);
  style.setProperty('--wallpaper-y', `${state.positionY}%`);
  if (layer) layer.hidden = !state.enabled;
}
function syncControls() {
  if (!dialog) return;
  dialog.querySelector('#wallpaper-enabled').checked = state.enabled;
  for (const key of Object.keys(ranges)) {
    const input = dialog.querySelector(`[data-background-input="${key}"]`);
    input.value = state[key];
    input.disabled = !state.enabled;
    dialog.querySelector(`[data-background-output="${key}"]`).textContent = `${state[key]}${key === 'blur' ? ' px' : '%'}`;
  }
  dialog.querySelector('[data-background-status]').textContent = storageAvailable ? 'Los ajustes se guardan en este navegador y se incluyen en tu copia de seguridad.' : 'Los ajustes se aplican a esta sesión. El navegador no ha permitido guardarlos.';
}
export function exportBackground() { return { ...state }; }
export function importBackground(value) {
  // Backups created before background settings existed retain the current appearance.
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  state = normalize(value); save(); apply(); syncControls();
}
export function initBackground() {
  if (layer) return;
  layer = document.createElement('div');
  layer.className = 'wallpaper';
  layer.setAttribute('aria-hidden', 'true');
  layer.style.backgroundImage = 'url("./assets/background.jpg")';
  document.body.prepend(layer);
  dialog = document.createElement('dialog');
  dialog.id = 'background-dialog';
  dialog.className = 'background-controls';
  dialog.setAttribute('aria-labelledby', 'background-title');
  dialog.innerHTML = `
    <div class="dialog-head"><div><span class="section-kicker">APARIENCIA</span><h2 id="background-title">Tu fondo</h2></div><button class="icon-button" type="button" data-background-close aria-label="Cerrar ajustes del fondo"><svg aria-hidden="true"><use href="#i-close"/></svg></button></div>
    <label class="background-toggle"><input id="wallpaper-enabled" type="checkbox"> Mostrar imagen de fondo</label>
    <p class="muted small">Ajusta la imagen para que tu espacio siga siendo fácil de leer. Al desactivarla, verás el fondo degradado.</p>
    <label class="field" for="wallpaper-dim"><span>Oscurecimiento <output for="wallpaper-dim" data-background-output="dim"></output></span><input id="wallpaper-dim" data-background-input="dim" type="range" min="20" max="85" step="1"></label>
    <label class="field" for="wallpaper-blur"><span>Desenfoque <output for="wallpaper-blur" data-background-output="blur"></output></span><input id="wallpaper-blur" data-background-input="blur" type="range" min="0" max="12" step="1"></label>
    <label class="field" for="wallpaper-x"><span>Encuadre horizontal <output for="wallpaper-x" data-background-output="positionX"></output></span><input id="wallpaper-x" data-background-input="positionX" type="range" min="0" max="100" step="1"></label>
    <label class="field" for="wallpaper-y"><span>Encuadre vertical <output for="wallpaper-y" data-background-output="positionY"></output></span><input id="wallpaper-y" data-background-input="positionY" type="range" min="0" max="100" step="1"></label>
    <p class="muted small" data-background-status role="status"></p>
    <div class="settings-actions"><button type="button" data-background-reset>Restablecer fondo</button><button class="primary-button" type="button" data-background-close>Listo</button></div>`;
  document.body.append(dialog);
  dialog.querySelector('#wallpaper-enabled').addEventListener('change', event => {
    state.enabled = event.target.checked; save(); apply(); syncControls();
  });
  dialog.querySelectorAll('[data-background-input]').forEach(input => input.addEventListener('input', event => {
    const key = event.target.dataset.backgroundInput;
    state = normalize({ ...state, [key]: Number(event.target.value) });
    save(); apply(); syncControls();
  }));
  dialog.querySelector('[data-background-reset]').addEventListener('click', () => { state = defaults(); save(); apply(); syncControls(); });
  dialog.querySelectorAll('[data-background-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  document.querySelector('#background-open')?.addEventListener('click', event => {
    event.currentTarget.closest('dialog')?.close();
    syncControls(); dialog.showModal();
  });
  apply(); syncControls();
}
