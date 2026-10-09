# AGENTS.md

## Project

- Node.js package.
- Built with: React.
- Language: TypeScript.

## Package manager

- Use `npm` for this workspace. The lockfile is `package-lock.json`.
- Run package scripts with `npm run <script>`.

## Commands

```bash
npm run test         # run tests
```

No linter, formatter, test runner is configured.

## Architecture

- Project: portfolio.

## Source entry points

- `src/index.js` (16 lines).
- `src/app.js` (26 lines).

## Testing and launch

- Test with `npm run test` (react-scripts test).

## Key Conventions

- Components use JSX/TSX; prefer functional components.

## Comment style

- Never place comments on the first two lines of a source file; start with imports or declarations.
- Prefer concise section headings such as `// ── Constants ──` or a three-line banner for major sections so files remain easy to scan.
- Use JSDoc blocks only when an API, intent, edge case, or constraint needs explanation; do not restate the code.

## Caveats

- No linter detected — no `lint` script, no ESLint config.
- No formatter detected — no Prettier config or format script.
- `node_modules/` is not listed in `.gitignore`.

## Boundaries

- Prefer existing local patterns and helper APIs before adding new abstractions.
- Keep generated, packaged, and runtime asset boundaries intact; do not move files across host/webview ownership without updating build and packaging config.
