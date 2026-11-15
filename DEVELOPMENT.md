# Development of nas-log-manager

The Vue/TypeScript UI is in `src/`; the Rust/Axum backend is in `backend/axum/`. The shared scripts are in the library `@valeriogc/nas-base-app`; manifest and version are in `nas-app.json`, `package.json` and the Cargo metadata. `src/assets/logo.svg` is the source of the logo and the UI icons are in `src/assets/icons/`.

## Conventions

Use the Composition API with `<script setup lang="ts">`, imports through the `@/` alias, scoped SFC styles, CSS names with `_` and UI texts in the catalogues `src/i18n/locales/en.ts` and `it.ts`. Code, method names, test descriptions, this document and the README are in English. The NAS theme comes from the context of the iframe; palette, SCSS partials and shared components come from `@valeriogc/nas-base-app`. The bridge is the one of the library: `src/services/nasShell.ts` holds its only instance and asks the launcher for the diagnostics, `src/composables/useNasLauncherContext.ts` binds it to the catalogue of the app. Header, icons and details use `NasPageHeader`, `NasIcon` and `NasModal`; the sidebar of the filters stays the app's own.

The FE tests are in `src/tests/unit`, `component`, `scripts`, `e2e`, with sub-paths mirroring `src/`. The Rust tests are in `backend/axum/tests/unit` or `integration` when present.

## Dependencies and shared library

Dependencies, lockfiles and the use of `@valeriogc/nas-base-app` follow the section "For the
applications" of `DEVELOPMENT.md` in nas-base-app. In short, run `pnpm run lock:npm` after
`pnpm add`, `update` or `remove`, and keep a token with `read:packages` in `~/.npmrc` to install
the library.

## Checks

```bash
pnpm install
pnpm run format:check
pnpm run lint
pnpm run type-check
pnpm test
pnpm run test:e2e
pnpm run test:coverage
cargo fmt --manifest-path backend/Cargo.toml --all --check
cargo clippy --manifest-path backend/Cargo.toml --all-targets -- -D warnings
cargo test --locked --manifest-path backend/Cargo.toml
pnpm run nas:package
pnpm run nas:test
```

`pnpm run format` applies Prettier, ESLint and `format-sfc-spacing.mjs`; `pnpm run format:sfc` runs only the last step. The E2E tests start a dedicated Vite server on port 1432, without reusing existing servers; port 1420 stays free for development. `release:merge` creates commit and tag: try it only in an isolated temporary Git repository.

The package must work even when moved out of the checkout; do not reference `external-apps/` or files of the launcher. For the full contract see [APPS.md](APPS.md).
