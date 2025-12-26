# Developer Setup (VS Code)

This guide helps you get productive quickly in VS Code for the AIDevelo.ai project.

## Prerequisites
- Node.js >= 20
- npm >= 9

## Recommended Extensions
- ESLint (dbaeumer.vscode-eslint)
- Prettier (esbenp.prettier-vscode)
- Stylelint (stylelint.vscode-stylelint)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)
- Cloudflare DevTools (alessandrobenassi.cloudflare-devtools)

Extensions are auto-recommended via .vscode/extensions.json.

## Editor Settings
Already configured in .vscode/settings.json:
- Format on save using Prettier
- ESLint validation for TS/JS/TSX

## Install dependencies
npm install

## Common commands
- Dev server: npm run dev (http://localhost:4000)
- Unit tests (watch): npm run test:watch
- Lint: npm run lint
- Build: npm run build

Tasks are available in VS Code (Terminal > Run Task):
- Dev Server
- Tests: Watch
- Lint

## Debugging
Use the launch configuration "Launch Chrome to Vite (http://localhost:4000)" from the Run and Debug panel. This launches Chrome attached to the Vite dev server.

## Linting & Formatting
- ESLint: Enforces TypeScript best practices and custom rules (e.g., prevents /api prefix in apiClient calls)
- Prettier: Enforces consistent formatting

## Folder Structure (frontend)
- src/components/webdesign/hero: Ultra hero components (3D + fallback)
- src/pages/WebdesignPage.tsx: Webdesign page wiring (lazy Ultra hero, fallbacks)
- src/styles: CSS tokens and terminal styles

## Notes
- Suspense uses an animated loader while Ultra hero loads; errors render the standard WebdesignHero.
- Debug overlay components are not rendered in production; terminal styles are only used for UI elements, not overlays.
