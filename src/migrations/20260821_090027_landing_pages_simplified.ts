import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "landing_pages" ALTER COLUMN "archived_behavior" SET DATA TYPE text;
  ALTER TABLE "landing_pages" ALTER COLUMN "archived_behavior" SET DEFAULT 'ended-page'::text;
  DROP TYPE "public"."enum_landing_pages_archived_behavior";
  CREATE TYPE "public"."enum_landing_pages_archived_behavior" AS ENUM('ended-page', 'redirect', 'keep-public');
  ALTER TABLE "landing_pages" ALTER COLUMN "archived_behavior" SET DEFAULT 'ended-page'::"public"."enum_landing_pages_archived_behavior";
  ALTER TABLE "landing_pages" ALTER COLUMN "archived_behavior" SET DATA TYPE "public"."enum_landing_pages_archived_behavior" USING "archived_behavior"::"public"."enum_landing_pages_archived_behavior";
  ALTER TABLE "landing_pages" ALTER COLUMN "hero_layout" SET DATA TYPE text;
  ALTER TABLE "landing_pages" ALTER COLUMN "hero_layout" SET DEFAULT 'image-right'::text;
  DROP TYPE "public"."enum_landing_pages_hero_layout";
  CREATE TYPE "public"."enum_landing_pages_hero_layout" AS ENUM('image-right', 'image-left', 'full-bleed', 'centered-editorial', 'copy-only');
  ALTER TABLE "landing_pages" ALTER COLUMN "hero_layout" SET DEFAULT 'image-right'::"public"."enum_landing_pages_hero_layout";
  ALTER TABLE "landing_pages" ALTER COLUMN "hero_layout" SET DATA TYPE "public"."enum_landing_pages_hero_layout" USING "hero_layout"::"public"."enum_landing_pages_hero_layout";
  ALTER TABLE "landing_pages_reasons_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "landing_pages_reasons_locales" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "landing_pages_steps_locales" ALTER COLUMN "title" DROP NOT NULL;
  ALTER TABLE "landing_pages_steps_locales" ALTER COLUMN "text" DROP NOT NULL;
  ALTER TABLE "landing_pages_testimonials_items_locales" ALTER COLUMN "quote" DROP NOT NULL;
  ALTER TABLE "landing_pages_testimonials_items_locales" ALTER COLUMN "display_name" DROP NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "header_cta_label" DROP NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "hero_headline" DROP NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "hero_cta_label" DROP NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "steps_heading" DROP NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "form_title" DROP NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "form_submit_label" DROP NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "form_success_title" DROP NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "form_success_text" DROP NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "final_cta_title" DROP NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "final_cta_button_label" DROP NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "landing_pages" ALTER COLUMN "archived_behavior" SET DATA TYPE text;
  ALTER TABLE "landing_pages" ALTER COLUMN "archived_behavior" SET DEFAULT 'keep-public'::text;
  DROP TYPE "public"."enum_landing_pages_archived_behavior";
  CREATE TYPE "public"."enum_landing_pages_archived_behavior" AS ENUM('keep-public', 'ended-page', 'redirect');
  ALTER TABLE "landing_pages" ALTER COLUMN "archived_behavior" SET DEFAULT 'keep-public'::"public"."enum_landing_pages_archived_behavior";
  ALTER TABLE "landing_pages" ALTER COLUMN "archived_behavior" SET DATA TYPE "public"."enum_landing_pages_archived_behavior" USING "archived_behavior"::"public"."enum_landing_pages_archived_behavior";
  ALTER TABLE "landing_pages" ALTER COLUMN "hero_layout" SET DATA TYPE text;
  ALTER TABLE "landing_pages" ALTER COLUMN "hero_layout" SET DEFAULT 'image-right'::text;
  DROP TYPE "public"."enum_landing_pages_hero_layout";
  CREATE TYPE "public"."enum_landing_pages_hero_layout" AS ENUM('copy-only', 'image-right', 'image-left', 'full-bleed', 'centered-editorial');
  ALTER TABLE "landing_pages" ALTER COLUMN "hero_layout" SET DEFAULT 'image-right'::"public"."enum_landing_pages_hero_layout";
  ALTER TABLE "landing_pages" ALTER COLUMN "hero_layout" SET DATA TYPE "public"."enum_landing_pages_hero_layout" USING "hero_layout"::"public"."enum_landing_pages_hero_layout";
  ALTER TABLE "landing_pages_reasons_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "landing_pages_reasons_locales" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "landing_pages_steps_locales" ALTER COLUMN "title" SET NOT NULL;
  ALTER TABLE "landing_pages_steps_locales" ALTER COLUMN "text" SET NOT NULL;
  ALTER TABLE "landing_pages_testimonials_items_locales" ALTER COLUMN "quote" SET NOT NULL;
  ALTER TABLE "landing_pages_testimonials_items_locales" ALTER COLUMN "display_name" SET NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "hero_headline" SET NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "hero_cta_label" SET NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "steps_heading" SET NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "final_cta_title" SET NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "final_cta_button_label" SET NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "form_title" SET NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "form_submit_label" SET NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "form_success_title" SET NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "form_success_text" SET NOT NULL;
  ALTER TABLE "landing_pages_locales" ALTER COLUMN "header_cta_label" SET NOT NULL;`)
}
