import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaForTruckAndInvoice1766230430250 implements MigrationInterface {
    name = 'SchemaForTruckAndInvoice1766230430250'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN "owonerContactNumber"`);
        await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN "driveName"`);
        await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN "driveContactNumber"`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "weighmentSlipUrls" text array`);
        await queryRunner.query(`ALTER TABLE "trucks" ADD "ownerContactNumber" character varying(15) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trucks" ADD "driverName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trucks" ADD "driverContactNumber" character varying(15) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "terms"`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "terms" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "hsnCode"`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "hsnCode" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "vehicleNumber"`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "vehicleNumber" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "vehicleNumber"`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "vehicleNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "hsnCode"`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "hsnCode" character varying`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "terms"`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "terms" character varying`);
        await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN "driverContactNumber"`);
        await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN "driverName"`);
        await queryRunner.query(`ALTER TABLE "trucks" DROP COLUMN "ownerContactNumber"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "weighmentSlipUrls"`);
        await queryRunner.query(`ALTER TABLE "trucks" ADD "driveContactNumber" character varying(15) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trucks" ADD "driveName" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "trucks" ADD "owonerContactNumber" character varying(15) NOT NULL`);
    }

}
