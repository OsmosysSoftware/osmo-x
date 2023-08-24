import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1692870736644 implements MigrationInterface {
  name = 'Migration1692870736644';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`notifications\` (\`id\` int NOT NULL AUTO_INCREMENT, \`channel_type\` varchar(255) NOT NULL, \`data\` json NOT NULL, \`delivery_status\` int(1) NOT NULL DEFAULT '1', \`result\` json NULL, \`created_by\` varchar(255) NOT NULL, \`created_on\` datetime NOT NULL, \`modified_by\` varchar(255) NULL, \`modified_on\` datetime NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`notifications\``);
  }
}
