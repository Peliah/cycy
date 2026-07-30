-- Shell-first onboarding: AI enrich phase + content version for UI refresh
ALTER TYPE "BootstrapPhase" ADD VALUE IF NOT EXISTS 'ENRICHING';

ALTER TABLE "Curriculum" ADD COLUMN IF NOT EXISTS "contentVersion" INTEGER NOT NULL DEFAULT 1;
