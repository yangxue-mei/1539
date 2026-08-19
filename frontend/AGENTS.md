# TaroReact template

This is a **complete runnable Taro H5/WeApp project**. The bootstrap starts dependency
preparation in the background immediately after copying it. Do not rebuild the scaffold,
reinstall dependencies, or replace build configuration; replace application content within
the provided structure instead.

## 1. Workflow and Tech Stack

Taro 4, React 18, TypeScript, Tailwind CSS 4, weapp-tailwindcss and
`@nutui/icons-react-taro@3.0.1` compile one source tree for H5 and WeApp.
Start from the existing template, preserve its locked dependencies and use the
workspace `skills/wx-miniapp/SKILL.md` for the full generation contract.

## 2. Stable Starter and Read-only Example

The starter at `src/pages/index/index.tsx` is a one-sentence health probe; do not edit it during
normal vibe coding. Add business pages separately and register the real entry first
in `src/app.config.ts`. When component usage is unclear, read the unregistered,
read-only `src/examples/component-showcase.tsx`; copy only the needed pattern into
the business page rather than editing or registering the showcase.

## 3. File Map and Entry Structure

- `src/app.ts`: application entry, lifecycle and ErrorBoundary.
- `src/app.config.ts`: page registration and mini-program configuration.
- `src/pages/`: page implementation directory; keep `index/` as the stable health probe and add business pages as siblings.
- `src/examples/component-showcase.tsx`: unregistered, read-only component usage reference.
- `src/components/app-shell.tsx`: safe-area page frame and default document scroll.
- `src/components/app-icon.tsx`: verified common NutUI icon exports.
- `src/components/ui/`: reusable primitive components and empty/loading/error states.
- `src/lib/storage.ts`: Taro storage helpers; `src/lib/runtime-log.ts`: error log.
- `config/index.ts`: Taro build config for H5 and WeApp; `package.json`: start/build/verify tooling.

## 4. Included Capabilities

Semantic Tailwind/tokens and NutUI icons are ready. AppShell preserves safe-area
spacing and the global stylesheet supplies the `.taro_page` H5 scrollbar default.
AppErrorBoundary, UI states, Taro storage, local TabBar icon assets, bounded acceptance examples and a
controlled H5 interaction example are included, along with dev/start, build and
verification commands.

## 5. Cross-Platform Constraints

- Use `@tarojs/components` and Taro APIs, never raw HTML or browser-only APIs.
- Scope global tokens to `page, html, body`; use static class literals that Tailwind can scan.
- Preserve safe-area spacing for fixed controls, prevent root horizontal scroll and let the template own default page scroll; only use `ScrollView` for genuine long WeApp content.
- Import page icons by verified name from `@nutui/icons-react-taro`; use local PNG for native tabBar and no emoji in product navigation.
- Reuse `EmptyState` and `AppIcon` before hand-writing equivalents. Taro `Text` is inline on H5, so title/description rows must stay in a `flex flex-col` parent or use block `View`; sibling `Text` margins do not create rows. Use `AppIcon`/NutUI `Check` for completion and action icons, never a text glyph or 文本符号 such as `✓`.

## 6. Efficient Batch Implementation

Work in batches: types/utils, reusable components, page components, then page
config/CSS/app registration. Do not validate after individual files or batches. Finish all planned
writes first, then run **`basic`** once. Add bounded **requirement-derived acceptance** from
deterministic user-provided examples. At least one acceptance test must import and exercise a
`src/` business module; literal-only tests do not count. The verifier saves
`acceptance-smoke.json`, compiles WeApp, and checks core DOM, blocking console errors, and horizontal
overflow at 390×844. It does not run a business Playwright scenario. Reuse the Pod-local
dependency receipt: after `local_hit`,
`snapshot_hit`, `installed` or `reused`, 不得再次 install/probe.

## 7. Basic Verify Command

Use exactly one command after implementation; it owns dependency wait/reuse, static,
acceptance, WeApp build, mechanical H5 start/check, and atomic evidence:

```sh
python3 skills/wx-miniapp/scripts/verify-miniapp.py \
  --workspace-root . \
  --scope basic
```

The verifier stops at the first hard failure and does not retry. Make one grouped repair,
then rerun this command once. Do not run subordinate checks or `pnpm build:weapp` directly.

**`release`** is operator-only: it requires `--scenario`, starts from **`basic`** without rebuilding
WeApp, then adds one primary interaction through `run-h5-interaction.mjs`, production H5,
360/390/430 evidence, `check-weapp-artifact.py`, and WeApp runtime. The controlled runner injects
`page` and recorder APIs; never create `/workspace/tmp` scripts or `import playwright`. Recorder
details must be JSON-compatible. If that
runtime is unavailable it records `SKIPPED_CAPABILITY`; it never treats H5 as a WeApp PASS.
