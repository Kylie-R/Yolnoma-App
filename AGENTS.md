# AGENTS.md — Yolnoma

Tauri v2 + React + TypeScript desktop app. Language: Code, comments, and commits in English. Default UI language is English; the app is localized into other languages.

## Commands

- Do not use the `bun run td` (Tauri dev) command. The application does not run in the browser, and Tauri calls lack a browser-compatible fallback mechanism.
- Validation: `bun run lint && bun run build` (mandatory after every task)

## Structure

- `src/features/<name>/` — feature modules; `src/shared/{ui,hooks,utils}` — shared code
- Wherever tabs are used, use only `useHashTab` (src/shared/hooks/)
- Types live in `types.ts`; if a `.tsx` file exceeds ~700 lines, propose splitting it

## Rules

- Before writing new code, search shared/ and existing hooks; do not duplicate logic
- `any` is forbidden; use try/catch + UI error states for async/fs/API operations
- Logic goes in hooks (`useXxx.ts`); components are View-only
- Don't add unnecessary dependencies; never commit `.env` or keys; check path traversal in Tauri fs operations
- If something is unclear, don't guess — ask
- Comments: if a code comment is needed, it must be written in English (no Uzbek or other languages). Comment only the "why", not the obvious "what".
- i18n: never hardcode user-facing strings in components. Add them to the English locale file first (`src/shared/i18n/...`), then use the translation function (e.g. `t('key')`). Don't edit other locale files unless asked; mark missing keys instead of guessing translations.

## Workflow

Understand → Inspect/Search → Reuse → (Plan for large changes) → Implement → Validate → Report → Commit

## Git

- One task = one atomic commit, `type(scope): description` (feat/fix/refactor/style/docs/test/chore)
- `CHANGELOG.md` categories: Added, Improved, Fixed, Changed, Removed

---

| Context version | Updated    | By                                                   |
| :-------------- | :--------- | :--------------------------------------------------- |
| **0.7**         | 2026-09-30 | **([hexjasur](https://github.com/hexjasur))Yolnoma** |

---
