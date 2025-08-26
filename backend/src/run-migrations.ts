import { AppDataSource } from './data-source';

(async () => {
  try {
    await AppDataSource.initialize();
    console.log('Running migrations...');
    const migrations = await AppDataSource.runMigrations();
    console.log(`Successfully ran ${migrations.length} migrations`);
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
})();
