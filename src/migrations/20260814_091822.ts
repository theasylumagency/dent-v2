import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "clinic_info" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar NOT NULL,
  	"phone_alt" varchar,
  	"whatsapp_same_as_phone" boolean DEFAULT true,
  	"whatsapp" varchar,
  	"email" varchar NOT NULL,
  	"maps_url" varchar,
  	"consultation_first" numeric NOT NULL,
  	"consultation_repeat" numeric NOT NULL,
  	"facebook" varchar,
  	"instagram" varchar,
  	"google" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "clinic_info_locales" (
  	"address" varchar NOT NULL,
  	"hours_text" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "seo" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "seo_locales" (
  	"home_title" varchar,
  	"home_description" varchar,
  	"about_title" varchar,
  	"about_description" varchar,
  	"services_title" varchar,
  	"services_description" varchar,
  	"technology_title" varchar,
  	"technology_description" varchar,
  	"news_title" varchar,
  	"news_description" varchar,
  	"contact_title" varchar,
  	"contact_description" varchar,
  	"categories_diagnostics_planning_title" varchar,
  	"categories_diagnostics_planning_description" varchar,
  	"categories_therapy_prevention_title" varchar,
  	"categories_therapy_prevention_description" varchar,
  	"categories_surgery_implantation_title" varchar,
  	"categories_surgery_implantation_description" varchar,
  	"categories_orthodontics_title" varchar,
  	"categories_orthodontics_description" varchar,
  	"categories_aesthetic_title" varchar,
  	"categories_aesthetic_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "posts_locales" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "posts_locales" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "_posts_v_locales" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_posts_v_locales" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "clinic_info_locales" ADD CONSTRAINT "clinic_info_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clinic_info"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_locales" ADD CONSTRAINT "seo_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seo"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "clinic_info_locales_locale_parent_id_unique" ON "clinic_info_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "seo_locales_locale_parent_id_unique" ON "seo_locales" USING btree ("_locale","_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "clinic_info" CASCADE;
  DROP TABLE "clinic_info_locales" CASCADE;
  DROP TABLE "seo" CASCADE;
  DROP TABLE "seo_locales" CASCADE;
  ALTER TABLE "posts_locales" DROP COLUMN "meta_title";
  ALTER TABLE "posts_locales" DROP COLUMN "meta_description";
  ALTER TABLE "_posts_v_locales" DROP COLUMN "version_meta_title";
  ALTER TABLE "_posts_v_locales" DROP COLUMN "version_meta_description";`)
}
