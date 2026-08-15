import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "doctors_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL
  );
  
  ALTER TABLE "doctors_tags" ADD CONSTRAINT "doctors_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."doctors"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "doctors_tags_order_idx" ON "doctors_tags" USING btree ("_order");
  CREATE INDEX "doctors_tags_parent_id_idx" ON "doctors_tags" USING btree ("_parent_id");
  CREATE INDEX "doctors_tags_locale_idx" ON "doctors_tags" USING btree ("_locale");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "doctors_tags" CASCADE;`)
}
