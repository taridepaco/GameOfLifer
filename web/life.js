'use strict';
/*
 * Conway's game of life on the GPU (WebGL2).
 *
 * The board lives in two R8 textures (1 byte per cell, 0 = dead, 255 = alive)
 * used in ping-pong: each generation renders the next state from the current
 * one with a fragment shader, so nothing is copied between CPU and GPU.
 * Texture coordinates: x = column, y = row (row 0 is drawn at the top).
 */

const VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

// Toroidal board: REPEAT sampling wraps the neighbours in hardware.
const STEP_WRAP = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_inv;
out vec4 o;
void main() {
  vec2 uv = gl_FragCoord.xy * u_inv;
  float n = textureOffset(u_state, uv, ivec2(-1, -1)).r
          + textureOffset(u_state, uv, ivec2( 0, -1)).r
          + textureOffset(u_state, uv, ivec2( 1, -1)).r
          + textureOffset(u_state, uv, ivec2(-1,  0)).r
          + textureOffset(u_state, uv, ivec2( 1,  0)).r
          + textureOffset(u_state, uv, ivec2(-1,  1)).r
          + textureOffset(u_state, uv, ivec2( 0,  1)).r
          + textureOffset(u_state, uv, ivec2( 1,  1)).r;
  float c = texture(u_state, uv).r;
  int k = int(n + 0.5);
  o = vec4((k == 3 || (k == 2 && c > 0.5)) ? 1.0 : 0.0, 0.0, 0.0, 1.0);
}`;

// Bounded board: cells outside are always dead.
const STEP_BOUNDED = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform ivec2 u_size;
out vec4 o;
float cell(ivec2 q) {
  return (all(greaterThanEqual(q, ivec2(0))) && all(lessThan(q, u_size))) ? texelFetch(u_state, q, 0).r : 0.0;
}
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  float n = cell(p + ivec2(-1, -1)) + cell(p + ivec2(0, -1)) + cell(p + ivec2(1, -1))
          + cell(p + ivec2(-1,  0))                          + cell(p + ivec2(1,  0))
          + cell(p + ivec2(-1,  1)) + cell(p + ivec2(0,  1)) + cell(p + ivec2(1,  1));
  float c = texelFetch(u_state, p, 0).r;
  int k = int(n + 0.5);
  o = vec4((k == 3 || (k == 2 && c > 0.5)) ? 1.0 : 0.0, 0.0, 0.0, 1.0);
}`;

const RANDOM = `#version 300 es
precision highp float;
uniform uint u_seed;
uniform float u_density;
out vec4 o;
uvec3 pcg3d(uvec3 v) {
  v = v * 1664525u + 1013904223u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  v ^= v >> 16u;
  v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y;
  return v;
}
void main() {
  uint h = pcg3d(uvec3(uvec2(gl_FragCoord.xy), u_seed)).x;
  o = vec4(float(h) * (1.0 / 4294967296.0) < u_density ? 1.0 : 0.0, 0.0, 0.0, 1.0);
}`;

// Draws the board with zoom and pan. When a pixel covers several cells it
// averages up to 4x4 samples, so zoomed-out views show density instead of
// flickering aliasing.
const DRAW = `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_size;
uniform vec2 u_canvas;
uniform vec2 u_center;
uniform float u_zoom;
uniform vec3 u_alive;
uniform vec3 u_dead;
uniform vec3 u_outside;
uniform vec3 u_grid;
out vec4 o;
void main() {
  vec2 sc = vec2(gl_FragCoord.x, u_canvas.y - gl_FragCoord.y);
  vec2 cell = u_center + (sc - 0.5 * u_canvas) / u_zoom;
  if (any(lessThan(cell, vec2(0.0))) || any(greaterThanEqual(cell, u_size))) {
    o = vec4(u_outside, 1.0);
    return;
  }
  float v;
  if (u_zoom >= 1.0) {
    v = texelFetch(u_state, ivec2(cell), 0).r;
  } else {
    float span = 1.0 / u_zoom;
    int k = int(min(ceil(span), 4.0));
    float acc = 0.0;
    for (int i = 0; i < 4; i++) {
      if (i >= k) break;
      for (int j = 0; j < 4; j++) {
        if (j >= k) break;
        vec2 c = cell + (vec2(i, j) + 0.5) / float(k) * span - 0.5 * span;
        acc += texelFetch(u_state, ivec2(clamp(c, vec2(0.0), u_size - 1.0)), 0).r;
      }
    }
    v = sqrt(acc / float(k * k));
  }
  vec3 col = mix(u_dead, u_alive, v);
  if (u_zoom >= 6.0) {
    vec2 f = fract(cell) * u_zoom;
    if (min(f.x, f.y) < 1.0) col = mix(col, u_grid, 0.6);
  }
  o = vec4(col, 1.0);
}`;

