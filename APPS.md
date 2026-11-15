# Contract of nas-log-manager with the NAS launcher

The contract every application shares with the launcher (package, manifest, permissions, frame
protocol, launcher socket and providers) is `docs/development/external_apps/APPS.md` in the
nas-launcher repository, and the bridge is the one of `@valeriogc/nas-base-app`. This file keeps
only what is specific to nas-log-manager, which builds and releases on its own.

## Identity

- id `nas-log-manager`, category `system`, system application
- permissions none beyond the template

## Specific to this application

Application-to-shell messages are `ready`, `notify`, `open`, `describe`, `pick-files`, and the nas-log-manager-only `diagnostics`, `diagnostic-log` and `remove-diagnostic`. The shell returns `context`, `described` notification labels, `pick-files-result`, and `<request>-result` with `{ requestId, success, data?, error? }` for the three requests of nas-log-manager, which it performs with the session of the console. The `open` request may carry `location`, a query string beginning with `?` and at most 2048 characters. The common TypeScript contract, the transport (`createNasShell`) and the Vue lifecycle (`useNasLauncherContext`) live in the shared library `@valeriogc/nas-base-app`. No application imports launcher source files.

The commands that check the repository are in [DEVELOPMENT.md](DEVELOPMENT.md).
