#!/usr/bin/env bash
# Installs or updates the lifer service. Run with sudo from WSL after deploy/build.sh:
#   sudo deploy/install.sh
# Idempotent: creates the system user and unit the first time, then just
# replaces the files in /opt/lifer and restarts the service.
set -euo pipefail
cd "$(dirname "$0")/.."

[ "$(id -u)" -eq 0 ] || { echo "Run with sudo" >&2; exit 1; }
[ -f dist/index.html ] || { echo "dist/ missing: run deploy/build.sh first" >&2; exit 1; }

id lifer >/dev/null 2>&1 || useradd --system --no-create-home --home-dir /opt/lifer --shell /usr/sbin/nologin lifer

# root owns the files, the service can only read them
install -d -o root -g lifer -m 750 /opt/lifer
find /opt/lifer -mindepth 1 -delete
cp -r dist/. /opt/lifer/
chown -R root:lifer /opt/lifer
chmod -R u=rwX,g=rX,o= /opt/lifer

install -m 644 deploy/lifer.service /etc/systemd/system/lifer.service
systemctl daemon-reload
systemctl enable lifer >/dev/null 2>&1
systemctl restart lifer
systemctl --no-pager --lines=0 status lifer
