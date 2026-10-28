# nas-log-manager

External application for the NAS launcher: it shows only errors and warnings, filterable by source,
together with the real diagnostic file explicitly tied to the operation. Informative and success
notifications stay in the notification centre of the launcher. Every repository stands on its own
and produces an archive the launcher can install.

## Local start

Requires Node.js 24, npm and Rust/Cargo.

```bash
pnpm install
pnpm run build
pnpm run backend:dev
```

In a second terminal:

```bash
pnpm run dev
```

Vite serves the UI on `http://127.0.0.1:1420/` and forwards `api/...` to the backend over a Unix socket. `NAS_APP_SOCKET` changes the path of the socket. The backend serves only the interface and `/health`: the page asks the shell of the launcher for notifications, logs and deletions with the messages `diagnostics`, `diagnostic-log` and `remove-diagnostic`, so outside the launcher the list stays empty and says the launcher is not available.

For structure, tests and checks see [DEVELOPMENT.md](DEVELOPMENT.md). The contract for installation, search and communication with the launcher is in [APPS.md](APPS.md); packaging and release are in [NAS.md](NAS.md).
