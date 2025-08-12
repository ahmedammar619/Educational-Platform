import dotenv from 'dotenv';

dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || undefined });

export function getConfig() {
  const port = Number(process.env.PORT || 8080);
  const databaseUrl = process.env.DATABASE_URL || 'postgresql://baraem:ccydwmbxszD2997s@j2zr.your-database.de:5432/baraem';
  const jwtSecret = process.env.JWT_SECRET || 'change-me';
  const nodeEnv = process.env.NODE_ENV || 'development';
  const databaseSsl = String(process.env.DATABASE_SSL ?? 'true').toLowerCase() === 'true';

  if (!databaseUrl) {
    // eslint-disable-next-line no-console
    console.warn('DATABASE_URL is not set. Set it in backend/.env or docker-compose environment.');
  }

  return {
    port,
    databaseUrl,
    jwtSecret,
    nodeEnv,
    databaseSsl,
  };
}


