import DataSource from '../config/typeorm/configuration';
import { QueryRunner } from 'typeorm';

async function resetDatabase(): Promise<void> {
  const dataSource = DataSource;
  const queryRunner: QueryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.dropTable('notify_notifications', true);
    await queryRunner.clearTable('notify_migrations');
  } catch (error) {
    process.stderr.write(`${error}\n`);
    process.exit(1);
  } finally {
    await queryRunner.release();
  }
}

resetDatabase();
