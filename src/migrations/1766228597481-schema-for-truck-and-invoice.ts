import { MigrationInterface, QueryRunner } from "typeorm";

export class SchemaForTruckAndInvoice1766228597481 implements MigrationInterface {
    name = 'SchemaForTruckAndInvoice1766228597481'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoiceNumber" character varying NOT NULL, "invoiceDate" date NOT NULL, "terms" character varying, "supplierName" character varying NOT NULL, "supplierAddress" text array NOT NULL, "placeOfSupply" character varying NOT NULL, "billToName" character varying NOT NULL, "billToAddress" text array NOT NULL, "shipToName" character varying NOT NULL, "shipToAddress" text array NOT NULL, "productName" character varying(255) NOT NULL, "hsnCode" character varying, "quantity" numeric(10,2) NOT NULL, "rate" numeric(10,2) NOT NULL, "amount" numeric(12,2) NOT NULL, "vehicleNumber" character varying, "weighmentSlipNote" text, "isClaim" boolean NOT NULL DEFAULT false, "claimDetails" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "truckId" uuid, CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_bf8e0f9dd4558ef209ec111782" ON "invoices" ("invoiceNumber") `);
        await queryRunner.query(`CREATE TABLE "trucks" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "truckNumber" character varying(20) NOT NULL, "ownerName" character varying NOT NULL, "owonerContactNumber" character varying(15) NOT NULL, "driveName" character varying NOT NULL, "driveContactNumber" character varying(15) NOT NULL, "claimCount" integer NOT NULL DEFAULT '0', "officeAddress" text array, "route" text array, "permit" character varying(255), "licence" character varying(255), "challan" character varying(255), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6a134fb7caa4fb476d8a6e035f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f9424e55f03c06cdc225bc25cb" ON "trucks" ("truckNumber") `);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_a1a06f2a3337c61af44f9d3e3ae" FOREIGN KEY ("truckId") REFERENCES "trucks"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_a1a06f2a3337c61af44f9d3e3ae"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f9424e55f03c06cdc225bc25cb"`);
        await queryRunner.query(`DROP TABLE "trucks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf8e0f9dd4558ef209ec111782"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
    }

}
