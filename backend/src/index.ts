import { createServer } from 'http';
import app from './app';
import { getConfig } from './config';
import { databasePool } from './db/pool';

const { port } = getConfig();

async function start() {
  try {
    await databasePool.query('SELECT 1');
    const server = createServer(app);
    server.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Backend server listening on http://localhost:${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();