function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
}

class Life {
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false });
    if (!gl) throw new Error('WebGL2 no está disponible en este navegador.');
    this.gl = gl;
    this.canvas = canvas;
    this.maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    this.wrap = true;
    this.generation = 0;
    this.width = 0;
    this.height = 0;
    this.textures = [];
    this.framebuffers = [];
    this.cur = 0;
    this.colors = {
      alive: hexToRgb('#ffb454'),
      dead: hexToRgb('#0d1117'),
      outside: hexToRgb('#05070a'),
      grid: hexToRgb('#1f2833'),
    };
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.pixelStorei(gl.PACK_ALIGNMENT, 1);
    this.programs = {
      stepWrap: this._program(STEP_WRAP),
      stepBounded: this._program(STEP_BOUNDED),
      random: this._program(RANDOM),
      draw: this._program(DRAW),
    };
    this.vao = gl.createVertexArray();
  }

  _program(fragSrc) {
    const gl = this.gl;
    const compile = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const uniforms = {};
    const count = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const name = gl.getActiveUniform(p, i).name;
      uniforms[name] = gl.getUniformLocation(p, name);
    }
    return { program: p, uniforms };
  }

  _use(prog) {
    this.gl.useProgram(prog.program);
    return prog.uniforms;
  }

  _fullscreen() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Allocates a w×h board (all dead). Throws if the GPU runs out of memory. */
  resize(w, h) {
    const gl = this.gl;
    if (w > this.maxSize || h > this.maxSize) throw new Error(`El máximo de esta GPU es ${this.maxSize}×${this.maxSize}.`);
    this._free();
    while (gl.getError() !== gl.NO_ERROR) { /* drain old errors */ }
    for (let i = 0; i < 2; i++) {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.R8, w, h);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      this.textures.push(t);
      this.framebuffers.push(fb);
    }
    const err = gl.getError();
    const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (err !== gl.NO_ERROR || !complete) {
      this._free();
      throw new Error(`No hay memoria de GPU suficiente para ${w}×${h}.`);
    }
    this.width = w;
    this.height = h;
    this.cur = 0;
    this.clear();
  }

  _free() {
    const gl = this.gl;
    this.textures.forEach((t) => gl.deleteTexture(t));
    this.framebuffers.forEach((f) => gl.deleteFramebuffer(f));
    this.textures = [];
    this.framebuffers = [];
  }

  _target(i) {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[i]);
    gl.viewport(0, 0, this.width, this.height);
  }

  clear() {
    const gl = this.gl;
    this._target(this.cur);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.generation = 0;
  }

  randomize(density, seed = (Math.random() * 0xffffffff) >>> 0) {
    const gl = this.gl;
    this._target(this.cur);
    const u = this._use(this.programs.random);
    gl.uniform1ui(u.u_seed, seed >>> 0);
    gl.uniform1f(u.u_density, density);
    this._fullscreen();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.generation = 0;
  }

  /** Advances n generations entirely on the GPU. */
  step(n = 1) {
    const gl = this.gl;
    const prog = this.wrap ? this.programs.stepWrap : this.programs.stepBounded;
    const u = this._use(prog);
    if (this.wrap) gl.uniform2f(u.u_inv, 1 / this.width, 1 / this.height);
    else gl.uniform2i(u.u_size, this.width, this.height);
    gl.uniform1i(u.u_state, 0);
    gl.activeTexture(gl.TEXTURE0);
    for (let i = 0; i < n; i++) {
      const next = 1 - this.cur;
      this._target(next);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[this.cur]);
      this._fullscreen();
      this.cur = next;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.generation += n;
  }

  /** view = {cx, cy, zoom}: board cell at the canvas centre and screen pixels per cell. */
  draw(view) {
    const gl = this.gl;
    const c = this.canvas;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, c.width, c.height);
    const u = this._use(this.programs.draw);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.textures[this.cur]);
    gl.uniform1i(u.u_state, 0);
    gl.uniform2f(u.u_size, this.width, this.height);
    gl.uniform2f(u.u_canvas, c.width, c.height);
    gl.uniform2f(u.u_center, view.cx, view.cy);
    gl.uniform1f(u.u_zoom, view.zoom);
    gl.uniform3fv(u.u_alive, this.colors.alive);
    gl.uniform3fv(u.u_dead, this.colors.dead);
    gl.uniform3fv(u.u_outside, this.colors.outside);
    gl.uniform3fv(u.u_grid, this.colors.grid);
    this._fullscreen();
  }

  /** Writes a w×h block of cells (row-major, truthy = alive) with its top-left at column x, row y. */
  write(x, y, w, h, cells) {
    const gl = this.gl;
    // clip to the board
    const x0 = Math.max(0, x), y0 = Math.max(0, y);
    const x1 = Math.min(this.width, x + w), y1 = Math.min(this.height, y + h);
    if (x1 <= x0 || y1 <= y0) return;
    const cw = x1 - x0, ch = y1 - y0;
    const data = new Uint8Array(cw * ch);
    for (let r = 0; r < ch; r++) {
      for (let col = 0; col < cw; col++) {
        data[r * cw + col] = cells[(r + y0 - y) * w + (col + x0 - x)] ? 255 : 0;
      }
    }
    gl.bindTexture(gl.TEXTURE_2D, this.textures[this.cur]);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, x0, y0, cw, ch, gl.RED, gl.UNSIGNED_BYTE, data);
  }

  /** Reads a block back to the CPU as 0/1 (slow: for editing and tests, not per frame). */
  read(x, y, w, h) {
    const gl = this.gl;
    const rgba = new Uint8Array(w * h * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.cur]);
    gl.readPixels(x, y, w, h, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const out = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) out[i] = rgba[i * 4] > 127 ? 1 : 0;
    return out;
  }

  /** Blocks until the GPU has finished all queued work (for benchmarks). */
  finish() {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.cur]);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
}

