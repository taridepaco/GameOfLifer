# Game of Lifer

Conway's game of life running on the GPU of the browser (WebGL2): boards of up to
16384×16384 cells (268 M) in real time.

Live: <https://lifer.taridepaco.com.es>

| Path | What |
|---|---|
| `web/` | The simulator: `life.js` (GPU engine), `ui.js` (controls), `index.html`, `style.css`. No dependencies, no build needed to try it. |
| `GameOfLife_main.py` | Reference NumPy engine, used by the tests to check the shader. |
| `GameOfLife.m` | The original MATLAB version. |
| `docs/` | Landing page (GitHub Pages). |
| `deploy/` | Build script, systemd unit and install script for the home server. |

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

Served from the home server (WSL2, `Ubuntu-24.04`) through the Cloudflare tunnel `viser`:

- subdomain `lifer.taridepaco.com.es` → `http://localhost:8003`
- systemd unit `lifer.service`, user `lifer`, files in `/opt/lifer` (read-only, owned by root)
- static files served by `python3 -m http.server` bound to 127.0.0.1

Update after changing `web/` (from WSL, in the repo):

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

Roll back: remove the ingress entry and restart `cloudflared`, `sudo systemctl disable --now lifer`,
and delete the `lifer` CNAME in the Cloudflare dashboard.
