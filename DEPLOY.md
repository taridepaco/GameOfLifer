# Deploy

Game of Lifer is a static site. `deploy/build.sh` builds it into `dist/`, and that same `dist/` is
published everywhere:

| Where | URL | How it is updated |
|---|---|---|
| GitHub Pages | https://taridepaco.github.io/GameOfLifer/ | On its own, with every push to `main` (`.github/workflows/pages.yml`). |
| Home server | https://lifer.taridepaco.com.es | By hand: `deploy/build.sh && sudo deploy/install.sh`. |

`deploy/build.sh`, `deploy/install.sh` and `.github/workflows/pages.yml` are common to every
taridepaco site and are copied from [taridepaco.github.io](https://github.com/taridepaco/taridepaco.github.io):
they are not edited here.

## Build

```sh
deploy/build.sh                                   # web/ → dist/
python3 -m http.server 8000 --directory dist      # to try the result
```

`dist/` is not committed. Everything but `index.html` goes under `v/<hash>/`, a directory named after
the content, and `index.html` points there. Every change gives new URLs, so no cache mixes two
versions: GitHub Pages keeps files for 10 minutes and Cloudflare keeps CSS and JS for hours.

All paths are relative, so `dist/` works the same at the root of a domain as under a subpath such as
`/GameOfLifer/`.

## GitHub Pages

- In every pull request the workflow builds the site but does not publish it.
- With every push to `main`, or by hand from *Actions → Pages → Run workflow*, it also publishes `dist/`.
- If the build fails, nothing is published.

One-time setting: *Settings → Pages → Build and deployment → Source: GitHub Actions*.

The NumPy tests (`uv run pytest`) check the reference engine, not the site, so the workflow does not run them.

## Home server (Cloudflare tunnel on WSL)

```
Browser ── HTTPS ── Cloudflare ── tunnel ──► cloudflared (WSL) ──► http://localhost:8003
                                                                   python3 -m http.server on 127.0.0.1
```

- **Service:** `deploy/lifer.service`. System user `lifer` and systemd isolation.
- **Files served:** `/opt/lifer`, a copy of `dist/`, owned by root and only readable by the service.
- **Port:** `8003`, on `127.0.0.1` only.

### Install or update

From WSL, at the root of the repository:

```sh
git pull
deploy/build.sh && sudo deploy/install.sh
```

`install.sh` creates the user and the unit the first time. After that it only replaces the files and
restarts the service.

### First time: tunnel and DNS

Replace `<tunnel>` with the name of your tunnel (`cloudflared tunnel list`).

1. Check that the port is free with `ss -ltn | grep ':8003 ' || echo free`. If it is taken, pick
   another one and change it in `deploy/lifer.service` and in the tunnel entry.
2. Add the entry to `/etc/cloudflared/config.yml` **before** the 404 rule, without touching the others:

   ```yaml
   ingress:
     # ...your other entries...
     - hostname: lifer.taridepaco.com.es
       service: http://localhost:8003
     - service: http_status:404
   ```

3. Validate, create the DNS record (as your user, without sudo) and restart the tunnel:

   ```sh
   cloudflared tunnel ingress validate --config /etc/cloudflared/config.yml
   cloudflared tunnel route dns <tunnel> lifer.taridepaco.com.es
   sudo systemctl restart cloudflared
   curl -sI https://lifer.taridepaco.com.es/ | head -1
   ```

### Switch it off

1. Remove the `lifer` entry from `/etc/cloudflared/config.yml` and run `sudo systemctl restart cloudflared`.
2. `sudo systemctl disable --now lifer && sudo rm /etc/systemd/system/lifer.service`
3. `sudo rm -rf /opt/lifer && sudo userdel lifer`
4. Delete the `lifer` CNAME record in the Cloudflare dashboard.

The scripts in `deploy/` stay in the repository, to install it again on this or another machine.
