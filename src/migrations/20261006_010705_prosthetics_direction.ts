import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Schema half of the sixth direction: the enum value services and cases are
 * filed under, and the SEO global's group for its page. The services
 * themselves arrive in the next migration — Postgres will not let a
 * transaction use an enum value it has just added, so the two cannot share
 * one.
 */

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_services_category" ADD VALUE IF NOT EXISTS 'prosthetics' BEFORE 'orthodontics';
  ALTER TYPE "public"."enum_cases_direction" ADD VALUE IF NOT EXISTS 'prosthetics' BEFORE 'orthodontics';
  ALTER TABLE "seo_locales" ADD COLUMN IF NOT EXISTS "categories_prosthetics_title" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN IF NOT EXISTS "categories_prosthetics_description" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN IF NOT EXISTS "categories_prosthetics_focus_keyword" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "services" ALTER COLUMN "category" SET DATA TYPE text;
  DROP TYPE "public"."enum_services_category";
  CREATE TYPE "public"."enum_services_category" AS ENUM('diagnostics-planning', 'therapy-prevention', 'surgery-implantation', 'orthodontics', 'aesthetic');
  ALTER TABLE "services" ALTER COLUMN "category" SET DATA TYPE "public"."enum_services_category" USING "category"::"public"."enum_services_category";
  ALTER TABLE "cases" ALTER COLUMN "direction" SET DATA TYPE text;
  DROP TYPE "public"."enum_cases_direction";
  CREATE TYPE "public"."enum_cases_direction" AS ENUM('diagnostics-planning', 'therapy-prevention', 'surgery-implantation', 'orthodontics', 'aesthetic');
  ALTER TABLE "cases" ALTER COLUMN "direction" SET DATA TYPE "public"."enum_cases_direction" USING "direction"::"public"."enum_cases_direction";
  ALTER TABLE "seo_locales" DROP COLUMN "categories_prosthetics_title";
  ALTER TABLE "seo_locales" DROP COLUMN "categories_prosthetics_description";
  ALTER TABLE "seo_locales" DROP COLUMN "categories_prosthetics_focus_keyword";`)
}
