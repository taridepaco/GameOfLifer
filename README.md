# Game of Lifer

Conway's game of life running on the GPU of the browser (WebGL2): boards of up to
16384×16384 cells (268 M) in real time.

Live: <https://taridepaco.github.io/GameOfLifer/> (linked from the island at <https://taridepaco.github.io/>)

| Path | What |
|---|---|
| `docs/` | The simulator, served as is by GitHub Pages: `life.js` (GPU engine), `ui.js` (controls, language, theme), `index.html`, `style.css`. No dependencies, no build. |
| `GameOfLife_main.py` | Reference NumPy engine, used by the tests to check the shader. |
| `GameOfLife.m` | The original MATLAB version. |
| `deploy/` | Build script, systemd unit and install script for the old home-server copy (being retired). |

## Look

The page uses the shared design system of [taridepaco.github.io](https://taridepaco.github.io/):
`docs/system.css` (tokens and pieces) and `docs/theme.js` (light, dark or system theme) are unmodified
copies from [that repository](https://github.com/taridepaco/taridepaco.github.io) and are not edited
here. What is specific to the simulator (panel, dropdowns, slider, edge selector, keys, board frame,
RLE dialog) is in `docs/style.css`, built with the same tokens. The panel, slider and segmented
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
python3 -m http.server 8090 --bind 127.0.0.1 --directory docs
uv run pytest                                   # reference engine tests
uv run python GameOfLife_main.py --size 2048    # NumPy benchmark
```

## Deploy

GitHub Pages publishes `docs/` from `main` (*Settings → Pages → Deploy from a branch → main → /docs*),
so every push to `main` updates <https://taridepaco.github.io/GameOfLifer/>. All paths are relative.
`docs/.nojekyll` skips the Jekyll step.

### Old home-server copy (being retired)

Until it is switched off, the same files are also served from the home server (WSL2, `Ubuntu-24.04`)
through the Cloudflare tunnel `viser`:

- subdomain `lifer.taridepaco.com.es` → `http://localhost:8003`
- systemd unit `lifer.service`, user `lifer`, files in `/opt/lifer` (read-only, owned by root)
- static files served by `python3 -m http.server` bound to 127.0.0.1

Update after changing `docs/` (from WSL, in the repo):

```bash
deploy/build.sh && sudo deploy/install.sh
```

`build.sh` adds a content hash to the CSS/JS URLs, because Cloudflare caches them for hours.

First-time setup, besides `install.sh`:

1. In `/etc/cloudflared/config.yml`, before the final `- service: http_status:404`:
   ```yaml
     - hostname: lifer.taridepaco.com.es
       service: http://localhost:8003
   ```
   then `cloudflared tunnel ingress validate --config /etc/cloudflared/config.yml` and `sudo systemctl restart cloudflared`.
2. DNS: `cloudflared tunnel route dns viser lifer.taridepaco.com.es` (already done).

Switch it off (once GitHub Pages is serving the new page): remove the ingress entry and restart
`cloudflared`, `sudo systemctl disable --now lifer`, and delete the `lifer` CNAME in the Cloudflare
dashboard. Then `deploy/` can be deleted from this repository.
