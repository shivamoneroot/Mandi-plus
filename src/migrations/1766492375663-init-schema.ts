import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1766492375663 implements MigrationInterface {
    name = 'InitSchema1766492375663'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "otp_verifications" DROP COLUMN "otpHash"`);
        await queryRunner.query(`ALTER TABLE "otp_verifications" DROP COLUMN "expiresAt"`);
        await queryRunner.query(`ALTER TABLE "otp_verifications" ADD "providerSessionId" character varying NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7f301f8673978e745b630b0e6e"`);
        await queryRunner.query(`ALTER TABLE "otp_verifications" DROP COLUMN "mobileNumber"`);
        await queryRunner.query(`ALTER TABLE "otp_verifications" ADD "mobileNumber" character varying NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_7f301f8673978e745b630b0e6e" ON "otp_verifications" ("mobileNumber") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_7f301f8673978e745b630b0e6e"`);
        await queryRunner.query(`ALTER TABLE "otp_verifications" DROP COLUMN "mobileNumber"`);
        await queryRunner.query(`ALTER TABLE "otp_verifications" ADD "mobileNumber" character varying(15) NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_7f301f8673978e745b630b0e6e" ON "otp_verifications" ("mobileNumber") `);
        await queryRunner.query(`ALTER TABLE "otp_verifications" DROP COLUMN "providerSessionId"`);
        await queryRunner.query(`ALTER TABLE "otp_verifications" ADD "expiresAt" TIMESTAMP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "otp_verifications" ADD "otpHash" character varying NOT NULL`);
    }

}
