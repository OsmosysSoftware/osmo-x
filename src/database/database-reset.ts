import DataSource from '../config/typeorm/configuration';
import { QueryRunner } from 'typeorm';
import { Logger } from '@nestjs/common';

const logger = new Logger('DatabaseReset');

DataSource.initialize()
  .then(async () => {
    logger.log('Data source initialized successfully');

    const queryRunner: QueryRunner = DataSource.createQueryRunner();

    try {
      await queryRunner.connect();

      logger.log('Dropping notifications and migrations tables...');
      await queryRunner.dropTable('notify_notifications', true);
      await queryRunner.dropTable('notify_migrations', true);
      logger.log('Dropped notifications and migrations tables successfully');

      logger.log('Running migrations...');
      await DataSource.runMigrations();
      logger.log('Running migrations completed successfully');

      logger.log('Database reset completed successfully');
      process.exit(0);
    } catch (error) {
      logger.error(`Error while resetting database: ${error}`);
      process.exit(1);
    } finally {
      await queryRunner.release();
    }
  })
  .catch((error) => {
    logger.error(`Error while initializing data source: ${error}`);
    process.exit(1);
  });
