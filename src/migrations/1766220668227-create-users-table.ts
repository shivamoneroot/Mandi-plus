import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1766220668227 implements MigrationInterface {
    name = 'CreateUsersTable1766220668227'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_identity_enum" AS ENUM('TRANSPORTER', 'SUPPLIER', 'BUYER', 'AGENT')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "mobileNumber" character varying(15) NOT NULL, "secondaryMobileNumber" character varying(15), "name" character varying, "state" character varying(255) NOT NULL, "identity" "public"."users_identity_enum", "products" text array, "loadingPoint" text array, "destinationShopAddress" text array, "route" text array, "officeAddress" text array, "destinationAddress" text array, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_840d0f3f0736288a0efdffd0f4" ON "users" ("secondaryMobileNumber") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_61dc14c8c49c187f5d08047c98" ON "users" ("mobileNumber") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_61dc14c8c49c187f5d08047c98"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_840d0f3f0736288a0efdffd0f4"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_identity_enum"`);
    }

}
