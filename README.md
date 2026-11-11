# Game of Lifer

Conway's game of life running on the GPU of the browser (WebGL2): boards of up to
16384×16384 cells (268 M) in real time.

Live: <https://taridepaco.github.io/GameOfLifer/> (linked from the island at <https://taridepaco.github.io/>)

| Path | What |
|---|---|
| `web/` | The simulator: `life.js` (GPU engine), `ui.js` (controls, language, theme), `index.html`, `style.css`. No dependencies. |
| `GameOfLife_main.py` | Reference NumPy engine, used by the tests to check the shader. |
| `GameOfLife.m` | The original MATLAB version. |
| `deploy/` | Builds `dist/` (what gets published) and installs it on the home server. See [DEPLOY.md](DEPLOY.md). |
| `.github/workflows/pages.yml` | Publishes `dist/` to GitHub Pages with every push to `main`. |

## Look

The page uses the shared design system of [taridepaco.github.io](https://taridepaco.github.io/):
`web/system.css` (tokens and pieces) and `web/theme.js` (light, dark or system theme) are unmodified
copies from [that repository](https://github.com/taridepaco/taridepaco.github.io) and are not edited
here. What is specific to the simulator (panel, dropdowns, slider, edge selector, keys, board frame,
RLE dialog) is in `web/style.css`, built with the same tokens. The panel, slider and segmented
selector are the same as in [Boider](https://github.com/taridepaco/Boider).

The board is drawn by WebGL and does not inherit CSS, so `ui.js` reads the tokens and redraws when the
theme changes: dead cells on `--surface`, the area outside the board in `--bg`, live cells in the
"bosque" (light) and "prado" (dark) greens of the shared palette.

The page is in Spanish and English (`?lang=es|en`). The language and theme chosen are shared with the
rest of taridepaco.github.io.

On phones (up to 720 px wide) the screen comes first:

- The top bar fits in one row: just the back arrow (its text is still there for screen readers), the
  title and the language switch. The "Simulador" tag is hidden and the theme button moves into the
  panel, under "Aspecto".
- Under the board, a deck with the three most used controls: play/pause, step and random.
- The panel starts folded and opens as a sheet over the bottom of the board, without resizing it.
  Screens lower than 500 px (phones in landscape) also start with the panel folded.
- The status line drops the Gcells/s figure to fit in one row.

## Board size

The default board ("Pantalla" / "Screen" in the size list) has the shape of the canvas and is made
of cells of a whole number of device pixels, drawn at exactly that scale and aligned with the pixels:
every cell is an exact square and there is no moiré. (A board drawn at a scale close to, but not
exactly, one cell per pixel showed a pattern of blocks.)

- Cell size `c`: the device pixels of the longer side of the canvas divided by a target number of
  cells and rounded. The target is the smallest power of two that covers the longer side in CSS
  pixels, between 256 and 1024. A computer gets `c = 1`, a phone 2 or 3.
- Board: the device pixels of the canvas divided by `c`, in each direction.
- It is computed when the page starts, once the web fonts are in (they change the size of the
  canvas; 1.5 s at most), and again whenever "Pantalla" is picked.

| Window | Canvas (device px) | Board | Pixels per cell |
|---|---|---|---|
| 6.8" phone (366×568 CSS px, density 3.5) | 1159×1208 | 579×604 | 2 |
| iPhone 13 | 1065×1323 | 355×441 | 3 |
| Laptop 1100×760 | 737×626 | 737×626 | 1 |
| Laptop 1100×760 at 125% | 921×783 | 921×783 | 1 |
| Monitor 1920×1080 | 1557×946 | 778×473 | 2 |
| 2560×1440 at 150% | 3296×1959 | 1098×653 | 3 |

"Encajar" (F) also uses a whole number of pixels per cell when the board fits at one pixel per cell
or more and still fills at least 3/4 of the canvas. Larger boards are fitted at 98% at any scale.
The square sizes, from 256² up to what the GPU allows, are still in the list. The simulation starts
running when the page opens.

## Performance

Measured on an RTX 2070 (Chrome/ANGLE D3D11):

| Board | Generations/s | Cells/s |
|---|---|---|
| 2048² | ~870 | 3.7 G |
| 4096² | ~970 | 16 G |
| 8192² | ~400 | 27 G |
| 16384² | ~106 | 28 G |

The NumPy reference does about 0.4 G cells/s.

## Controls

Space play/pause · N one generation · R random · C clear · F fit the board ·
click to draw or erase · right, middle or Shift drag to pan · wheel to zoom ·
pick a pattern (or paste RLE) and click to place it, Ctrl+click to place several · Esc cancels.

## Develop

```bash
python3 -m http.server 8090 --bind 127.0.0.1 --directory web
uv run pytest                                   # reference engine tests
uv run python GameOfLife_main.py --size 2048    # NumPy benchmark
```

## Deploy

`deploy/build.sh` builds `web/` into `dist/`, and that same `dist/` is published everywhere:
GitHub Pages (by `.github/workflows/pages.yml`, with every push to `main`) and the home server
(`lifer.taridepaco.com.es`, by `deploy/install.sh`). Details in [DEPLOY.md](DEPLOY.md).
