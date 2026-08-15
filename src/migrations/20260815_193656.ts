import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "clinic_info" ADD COLUMN "satisfied_percent" numeric;
  ALTER TABLE "clinic_info" ADD COLUMN "years_on_market" numeric;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "clinic_info" DROP COLUMN "satisfied_percent";
  ALTER TABLE "clinic_info" DROP COLUMN "years_on_market";`)
}
