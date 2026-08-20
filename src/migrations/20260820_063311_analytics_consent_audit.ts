import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_analytics_aggregates_event" AS ENUM('page_view', 'booking_open', 'booking_complete');
  CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('create', 'update', 'delete');
  CREATE TYPE "public"."enum_audit_logs_target_type" AS ENUM('collection', 'global');
  CREATE TABLE "analytics_aggregates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bucket" varchar NOT NULL,
  	"event" "enum_analytics_aggregates_event" NOT NULL,
  	"route" varchar DEFAULT '' NOT NULL,
  	"count" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer,
  	"action" "enum_audit_logs_action" NOT NULL,
  	"target_type" "enum_audit_logs_target_type" NOT NULL,
  	"target" varchar NOT NULL,
  	"document_id" varchar,
  	"changes" jsonb NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "analytics_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ga4_measurement_id" varchar,
  	"meta_pixel_id" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "analytics_aggregates_updated_at_idx" ON "analytics_aggregates" USING btree ("updated_at");
  CREATE INDEX "analytics_aggregates_created_at_idx" ON "analytics_aggregates" USING btree ("created_at");
  CREATE UNIQUE INDEX "bucket_event_route_idx" ON "analytics_aggregates" USING btree ("bucket","event","route");
  CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");
  CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "analytics_aggregates" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "analytics_settings" CASCADE;
  DROP TYPE "public"."enum_analytics_aggregates_event";
  DROP TYPE "public"."enum_audit_logs_action";
  DROP TYPE "public"."enum_audit_logs_target_type";`)
}
