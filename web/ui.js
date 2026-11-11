'use strict';
/* Controls, mouse and keyboard for the GPU board in life.js, plus the page
   language (Spanish/English) and the light/dark theme of taridepaco.github.io. */

(function () {
  const $ = (id) => document.getElementById(id);
  const root = document.documentElement;

  // ---- texts -------------------------------------------------------------
  const TEXT = {
    es: {
      desc: 'El juego de la vida de Conway calculado en la GPU del navegador: millones de celdas en tiempo real.',
      kind: 'Simulador',
      panel: 'Controles',
      pitch: 'El juego de la vida de Conway calculado en la GPU de tu navegador: millones de celdas en tiempo real.',
      'g.run': 'Simulación', 'g.board': 'Tablero', 'g.patterns': 'Patrones', 'g.help': 'Manejo',
      play: 'Play', pause: 'Pausa', step: 'Paso', fit: 'Encajar', random: 'Aleatorio', clear: 'Vaciar',
      speed: 'Velocidad', size: 'Tamaño', density: 'Densidad',
      edges: 'Bordes', 'edges.wrap': 'Toroidal', 'edges.closed': 'Cerrado',
      pattern: 'Patrón', draw: '— dibujar —', rle: 'Pegar RLE',
      'h.pattern': 'Elige uno y haz clic en el tablero para colocarlo.',
      't.play': 'Reproducir / pausa (espacio)', 't.step': 'Una generación (N)', 't.fit': 'Ver el tablero entero (F)',
      't.random': 'Rellenar al azar (R)', 't.clear': 'Vaciar (C)', 't.rle': 'Pegar un patrón en formato RLE',
      't.wrap': 'Lo que sale por un borde entra por el contrario',
      't.closed': 'Fuera del tablero todas las celdas están muertas',
      'k.click': 'Clic', 'k.pan': 'Mayús + arrastrar', 'k.wheel': 'Rueda', 'k.space': 'Espacio', 'k.ctrlclick': 'Ctrl + clic',
      'h.click': 'dibujar o borrar', 'h.pan': 'mover (también con el botón derecho o el central)',
      'h.play': 'play / pausa', 'h.step': 'una generación', 'h.random': 'aleatorio', 'h.clear': 'vaciar',
      'h.fit': 'encajar el tablero', 'h.ctrlclick': 'colocar varias copias del patrón', 'h.esc': 'soltar el patrón',
      'd.title': 'Pegar patrón RLE',
      'd.text': 'Pega un patrón en formato RLE (por ejemplo, de LifeWiki). Después haz clic en el tablero para colocarlo.',
      'd.cancel': 'Cancelar', 'd.ok': 'Usar patrón',
      board: 'Tablero del juego de la vida',
      cells: 'Gceldas/s',
      'p.glider': 'Planeador', 'p.lwss': 'Nave ligera (LWSS)', 'p.rpentomino': 'R-pentominó', 'p.acorn': 'Bellota',
      'p.pulsar': 'Púlsar', 'p.gosper': 'Cañón de Gosper',
      'e.nogl': 'WebGL2 no está disponible en este navegador.',
      'e.maxsize': 'El máximo de esta GPU es {n}×{n}.',
      'e.nomem': 'No hay memoria de GPU suficiente para {w}×{h}.',
      'e.rle': 'RLE vacío o no válido.',
      'e.lost': 'Se ha perdido el contexto de la GPU (¿tablero demasiado grande?). Recarga la página.',
      'theme.auto': 'Tema: auto', 'theme.light': 'Tema: claro', 'theme.dark': 'Tema: oscuro',
    },
    en: {
      desc: "Conway's Game of Life computed on the browser's GPU: millions of cells in real time.",
      kind: 'Simulator',
      panel: 'Controls',
      pitch: "Conway's Game of Life computed on your browser's GPU: millions of cells in real time.",
      'g.run': 'Simulation', 'g.board': 'Board', 'g.patterns': 'Patterns', 'g.help': 'How to use it',
      play: 'Play', pause: 'Pause', step: 'Step', fit: 'Fit', random: 'Random', clear: 'Clear',
      speed: 'Speed', size: 'Size', density: 'Density',
      edges: 'Edges', 'edges.wrap': 'Wrap around', 'edges.closed': 'Closed',
      pattern: 'Pattern', draw: '— draw —', rle: 'Paste RLE',
      'h.pattern': 'Pick one and click on the board to place it.',
      't.play': 'Play / pause (space)', 't.step': 'One generation (N)', 't.fit': 'See the whole board (F)',
      't.random': 'Fill at random (R)', 't.clear': 'Clear (C)', 't.rle': 'Paste a pattern in RLE format',
      't.wrap': 'What leaves through one edge comes in through the opposite one',
      't.closed': 'All cells outside the board are dead',
      'k.click': 'Click', 'k.pan': 'Shift + drag', 'k.wheel': 'Wheel', 'k.space': 'Space', 'k.ctrlclick': 'Ctrl + click',
      'h.click': 'draw or erase', 'h.pan': 'pan (right or middle button too)',
      'h.play': 'play / pause', 'h.step': 'one generation', 'h.random': 'random', 'h.clear': 'clear',
      'h.fit': 'fit the board', 'h.ctrlclick': 'place several copies of the pattern', 'h.esc': 'drop the pattern',
      'd.title': 'Paste an RLE pattern',
      'd.text': 'Paste a pattern in RLE format (from LifeWiki, for example). Then click on the board to place it.',
      'd.cancel': 'Cancel', 'd.ok': 'Use pattern',
      board: 'Game of Life board',
      cells: 'Gcells/s',
      'p.glider': 'Glider', 'p.lwss': 'Lightweight spaceship (LWSS)', 'p.rpentomino': 'R-pentomino', 'p.acorn': 'Acorn',
      'p.pulsar': 'Pulsar', 'p.gosper': 'Gosper glider gun',
      'e.nogl': 'WebGL2 is not available in this browser.',
      'e.maxsize': "This GPU's maximum is {n}×{n}.",
      'e.nomem': 'Not enough GPU memory for {w}×{h}.',
      'e.rle': 'Empty or invalid RLE.',
      'e.lost': 'The GPU context was lost (board too large?). Reload the page.',
      'theme.auto': 'Theme: auto', 'theme.light': 'Theme: light', 'theme.dark': 'Theme: dark',
    },
  };
  const LANG_KEY = 'taridepaco-lang'; // shared with the rest of taridepaco.github.io
  let lang = root.lang === 'en' ? 'en' : 'es';

  function t(key, args) {
    const s = TEXT[lang][key] ?? key;
    return args ? s.replace(/\{(\w+)\}/g, (m, k) => (k in args ? args[k].toLocaleString(lang) : m)) : s;
  }
  /** Error text in the page language (life.js errors carry a code). */
  function errorText(e) {
    return e && e.code && TEXT[lang]['e.' + e.code] ? t('e.' + e.code, e.args) : String(e && e.message || e);
  }

  // ---- top bar: theme and language (they work even without WebGL2) ------
  const themeBtn = $('theme-btn');
  const Theme = window.Theme;
  const onLang = [];
  const onTheme = [];

  function paintText() {
    root.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
    document.querySelectorAll('[data-i18n-label]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nLabel)); });
    document.querySelectorAll('.lang-switch button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.lang === lang));
    document.querySelector('meta[name="description"]').content = t('desc');
    if (Theme) themeBtn.textContent = t(`theme.${Theme.mode()}`);
    onLang.forEach((f) => f());
  }

  function syncTheme() {
    if (Theme) themeBtn.textContent = t(`theme.${Theme.mode()}`);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(root).getPropertyValue('--bg').trim();
    onTheme.forEach((f) => f());
  }

  if (Theme) {
    themeBtn.addEventListener('click', () => Theme.cycle());
    Theme.onChange(syncTheme);
  } else {
    themeBtn.hidden = true;
  }
  document.querySelectorAll('.lang-switch button').forEach((b) => {
    b.addEventListener('click', () => {
      lang = b.dataset.lang;
      try { localStorage.setItem(LANG_KEY, lang); } catch (e) { /* no storage */ }
      paintText();
    });
  });

  // ---- board -------------------------------------------------------------
  const canvas = $('board');
  const errorBox = $('error');
  let errorKey = null; // the error box follows the language when it can

  function fail(e) {
    errorKey = e;
    errorBox.textContent = errorText(e);
    errorBox.hidden = false;
  }
  onLang.push(() => { if (errorKey) errorBox.textContent = errorText(errorKey); });

  let life;
  try {
    life = new Life(canvas);
  } catch (e) {
    paintText();
    syncTheme();
    fail(e);
    return;
  }

  // Board colours. The canvas does not inherit the CSS tokens, so they are read
  // from the page and refreshed when the theme changes. Live cells use the
  // "bosque" (day) and "prado" (night) greens of the shared palette.
  const ALIVE = { day: '#4f8f47', night: '#74b34e' };

  function setColors() {
    const css = getComputedStyle(root);
    const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
    const dark = Theme ? Theme.isDark() : window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dead = hexToRgb(token('--surface', '#f7f2d6'));
    const line = hexToRgb(token('--line', '#1f2a33'));
    life.colors = {
      alive: hexToRgb(dark ? ALIVE.night : ALIVE.day),
      dead,
      outside: hexToRgb(token('--bg', '#bfe3d6')),
      // the shader blends the grid at 60%: a third of the way to --line gives a thin, quiet grid
      grid: dead.map((d, i) => d + (line[i] - d) * 0.3),
    };
    dirty = true;
  }
  onTheme.push(setColors);

  // ---- state -------------------------------------------------------------
  const SPEEDS = [1, 2, 5, 10, 30, 60, 120, 240, 480, 960, 1920, 3840];
  const MAX_STEPS_PER_FRAME = 64;
  const view = { cx: 0, cy: 0, zoom: 1 };
  let running = false;
  let rate = 60;              // target generations per second
  let pending = 0;            // fractional generations owed to the clock
  let stamp = null;           // pattern waiting to be placed {w, h, cells}
  let dirty = true;

  // ---- controls ----------------------------------------------------------
  const speedSel = $('speed');
  SPEEDS.forEach((s) => speedSel.add(new Option(`${s} gen/s`, s, false, s === rate)));
  speedSel.addEventListener('change', () => { rate = +speedSel.value; });

  const sizeSel = $('size');
  for (let s = 256; s <= Math.min(life.maxSize, 16384); s *= 2) sizeSel.add(new Option('', s));
  sizeSel.value = String(defaultSize());

  // Default board from the size of the canvas: the smallest power of two that covers its longer
  // side in CSS pixels, between 256² and 1024². A phone (canvas of 300-500 px) gets 512²,
  // a computer 1024².
  function defaultSize() {
    const side = Math.max(canvas.clientWidth, canvas.clientHeight);
    let s = 256;
    while (s < side && s < 1024) s *= 2;
    return Math.min(s, life.maxSize);
  }
  function paintSizes() {
    for (const o of sizeSel.options) {
      const s = +o.value;
      const mcells = (s * s / 1e6).toLocaleString(lang, { maximumFractionDigits: s < 1024 ? 2 : 0 });
      o.text = `${s}² (${mcells} M)`;
    }
  }
  onLang.push(paintSizes);

  const density = $('density');
  const densityOut = $('density-out');
  function showDensity() {
    densityOut.textContent = `${Math.round(density.value * 100)}%`;
    // filled part of the track, see style.css
    density.style.setProperty('--p', (density.value - density.min) / (density.max - density.min));
  }
  density.addEventListener('input', showDensity);
  showDensity();

  const patternSel = $('pattern');
  Object.keys(PATTERNS).forEach((id) => patternSel.add(new Option('', id)));
  function paintPatterns() {
    for (const o of patternSel.options) if (o.value) o.text = t(`p.${o.value}`);
  }
  onLang.push(paintPatterns);
  patternSel.addEventListener('change', () => {
    setStamp(patternSel.value ? parseRLE(PATTERNS[patternSel.value]) : null);
  });

  function setStamp(p) {
    stamp = p;
    canvas.classList.toggle('stamping', !!p);
    if (!p) patternSel.value = '';
  }

  const playBtn = $('play');
  const playLabel = playBtn.querySelector('span');
  function paintPlay() {
    playLabel.dataset.i18n = running ? 'pause' : 'play';
    playLabel.textContent = t(playLabel.dataset.i18n);
    playBtn.dataset.running = running;
  }
  onLang.push(paintPlay);
  function setRunning(on) {
    running = on;
    pending = 0;
    paintPlay();
  }
  playBtn.addEventListener('click', () => setRunning(!running));
  $('step').addEventListener('click', stepOnce);
  $('random').addEventListener('click', randomize);
  $('clear').addEventListener('click', clearBoard);
  $('fit').addEventListener('click', fit);
  $('edges').addEventListener('change', (e) => { life.wrap = e.target.value === 'wrap'; });
  life.wrap = $('edges-wrap').checked;
  sizeSel.addEventListener('change', () => newBoard(+sizeSel.value));

  // Give the keyboard back to the board after using a button or a list, so a
  // later Space doesn't press that button again or open the list.
  const dialog = $('rle-dialog');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button, summary');
    if (b && !dialog.contains(b)) b.blur();
  });
  document.addEventListener('change', (e) => {
    if (e.target.matches('select, input[type="checkbox"], input[type="radio"]')) e.target.blur();
  });

  function stepOnce() { setRunning(false); life.step(1); dirty = true; }
  function randomize() { life.randomize(+density.value); dirty = true; }
  function clearBoard() { life.clear(); dirty = true; }

  function newBoard(size) {
    const previous = life.width;
    try {
      life.resize(size, size);
    } catch (e) {
      alert(errorText(e));
      if (previous) {
        life.resize(previous, previous);
        sizeSel.value = String(previous);
      }
    }
    randomize();
    fit();
  }

  // ---- RLE dialog --------------------------------------------------------
  const rleText = $('rle-text');
  const rleError = $('rle-error');
  $('rle').addEventListener('click', () => {
    rleError.hidden = true;
    dialog.showModal();
    rleText.focus();
  });
  $('rle-ok').addEventListener('click', (e) => {
    try {
      setStamp(parseRLE(rleText.value));
    } catch (err) {
      e.preventDefault();
      rleError.textContent = errorText(err);
      rleError.hidden = false;
    }
  });

  // ---- view --------------------------------------------------------------
  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      dirty = true;
      if (autoFit) fit();
    }
  }

  // Until the user zooms or pans, keep the whole board in view when the window changes size.
  let autoFit = true;

  function fit() {
    autoFit = true;
    resizeCanvas();
    view.cx = life.width / 2;
    view.cy = life.height / 2;
    view.zoom = Math.min(canvas.width / life.width, canvas.height / life.height) * 0.98;
    dirty = true;
  }

  /** Canvas pixel (device pixels) for a pointer event. */
  function devicePoint(e) {
    const r = canvas.getBoundingClientRect();
    const dpr = canvas.width / r.width;
    return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr];
  }

  function cellAt(px, py) {
    return [
      Math.floor(view.cx + (px - canvas.width / 2) / view.zoom),
      Math.floor(view.cy + (py - canvas.height / 2) / view.zoom),
    ];
  }

  function zoomAt(px, py, factor) {
    const maxZoom = 64;
    const minZoom = Math.min(canvas.width / life.width, canvas.height / life.height) / 4;
    const z = Math.min(maxZoom, Math.max(minZoom, view.zoom * factor));
    // keep the cell under the cursor in place
    view.cx += (px - canvas.width / 2) * (1 / view.zoom - 1 / z);
    view.cy += (py - canvas.height / 2) * (1 / view.zoom - 1 / z);
    view.zoom = z;
    autoFit = false;
    dirty = true;
  }

  // ---- pointer -----------------------------------------------------------
  let drag = null; // {mode: 'pan'|'paint', value, lastX, lastY}
  const ONE = new Uint8Array([1]);
  const ZERO = new Uint8Array([0]);

  function paintLine(x0, y0, x1, y1, value) {
    // Bresenham, so fast strokes leave no gaps
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      life.write(x0, y0, 1, 1, value ? ONE : ZERO);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    dirty = true;
  }

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    const [px, py] = devicePoint(e);
    if (e.button === 1 || e.button === 2 || e.shiftKey) {
      drag = { mode: 'pan', lastX: px, lastY: py };
      canvas.classList.add('panning');
      return;
    }
    if (e.button !== 0) return;
    const [x, y] = cellAt(px, py);
    if (stamp) {
      life.write(x - (stamp.w >> 1), y - (stamp.h >> 1), stamp.w, stamp.h, stamp.cells);
      dirty = true;
      if (!e.ctrlKey) setStamp(null); // Ctrl+clic: keep placing copies
      return;
    }
    if (x < 0 || y < 0 || x >= life.width || y >= life.height) return;
    const value = life.read(x, y, 1, 1)[0] ? 0 : 1; // toggle the first cell, then paint that value
    drag = { mode: 'paint', value, lastX: x, lastY: y };
    paintLine(x, y, x, y, value);
  });

  canvas.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const [px, py] = devicePoint(e);
    if (drag.mode === 'pan') {
      view.cx -= (px - drag.lastX) / view.zoom;
      view.cy -= (py - drag.lastY) / view.zoom;
      drag.lastX = px;
      drag.lastY = py;
      autoFit = false;
      dirty = true;
    } else {
      const [x, y] = cellAt(px, py);
      if (x !== drag.lastX || y !== drag.lastY) {
        paintLine(drag.lastX, drag.lastY, x, y, drag.value);
        drag.lastX = x;
        drag.lastY = y;
      }
    }
  });

  const endDrag = () => { drag = null; canvas.classList.remove('panning'); };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const [px, py] = devicePoint(e);
    zoomAt(px, py, Math.exp(-e.deltaY * 0.0015));
  }, { passive: false });

  // ---- keyboard ----------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    if (dialog.open || e.target.matches('input, select, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === ' ') { e.preventDefault(); setRunning(!running); }
    else if (k === 'n') stepOnce();
    else if (k === 'r') randomize();
    else if (k === 'c') clearBoard();
    else if (k === 'f') fit();
    else if (k === 'escape') setStamp(null);
    else if (k === '+' || k === '=') zoomAt(canvas.width / 2, canvas.height / 2, 1.25);
    else if (k === '-') zoomAt(canvas.width / 2, canvas.height / 2, 0.8);
  });

  // ---- loop --------------------------------------------------------------
  const stats = $('stats');
  let last = performance.now();
  let statT = last, statGen = 0, genRate = 0;

  function paintStats() {
    const cells = life.width * life.height;
    const zoom = view.zoom >= 1 ? view.zoom.toFixed(1) : '1/' + (1 / view.zoom).toFixed(1);
    stats.textContent =
      `gen ${life.generation.toLocaleString(lang)} · ${genRate.toFixed(0)} gen/s · ` +
      `${(genRate * cells / 1e9).toLocaleString(lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${t('cells')} · zoom ${zoom}`;
  }
  onLang.push(paintStats);

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    resizeCanvas();
    if (running) {
      pending += rate * dt;
      const n = Math.min(Math.floor(pending), MAX_STEPS_PER_FRAME);
      if (n > 0) {
        life.step(n);
        pending = Math.min(pending - n, MAX_STEPS_PER_FRAME); // don't build up an endless backlog
        statGen += n;
        dirty = true;
      }
    }
    if (dirty) {
      life.draw(view);
      dirty = false;
    }
    if (now - statT > 500) {
      genRate = statGen / ((now - statT) / 1000);
      statGen = 0;
      statT = now;
      paintStats();
    }
    requestAnimationFrame(frame);
  }

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    setRunning(false);
    fail({ code: 'lost' });
  });

  // ---- start -------------------------------------------------------------
  paintText();
  syncTheme();
  newBoard(+sizeSel.value);
  setRunning(true); // starts playing as soon as the page opens
  window.lifer = { life, view, setRunning, fit }; // handy from the console
  requestAnimationFrame(frame);
})();
