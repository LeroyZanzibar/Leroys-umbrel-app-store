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
- Package/application version: **2026.11.16.1** ([release notes](https://github.com/LeroyZanzibar/sol-diagnostics/releases/tag/v2026.11.16.1)).
- Source: https://github.com/LeroyZanzibar/sol-diagnostics
- Image: `ghcr.io/leroyzanzibar/sol-diagnostics`
- Browser launch port: **3090** through Umbrel's app proxy (internal server port 3080).
- Username: **admin**.
- Password: use the app password displayed by Umbrel. It is unique to the Umbrel
  installation/app ID, is not committed here, and remains stable across restarts/updates.
- Umbrel's **Require Umbrel login** protection remains enabled by default.
- Persistent data: `${APP_DATA_DIR}/data/storage`, visible as `/data/storage` inside
  the app. The bind mount is `${APP_DATA_DIR}/data:/data`; this deliberately avoids
  Umbrel's legacy rewrite of `/data/storage` in host mount sources.
- Bulk array-model upload is not included.
- No host Docker socket, host network, privileged mode, or extra capabilities.

The first install starts empty. Shared application metadata remains in SQLite;
cumulative performance data uses a separate versioned SQLite database per site
under `/data/storage/performance/`. Source files and saved analysis results/evidence
remain in object storage. Site settings, imported files, reviews, and analyses stay
on your Umbrel. Some map, postal-code, and font requests may use external services.

The package runs the image's Node process as UID/GID 1000 with a read-only container
filesystem, a limited `/tmp`, dropped Linux capabilities, and `no-new-privileges`.
The upstream linter's security-option warning is intentional: that option **reduces**
privileges rather than granting host access.

### Release 2026.11.16.1

- CSV and JSON API imports accumulate performance data per site, with a preview
  and explicit approval before applying overlaps.
- Corrections replace only supplied matching timestamp/channel values. Omitted
  timestamps and channels remain intact, even inside the incoming date range;
  blank CSV cells and JSON `null` do not clear existing values.
- Saved analyses, pinned input revisions, evidence, and review history are retained.
  **Manage Analyses** selects current or historical results without rerunning or
  deleting them.
- **Performance issues** is now **Findings** under **Analysis**. Imports and
  **Manage Analyses** are under **Data management**.
- Findings, Summaries, Timeline, and supported exports share data-freshness filters.
  Results distinguish **Current data**, **Based on older data**, and **Freshness
  unknown** when legacy provenance or comparison inputs are insufficient. Unknown
  findings remain in **All items**, not **Current data only**.
- Failed or canceled reruns preserve the previous published result. After a failed
  first attempt, **Run analysis** uses current data and the current equipment model;
  **Retry analysis** uses that attempt's original saved inputs.

## Updates

Releases are deliberate, not automatic deployments of arbitrary source commits:

1. Test a new source version in the application repository.
2. Publish its versioned image for both `linux/amd64` and `linux/arm64`.
3. Verify anonymous pull access and successful container smoke tests.
4. Update this app's `docker-compose.yml` to the new tag **and multiarchitecture
   index digest**; update `version`, `releaseNotes`, and the versioned icon URL in
   `umbrel-app.yml`.
5. Push the reviewed store change to `main` and verify **Validate Umbrel packages**.
6. Refresh/check the community store on Umbrel and, after a complete backup,
   install the offered update.

Publishing this store entry does not install an update or migrate data on your
device. Back up all app storage before performing the actual update or migration.

The store workflow uses a pinned copy of Umbrel's official package linter, checks
image digests and public multiarchitecture availability, and compares launch ports
against that official-store snapshot. Refresh the pinned reference periodically.

### Existing data and migration

If a site has a retained legacy CSV but no cumulative performance-data revision,
open **Data management → Performance data**, review the migration preview, and
explicitly apply it before uploading unrelated cumulative data. This migration
retains the original CSV/import record, saved analyses, evidence, and reviews;
it does not silently replace the retained source.

Invalid or ambiguous legacy input may need correction before migration can
complete. Source files already deleted by an older version cannot be reconstructed
by this update. Legacy analyses without sufficient provenance remain **Freshness
unknown**, rather than being treated as current.

### Backup and rollback

Before the actual app update or migration, stop the app and back up **the entire
`${APP_DATA_DIR}/data/storage` directory together**: the shared application SQLite
database, every per-site database under `performance/`, their required SQLite state
files, and all object files (including retained sources, results, and evidence).
Alternatively, use a verified Umbrel backup that includes all of this app storage.
Verify that the backup can be restored, and keep the previous image digest and manifest.
Do not run the source repository's standalone Compose backup/restore scripts against
an Umbrel-managed installation: they address a different Compose project and volume.

Schema migrations run at startup; legacy CSV migration still requires the explicit
preview/apply above. Reverting only the image after a schema change may not be safe;
restore a matching pre-update data backup as well. Never delete app data as an update
workaround. Use one application instance per storage directory. Retained revisions
and evidence consume disk; this release adds no automatic retention cleanup.

## Verification boundary

GitHub checks verify application tests, container startup/persistence, and package
metadata/image availability. They do not replace a real Umbrel install and upgrade
check. Confirm launch/login, one real import/analysis, restart persistence, and a
subsequent version upgrade on the target device before relying on this for production.
For 2026.11.16.1, also verify retained-CSV migration and full-data restoration on the
target device; publishing this listing is not evidence of a tested live upgrade,
migration, or restore.
