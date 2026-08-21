import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_landing_pages_status" AS ENUM('draft', 'active', 'archived');
  CREATE TYPE "public"."enum_landing_pages_archived_behavior" AS ENUM('keep-public', 'ended-page', 'redirect');
  CREATE TYPE "public"."enum_landing_pages_header_preset" AS ENUM('minimal', 'brand', 'ultra-minimal');
  CREATE TYPE "public"."enum_landing_pages_hero_layout" AS ENUM('copy-only', 'image-right', 'image-left', 'full-bleed', 'centered-editorial');
  CREATE TABLE "landing_pages_reasons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "landing_pages_reasons_locales" (
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landing_pages_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "landing_pages_steps_locales" (
  	"title" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landing_pages_testimonials_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "landing_pages_testimonials_items_locales" (
  	"quote" varchar NOT NULL,
  	"display_name" varchar NOT NULL,
  	"source_label" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "landing_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"campaign_name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_landing_pages_status" DEFAULT 'draft' NOT NULL,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"archived_behavior" "enum_landing_pages_archived_behavior" DEFAULT 'keep-public',
  	"redirect_target_id" integer,
  	"indexable" boolean DEFAULT false,
  	"header_preset" "enum_landing_pages_header_preset" DEFAULT 'minimal' NOT NULL,
  	"header_show_phone" boolean DEFAULT true,
  	"hero_layout" "enum_landing_pages_hero_layout" DEFAULT 'image-right' NOT NULL,
  	"hero_desktop_image_id" integer,
  	"hero_mobile_image_id" integer,
  	"problem_solution_enabled" boolean DEFAULT false,
  	"doctor_enabled" boolean DEFAULT false,
  	"doctor_practitioner_id" integer,
  	"testimonials_enabled" boolean DEFAULT false,
  	"clinic_section_enabled" boolean DEFAULT false,
  	"clinic_section_image_id" integer,
  	"form_show_service" boolean DEFAULT false,
  	"form_show_preferred_time" boolean DEFAULT false,
  	"form_show_email" boolean DEFAULT false,
  	"form_show_message" boolean DEFAULT false,
  	"form_default_service_id" integer,
  	"seo_social_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "landing_pages_locales" (
  	"header_trust_text" varchar,
  	"header_cta_label" varchar NOT NULL,
  	"hero_eyebrow" varchar,
  	"hero_headline" varchar NOT NULL,
  	"hero_subheadline" varchar,
  	"hero_cta_label" varchar NOT NULL,
  	"problem_solution_eyebrow" varchar,
  	"problem_solution_title" varchar,
  	"problem_solution_body" varchar,
  	"doctor_heading" varchar,
  	"doctor_intro" varchar,
  	"steps_heading" varchar NOT NULL,
  	"steps_intro" varchar,
  	"testimonials_heading" varchar,
  	"clinic_section_title" varchar,
  	"clinic_section_text" varchar,
  	"form_title" varchar NOT NULL,
  	"form_intro" varchar,
  	"form_submit_label" varchar NOT NULL,
  	"form_success_title" varchar NOT NULL,
  	"form_success_text" varchar NOT NULL,
  	"final_cta_title" varchar NOT NULL,
  	"final_cta_text" varchar,
  	"final_cta_button_label" varchar NOT NULL,
  	"ended_title" varchar,
  	"ended_text" varchar,
  	"ended_cta_label" varchar,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "landing_pages_id" integer;
  ALTER TABLE "landing_pages_reasons" ADD CONSTRAINT "landing_pages_reasons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_pages_reasons_locales" ADD CONSTRAINT "landing_pages_reasons_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages_reasons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_pages_steps" ADD CONSTRAINT "landing_pages_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_pages_steps_locales" ADD CONSTRAINT "landing_pages_steps_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_pages_testimonials_items" ADD CONSTRAINT "landing_pages_testimonials_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_pages_testimonials_items_locales" ADD CONSTRAINT "landing_pages_testimonials_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages_testimonials_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_redirect_target_id_landing_pages_id_fk" FOREIGN KEY ("redirect_target_id") REFERENCES "public"."landing_pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_hero_desktop_image_id_media_id_fk" FOREIGN KEY ("hero_desktop_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_hero_mobile_image_id_media_id_fk" FOREIGN KEY ("hero_mobile_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_doctor_practitioner_id_doctors_id_fk" FOREIGN KEY ("doctor_practitioner_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_clinic_section_image_id_media_id_fk" FOREIGN KEY ("clinic_section_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_form_default_service_id_services_id_fk" FOREIGN KEY ("form_default_service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_seo_social_image_id_media_id_fk" FOREIGN KEY ("seo_social_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_pages_locales" ADD CONSTRAINT "landing_pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "landing_pages_reasons_order_idx" ON "landing_pages_reasons" USING btree ("_order");
  CREATE INDEX "landing_pages_reasons_parent_id_idx" ON "landing_pages_reasons" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landing_pages_reasons_locales_locale_parent_id_unique" ON "landing_pages_reasons_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landing_pages_steps_order_idx" ON "landing_pages_steps" USING btree ("_order");
  CREATE INDEX "landing_pages_steps_parent_id_idx" ON "landing_pages_steps" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landing_pages_steps_locales_locale_parent_id_unique" ON "landing_pages_steps_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "landing_pages_testimonials_items_order_idx" ON "landing_pages_testimonials_items" USING btree ("_order");
  CREATE INDEX "landing_pages_testimonials_items_parent_id_idx" ON "landing_pages_testimonials_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "landing_pages_testimonials_items_locales_locale_parent_id_un" ON "landing_pages_testimonials_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "landing_pages_slug_idx" ON "landing_pages" USING btree ("slug");
  CREATE INDEX "landing_pages_status_idx" ON "landing_pages" USING btree ("status");
  CREATE INDEX "landing_pages_redirect_target_idx" ON "landing_pages" USING btree ("redirect_target_id");
  CREATE INDEX "landing_pages_hero_hero_desktop_image_idx" ON "landing_pages" USING btree ("hero_desktop_image_id");
  CREATE INDEX "landing_pages_hero_hero_mobile_image_idx" ON "landing_pages" USING btree ("hero_mobile_image_id");
  CREATE INDEX "landing_pages_doctor_doctor_practitioner_idx" ON "landing_pages" USING btree ("doctor_practitioner_id");
  CREATE INDEX "landing_pages_clinic_section_clinic_section_image_idx" ON "landing_pages" USING btree ("clinic_section_image_id");
  CREATE INDEX "landing_pages_form_form_default_service_idx" ON "landing_pages" USING btree ("form_default_service_id");
  CREATE INDEX "landing_pages_seo_seo_social_image_idx" ON "landing_pages" USING btree ("seo_social_image_id");
  CREATE INDEX "landing_pages_updated_at_idx" ON "landing_pages" USING btree ("updated_at");
  CREATE INDEX "landing_pages_created_at_idx" ON "landing_pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "landing_pages_locales_locale_parent_id_unique" ON "landing_pages_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_landing_pages_fk" FOREIGN KEY ("landing_pages_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_landing_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("landing_pages_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_landing_pages_fk";
  DROP INDEX "payload_locked_documents_rels_landing_pages_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "landing_pages_id";
  ALTER TABLE "landing_pages_reasons" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "landing_pages_reasons_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "landing_pages_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "landing_pages_steps_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "landing_pages_testimonials_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "landing_pages_testimonials_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "landing_pages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "landing_pages_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "landing_pages_reasons" CASCADE;
  DROP TABLE "landing_pages_reasons_locales" CASCADE;
  DROP TABLE "landing_pages_steps" CASCADE;
  DROP TABLE "landing_pages_steps_locales" CASCADE;
  DROP TABLE "landing_pages_testimonials_items" CASCADE;
  DROP TABLE "landing_pages_testimonials_items_locales" CASCADE;
  DROP TABLE "landing_pages" CASCADE;
  DROP TABLE "landing_pages_locales" CASCADE;
  DROP TYPE "public"."enum_landing_pages_status";
  DROP TYPE "public"."enum_landing_pages_archived_behavior";
  DROP TYPE "public"."enum_landing_pages_header_preset";
  DROP TYPE "public"."enum_landing_pages_hero_layout";`)
}
