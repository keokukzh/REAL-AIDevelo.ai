// Centralized domain models re-exported from shared types to keep a single source
// of truth between frontend and backend.
// In Docker: /app/src/models/types.ts -> /app/shared/types/models.ts (../../shared)
// In local dev: server/src/models/types.ts -> shared/types/models.ts (../../../shared)
// Using ../../shared works in both contexts after COPY shared ./shared
export * from '../../shared/types/models';