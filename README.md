# Leroy's Umbrel App Store

Community packages maintained by [LeroyZanzibar](https://github.com/LeroyZanzibar).
This is an independent community store, not an official Umbrel app-store endorsement.

## Add this store

1. Open **App Store** on your Umbrel.
2. Open **⋯ → Community App Stores**.
3. Add `https://github.com/LeroyZanzibar/Leroys-umbrel-app-store`.
4. Open **Leroy's App Store**, choose **Sol Diagnostics**, and install.

No terminal, GitHub account, or registry credentials are required to pull the public image.
This package opens on port **3090**; the standalone Docker edition defaults to
3080. Check your other custom apps for a 3090 conflict before installing.
This package does not import standalone data.

## Sol Diagnostics

- App ID: `leroys-sol-diagnostics` (keep this stable across updates).
- Source: https://github.com/LeroyZanzibar/sol-diagnostics
- Image: `ghcr.io/leroyzanzibar/sol-diagnostics`
- Browser launch port: **3090** through Umbrel's app proxy (internal server port 3080).
- Username: **admin**.
- Password: use the app password displayed by Umbrel. It is unique to the Umbrel
  installation/app ID, is not committed here, and remains stable across restarts/updates.
- Umbrel's **Require Umbrel login** protection remains enabled by default.
- Persistent data: `${APP_DATA_DIR}/data/storage`, mounted at `/data` in the app.
- No host Docker socket, host network, privileged mode, or extra capabilities.

The first install starts empty. The app has a local SQLite database and object files;
site settings, imported files, reviews, and analyses stay on your Umbrel. Some map,
postal-code, and font requests may use external services.

The package runs the image's Node process as UID/GID 1000 with a read-only container
filesystem, a limited `/tmp`, dropped Linux capabilities, and `no-new-privileges`.
The upstream linter's security-option warning is intentional: that option **reduces**
privileges rather than granting host access.

## Updates

Releases are deliberate, not automatic deployments of arbitrary source commits:

1. Test a new source version in the application repository.
2. Publish its versioned image for both `linux/amd64` and `linux/arm64`.
3. Verify anonymous pull access and successful container smoke tests.
4. Update this app's `docker-compose.yml` to the new tag **and multiarchitecture
   index digest**; update `version`, `releaseNotes`, and the versioned icon URL in
   `umbrel-app.yml`.
5. Push the reviewed store change to `main` and verify **Validate Umbrel packages**.
6. Refresh/check the community store on Umbrel and install the offered update.

The store workflow uses a pinned copy of Umbrel's official package linter, checks
image digests and public multiarchitecture availability, and compares launch ports
against that official-store snapshot. Refresh the pinned reference periodically.

### Backup and rollback

Before updating important data, stop the app and back up **the entire persistent
storage directory together** (SQLite plus object files), or use a verified Umbrel
backup that includes this app. Keep the previous image digest and manifest.
Do not run the source repository's standalone Compose backup/restore scripts against
an Umbrel-managed installation: they address a different Compose project and volume.

Database migrations run at startup. Reverting only the image after a schema change
may not be safe; restore a matching pre-update data backup as well. Never delete
app data as an update workaround.

## Verification boundary

GitHub checks verify application tests, container startup/persistence, and package
metadata/image availability. They do not replace a real Umbrel install and upgrade
check. Confirm launch/login, one real import/analysis, restart persistence, and a
subsequent version upgrade on the target device before relying on this for production.