/** Parses an RLE pattern (https://conwaylife.com/wiki/Run_Length_Encoded). */
function parseRLE(text) {
  let w = 0, h = 0;
  const body = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^x\s*=\s*(\d+)\s*,\s*y\s*=\s*(\d+)/i);
    if (m) { w = +m[1]; h = +m[2]; continue; }
    body.push(line);
  }
  const rows = [[]];
  let count = '';
  for (const ch of body.join('')) {
    if (ch >= '0' && ch <= '9') { count += ch; continue; }
    const n = count ? +count : 1;
    count = '';
    if (ch === '!') break;
    if (ch === '$') { for (let i = 0; i < n; i++) rows.push([]); continue; }
    if (/\s/.test(ch)) continue;
    const row = rows[rows.length - 1];
    for (let i = 0; i < n; i++) row.push(ch === 'b' || ch === '.' ? 0 : 1);
  }
  w = Math.max(w, ...rows.map((r) => r.length));
  h = Math.max(h, rows.length);
  if (!w || !h) throw new Error('RLE vacío o no válido.');
  const cells = new Uint8Array(w * h);
  rows.forEach((r, y) => r.forEach((v, x) => { cells[y * w + x] = v; }));
  return { w, h, cells };
}

const PATTERNS = {
  'Planeador': 'x = 3, y = 3\nbob$2bo$3o!',
  'Nave ligera (LWSS)': 'x = 5, y = 4\nbo2bo$o4b$o3bo$4o!',
  'R-pentominó': 'x = 3, y = 3\nb2o$2o$bo!',
  'Bellota': 'x = 7, y = 3\nbo5b$3bo3b$2o2b3o!',
  'Púlsar': 'x = 13, y = 13\n2b3o3b3o2b2$o4bobo4bo$o4bobo4bo$o4bobo4bo$2b3o3b3o2b2$2b3o3b3o2b$o4bobo4bo$o4bobo4bo$o4bobo4bo2$2b3o3b3o!',
  'Cañón de Gosper': 'x = 36, y = 9\n24bo11b$22bobo11b$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o14b$2o8bo3bob2o4bobo11b$10bo5bo7bo11b$11bo3bo20b$12b2o!',
};

window.Life = Life;
window.parseRLE = parseRLE;
window.PATTERNS = PATTERNS;
