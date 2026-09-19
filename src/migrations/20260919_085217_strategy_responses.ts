import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_strategy_responses_status" AS ENUM('draft', 'submitted');
  CREATE TABLE "strategy_responses" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"token_hash" varchar NOT NULL,
  	"form_version" varchar DEFAULT '2026-09-19-v1' NOT NULL,
  	"status" "enum_strategy_responses_status" DEFAULT 'draft' NOT NULL,
  	"revoked" boolean DEFAULT false,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"delete_after" timestamp(3) with time zone NOT NULL,
  	"privacy_contact" varchar NOT NULL,
  	"answers" jsonb DEFAULT '{}'::jsonb,
  	"step" numeric DEFAULT -1 NOT NULL,
  	"revision" numeric DEFAULT 0 NOT NULL,
  	"started_at" timestamp(3) with time zone,
  	"completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE UNIQUE INDEX "strategy_responses_token_hash_idx" ON "strategy_responses" USING btree ("token_hash");
  CREATE INDEX "strategy_responses_updated_at_idx" ON "strategy_responses" USING btree ("updated_at");
  CREATE INDEX "strategy_responses_created_at_idx" ON "strategy_responses" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "strategy_responses" CASCADE;
  DROP TYPE "public"."enum_strategy_responses_status";`)
}
