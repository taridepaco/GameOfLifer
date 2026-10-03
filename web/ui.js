'use strict';
/* Controls, mouse and keyboard for the GPU board in life.js. */

(function () {
  const $ = (id) => document.getElementById(id);
  const canvas = $('board');
  const errorBox = $('error');

  function fail(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  let life;
  try {
    life = new Life(canvas);
  } catch (e) {
    fail(e.message);
    return;
  }

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
  for (let s = 256; s <= Math.min(life.maxSize, 16384); s *= 2) {
    const mcells = (s * s / 1e6).toFixed(s < 1024 ? 2 : 0);
    sizeSel.add(new Option(`${s}² (${mcells} M)`, s));
  }
  sizeSel.value = String(Math.min(2048, life.maxSize));

  const density = $('density');
  const densityOut = $('density-out');
  density.addEventListener('input', () => { densityOut.textContent = `${Math.round(density.value * 100)}%`; });

  const patternSel = $('pattern');
  Object.keys(PATTERNS).forEach((name) => patternSel.add(new Option(name, name)));
  patternSel.addEventListener('change', () => {
    setStamp(patternSel.value ? parseRLE(PATTERNS[patternSel.value]) : null);
  });

  function setStamp(p) {
    stamp = p;
    canvas.classList.toggle('stamping', !!p);
    if (!p) patternSel.value = '';
  }

  const playBtn = $('play');
  function setRunning(on) {
    running = on;
    pending = 0;
    playBtn.textContent = on ? '⏸ Pausa' : '▶ Play';
  }
  playBtn.addEventListener('click', () => setRunning(!running));
  $('step').addEventListener('click', stepOnce);
  $('random').addEventListener('click', randomize);
  $('clear').addEventListener('click', clearBoard);
  $('fit').addEventListener('click', fit);
  $('wrap').addEventListener('change', (e) => { life.wrap = e.target.checked; });
  sizeSel.addEventListener('change', () => newBoard(+sizeSel.value));

  // Give the keyboard back to the board after using a button or a list, so a
  // later Space doesn't press that button again or open the list.
  const bar = document.querySelector('.bar');
  bar.addEventListener('click', (e) => { if (e.target.closest('button')) e.target.closest('button').blur(); });
  bar.addEventListener('change', (e) => { if (e.target.matches('select, input[type="checkbox"]')) e.target.blur(); });

  function stepOnce() { setRunning(false); life.step(1); dirty = true; }
  function randomize() { life.randomize(+density.value); dirty = true; }
  function clearBoard() { life.clear(); dirty = true; }

  function newBoard(size) {
    const previous = life.width;
    try {
      life.resize(size, size);
    } catch (e) {
      alert(e.message);
      if (previous) {
        life.resize(previous, previous);
        sizeSel.value = String(previous);
      }
    }
    randomize();
    fit();
  }

  // ---- RLE dialog --------------------------------------------------------
  const dialog = $('rle-dialog');
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
      rleError.textContent = err.message;
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
      const cells = life.width * life.height;
      stats.textContent =
        `gen ${life.generation.toLocaleString('es')} · ${genRate.toFixed(0)} gen/s · ` +
        `${(genRate * cells / 1e9).toFixed(2)} Gceldas/s · zoom ${view.zoom >= 1 ? view.zoom.toFixed(1) : '1/' + (1 / view.zoom).toFixed(1)}`;
    }
    requestAnimationFrame(frame);
  }

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    setRunning(false);
    fail('Se ha perdido el contexto de la GPU (¿tablero demasiado grande?). Recarga la página.');
  });

  // ---- start -------------------------------------------------------------
  newBoard(+sizeSel.value);
  window.lifer = { life, view, setRunning, fit }; // handy from the console
  requestAnimationFrame(frame);
})();
