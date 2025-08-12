import { Router } from 'express';
import { databasePool } from '../db/pool';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  try {
    const result = await databasePool.query('SELECT 1 as ok');
    res.json({ status: 'ok', db: result.rows[0].ok === 1 });
  } catch (error) {
    res.status(500).json({ status: 'error', error: (error as Error).message });
  }
});


