import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/database.config';
import { UsersModule } from './modules/users/users.module';
import { TrucksModule } from './modules/trucks/trucks.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { StorageModule } from './modules/storage/storage.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { QueueModule } from './modules/queue/queue.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthModule } from './modules/auths/auth.module';
import { UsersModule } from './modules/users/users.module';

import { User } from './entities/user.entity';
import { OtpVerification } from './entities/otp-verification.entity';
import { UserSession } from './entities/user-session.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    UsersModule,
    TrucksModule,
    InvoicesModule,
    StorageModule,
    PdfModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<number>('DB_PORT')),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [User, OtpVerification, UserSession],
        synchronize: false,
      }),
    }),

    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
