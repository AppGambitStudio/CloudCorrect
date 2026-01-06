-- Migration: Add S3 and NETWORK to the Checks service enum
-- Postgres does not allow ALTER TYPE ... ADD VALUE inside a transaction block in some versions,
-- so we run these as separate statements.

ALTER TYPE "enum_Checks_service" ADD VALUE 'S3';
ALTER TYPE "enum_Checks_service" ADD VALUE 'NETWORK';
