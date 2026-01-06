# Retell Integration (scaffold)

This document describes the minimal Retell integration added as a scaffold.

Files added:

- `src/retell/loadRetellWidget.ts` — loader that injects the widget script when `VITE_RETELL_WIDGET_URL` is set.
- `src/hooks/useRetell.ts` — small hook that calls the backend session endpoint `/api/retell/session`.
- `src/components/retell/RetellCallbackWidget.tsx` — React wrapper that initializes the vendor widget if present.
- `server/src/services/retellService.ts` — service to call Retell API (uses `RETELL_API_KEY`).
- `server/src/controllers/retellController.ts` — express handlers.
- `server/src/routes/retellRoutes.ts` — routes to mount under `/api/retell`.

Env vars:

- Frontend: `VITE_RETELL_WIDGET_URL` (public URL to vendor widget script)
- Backend: `RETELL_API_KEY` (secret) and `RETELL_API_BASE` (API base URL)

Do NOT commit secrets. For local testing, create `server/.env.local` (ignored) and set `RETELL_API_KEY`.

Next steps to enable fully:

1. Create a branch `feature/retell-scaffold` and commit the scaffold.
2. Mount the routes in `server/src/app.ts` / central router: `app.use('/api/retell', retellRoutes)`.
3. Configure hosting environment with `RETELL_API_KEY` (Render/Vercel secrets). Do not add keys to git.
4. Replace the placeholder `RETELL_API_BASE` and `VITE_RETELL_WIDGET_URL` with vendor values.
