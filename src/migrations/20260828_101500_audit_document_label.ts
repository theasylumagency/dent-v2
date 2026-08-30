import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "audit_logs" ADD COLUMN "document_label" varchar;
  CREATE INDEX "audit_logs_document_label_idx" ON "audit_logs" USING btree ("document_label");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "audit_logs_document_label_idx";
  ALTER TABLE "audit_logs" DROP COLUMN "document_label";`)
}
