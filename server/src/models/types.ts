// Centralized domain models re-exported from shared types to keep a single source
// of truth between frontend and backend.
// Shared types are copied to src/shared during build (via prebuild script or Docker COPY)
// Path: src/models/types.ts -> src/shared/types/models.ts (../shared)
export * from '../shared/types/models';