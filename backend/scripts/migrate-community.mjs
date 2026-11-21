import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createDatabase } from '../src/database/connection.mjs';

const db = createDatabase(process.env);
try {
  if (db.dialect !== 'postgres')
    throw new Error(
      'Use the MySQL migration file with a MySQL administration client.',
    );
  const version = '20261121090000';
  const sql = (
    await readFile(
      new URL(
        '../../supabase/migrations/20261121090000_community.sql',
        import.meta.url,
      ),
      'utf8',
    )
  ).replace(/\r\n/g, '\n');
  const checksum = createHash('sha256').update(sql).digest('hex');
  await db.transaction(async (tx) => {
    await tx.execute('SELECT pg_advisory_xact_lock(21112026)', []);
    await tx.execute(
      `CREATE TABLE IF NOT EXISTS unicommu.app_migrations (version varchar(30) PRIMARY KEY,checksum varchar(64) NOT NULL,applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
      [],
    );
    await tx.execute(
      'ALTER TABLE unicommu.app_migrations ENABLE ROW LEVEL SECURITY',
      [],
    );
    await tx.execute(
      'REVOKE ALL ON unicommu.app_migrations FROM PUBLIC,anon,authenticated',
      [],
    );
    const [[existing]] = await tx.execute(
      'SELECT checksum FROM unicommu.app_migrations WHERE version=?',
      [version],
    );
    if (existing) {
      if (existing.checksum !== checksum)
        throw new Error(
          'Migration checksum differs; inspect the migration before continuing.',
        );
      console.log('Community migration already applied.');
      return;
    }
    await tx.execute(
      sql.replace(/^BEGIN;\s*/, '').replace(/COMMIT;\s*$/, ''),
      [],
    );
    await tx.execute(
      'INSERT INTO unicommu.app_migrations(version,checksum) VALUES (?,?)',
      [version, checksum],
    );
    // Keep the Supabase CLI history in sync when this runner applies the file.
    const [[history]] = await tx.execute(
      "SELECT to_regclass('supabase_migrations.schema_migrations') IS NOT NULL AS present",
      [],
    );
    if (history.present)
      await tx.execute(
        'INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES (?, ?, ARRAY[?]::text[]) ON CONFLICT(version) DO NOTHING',
        [version, 'community', sql],
      );
    console.log(
      'Community migration applied. No sample users, faculties or posts were inserted.',
    );
  });
} catch (error) {
  console.error('Community migration failed:', error.code ?? error.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
