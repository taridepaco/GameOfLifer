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
