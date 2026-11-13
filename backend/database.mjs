import { createPool } from 'mysql2/promise';
import pg from 'pg';

export function createDatabase(env) {
  if (env.DATABASE_URL) {
    const url = new URL(env.DATABASE_URL);
    url.searchParams.set('sslmode', 'verify-full');
    const pool = new pg.Pool({
      connectionString: url.toString(),
      max: 5,
      connectionTimeoutMillis: 3000,
      query_timeout: 3000,
    });
    pool.on('error', (error) => console.error('Idle database connection failed:', error.code ?? error.name));

    const executeWith = async (client, sql, params) => {
      let index = 0;
      const query = sql.replaceAll('?', () => `$${++index}`);
      const result = await client.query(query, params);
      return [result.command === 'SELECT' ? result.rows : { affectedRows: result.rowCount }];
    };
    const database = {
      dialect: 'postgres',
      otpRequests: 'unicommu.otp_daily_requests',
      users: 'unicommu.users',
      now: 'CURRENT_TIMESTAMP',
      otpExpiry: "CURRENT_TIMESTAMP + INTERVAL '10 minutes'",
      resendCutoff: "CURRENT_TIMESTAMP + INTERVAL '9 minutes'",
      execute: (sql, params) => executeWith(pool, sql, params),
      async transaction(work) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          const value = await work({ ...database, execute: (sql, params) => executeWith(client, sql, params) });
          await client.query('COMMIT');
          return value;
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
      check: () => pool.query('SELECT 1'),
      close: () => pool.end(),
    };
    return database;
  }

  if (!env.DB_PASSWORD) throw new Error('Set DB_PASSWORD or DATABASE_URL in backend/.env.');
  const pool = createPool({
    host: env.DB_HOST ?? '127.0.0.1',
    port: Number(env.DB_PORT ?? 3306),
    user: env.DB_USER ?? 'unicommu_dev',
    password: env.DB_PASSWORD,
    database: env.DB_NAME ?? 'unicommu_dev',
    connectTimeout: 3000,
    connectionLimit: 5,
    waitForConnections: false,
  });

  const database = {
    dialect: 'mysql',
    otpRequests: 'otp_daily_requests',
    users: 'users',
    now: 'UTC_TIMESTAMP()',
    otpExpiry: 'UTC_TIMESTAMP() + INTERVAL 10 MINUTE',
    resendCutoff: 'UTC_TIMESTAMP() + INTERVAL 9 MINUTE',
    execute: (sql, params) => pool.execute(sql, params),
    async transaction(work) {
      const client = await pool.getConnection();
      try {
        await client.beginTransaction();
        const value = await work({ ...database, execute: (sql, params) => client.execute(sql, params) });
        await client.commit();
        return value;
      } catch (error) {
        await client.rollback();
        throw error;
      } finally {
        client.release();
      }
    },
    check: () => pool.query({ sql: 'SELECT 1', timeout: 3000 }),
    close: () => pool.end(),
  };
  return database;
}
