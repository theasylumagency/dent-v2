import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_cases_direction" AS ENUM('diagnostics-planning', 'therapy-prevention', 'surgery-implantation', 'orthodontics', 'aesthetic');
  CREATE TABLE "cases" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"consent" boolean DEFAULT false,
  	"published" boolean DEFAULT false,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"slug" varchar NOT NULL,
  	"direction" "enum_cases_direction" NOT NULL,
  	"before_image_id" integer NOT NULL,
  	"after_image_id" integer NOT NULL,
  	"doctor_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cases_locales" (
  	"title" varchar NOT NULL,
  	"summary" varchar NOT NULL,
  	"duration" varchar,
  	"details" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "cases_id" integer;
  ALTER TABLE "seo_locales" ADD COLUMN "cases_title" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN "cases_description" varchar;
  ALTER TABLE "seo_locales" ADD COLUMN "cases_focus_keyword" varchar;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_before_image_id_media_id_fk" FOREIGN KEY ("before_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_after_image_id_media_id_fk" FOREIGN KEY ("after_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases" ADD CONSTRAINT "cases_doctor_id_doctors_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."doctors"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cases_locales" ADD CONSTRAINT "cases_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "cases_slug_idx" ON "cases" USING btree ("slug");
  CREATE INDEX "cases_before_image_idx" ON "cases" USING btree ("before_image_id");
  CREATE INDEX "cases_after_image_idx" ON "cases" USING btree ("after_image_id");
  CREATE INDEX "cases_doctor_idx" ON "cases" USING btree ("doctor_id");
  CREATE INDEX "cases_updated_at_idx" ON "cases" USING btree ("updated_at");
  CREATE INDEX "cases_created_at_idx" ON "cases" USING btree ("created_at");
  CREATE UNIQUE INDEX "cases_locales_locale_parent_id_unique" ON "cases_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cases_fk" FOREIGN KEY ("cases_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_cases_id_idx" ON "payload_locked_documents_rels" USING btree ("cases_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "cases" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "cases_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "cases" CASCADE;
  DROP TABLE "cases_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cases_fk";
  
  DROP INDEX "payload_locked_documents_rels_cases_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "cases_id";
  ALTER TABLE "seo_locales" DROP COLUMN "cases_title";
  ALTER TABLE "seo_locales" DROP COLUMN "cases_description";
  ALTER TABLE "seo_locales" DROP COLUMN "cases_focus_keyword";
  DROP TYPE "public"."enum_cases_direction";`)
}
