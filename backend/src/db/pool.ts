import { Pool } from 'pg';
import { getConfig } from '../config';

const { databaseUrl, databaseSsl } = getConfig();

export const databasePool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseSsl ? { rejectUnauthorized: false } : false,
  statement_timeout: 10000,
  idle_in_transaction_session_timeout: 10000,
});


