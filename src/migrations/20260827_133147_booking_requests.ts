import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_booking_requests_status" AS ENUM('new', 'contacted', 'confirmed', 'closed', 'spam');
  CREATE TYPE "public"."enum_booking_requests_email_notification_status" AS ENUM('pending', 'sent', 'failed', 'skipped');
  CREATE TYPE "public"."enum_booking_requests_telegram_notification_status" AS ENUM('pending', 'sent', 'failed', 'skipped');
  CREATE TABLE "booking_requests" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"phone" varchar NOT NULL,
  	"email" varchar,
  	"service" varchar,
  	"preferred_time" varchar,
  	"message" varchar,
  	"landing_slug" varchar,
  	"campaign_name" varchar,
  	"utm_source" varchar,
  	"utm_medium" varchar,
  	"utm_campaign" varchar,
  	"utm_content" varchar,
  	"utm_term" varchar,
  	"status" "enum_booking_requests_status" DEFAULT 'new' NOT NULL,
  	"email_notification_status" "enum_booking_requests_email_notification_status" DEFAULT 'pending' NOT NULL,
  	"email_notification_error" varchar,
  	"telegram_notification_status" "enum_booking_requests_telegram_notification_status" DEFAULT 'pending' NOT NULL,
  	"telegram_notification_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "booking_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"notification_email" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE INDEX "booking_requests_status_idx" ON "booking_requests" USING btree ("status");
  CREATE INDEX "booking_requests_updated_at_idx" ON "booking_requests" USING btree ("updated_at");
  CREATE INDEX "booking_requests_created_at_idx" ON "booking_requests" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "booking_requests" CASCADE;
  DROP TABLE "booking_settings" CASCADE;
  DROP TYPE "public"."enum_booking_requests_status";
  DROP TYPE "public"."enum_booking_requests_email_notification_status";
  DROP TYPE "public"."enum_booking_requests_telegram_notification_status";`)
}
