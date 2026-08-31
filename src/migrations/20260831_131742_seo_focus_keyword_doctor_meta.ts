import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts_locales" ADD COLUMN "focus_keyword" varchar;
  ALTER TABLE "_posts_v_locales" ADD COLUMN "version_focus_keyword" varchar;
  ALTER TABLE "landing_pages_locales" ADD COLUMN "seo_focus_keyword" varchar;
  ALTER TABLE "doctors_locales" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "doctors_locales" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "doctors_locales" ADD COLUMN "focus_keyword" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN "home_focus_keyword" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN "about_focus_keyword" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN "services_focus_keyword" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN "technology_focus_keyword" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN "news_focus_keyword" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN "contact_focus_keyword" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN "categories_diagnostics_planning_focus_keyword" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN "categories_therapy_prevention_focus_keyword" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN "categories_surgery_implantation_focus_keyword" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN "categories_orthodontics_focus_keyword" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN "categories_aesthetic_focus_keyword" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "posts_locales" DROP COLUMN "focus_keyword";
  ALTER TABLE "_posts_v_locales" DROP COLUMN "version_focus_keyword";
  ALTER TABLE "doctors_locales" DROP COLUMN "meta_title";
  ALTER TABLE "doctors_locales" DROP COLUMN "meta_description";
  ALTER TABLE "doctors_locales" DROP COLUMN "focus_keyword";
  ALTER TABLE "landing_pages_locales" DROP COLUMN "seo_focus_keyword";
  ALTER TABLE "seo_locales" DROP COLUMN "home_focus_keyword";
  ALTER TABLE "seo_locales" DROP COLUMN "about_focus_keyword";
  ALTER TABLE "seo_locales" DROP COLUMN "services_focus_keyword";
  ALTER TABLE "seo_locales" DROP COLUMN "technology_focus_keyword";
  ALTER TABLE "seo_locales" DROP COLUMN "news_focus_keyword";
  ALTER TABLE "seo_locales" DROP COLUMN "contact_focus_keyword";
  ALTER TABLE "seo_locales" DROP COLUMN "categories_diagnostics_planning_focus_keyword";
  ALTER TABLE "seo_locales" DROP COLUMN "categories_therapy_prevention_focus_keyword";
  ALTER TABLE "seo_locales" DROP COLUMN "categories_surgery_implantation_focus_keyword";
  ALTER TABLE "seo_locales" DROP COLUMN "categories_orthodontics_focus_keyword";
  ALTER TABLE "seo_locales" DROP COLUMN "categories_aesthetic_focus_keyword";`)
}
