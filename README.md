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

The default board ("Pantalla" / "Screen" in the size list) has the shape of the canvas: its longer
side is the smallest power of two that covers the longer side of the canvas in CSS pixels (between
256 and 1024), and the other side keeps the proportions of the canvas, so it fills the screen. That
gives, for example, 491×512 on a 6.8" phone, 1024×870 on a laptop and 1024×622 on a 1920×1080 monitor.
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
