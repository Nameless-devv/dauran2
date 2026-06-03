import { Module } from '@nestjs/common';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { StockModule } from './modules/stock/stock.module';
import { SalesModule } from './modules/sales/sales.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ExportsModule } from './modules/exports/exports.module';
import { OfdModule } from './modules/ofd/ofd.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ScannerModule } from './modules/scanner/scanner.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): PostgresConnectionOptions => {
        const databaseUrl = config.get<string>('DATABASE_URL');
        const isProd = config.get('NODE_ENV') === 'production';
        const base = {
          type: 'postgres' as const,
          autoLoadEntities: true,
          synchronize: !isProd || config.get('DB_SYNC') === 'true',
          logging: false,
        };
        if (databaseUrl) {
          return { ...base, url: databaseUrl, ssl: { rejectUnauthorized: false } };
        }
        return {
          ...base,
          host: config.get('DATABASE_HOST', 'localhost'),
          port: config.get<number>('DATABASE_PORT', 5432),
          username: config.get('DATABASE_USER', 'sanjarbek'),
          password: config.get('DATABASE_PASSWORD', ''),
          database: config.get('DATABASE_NAME', 'dauran2'),
        };
      },
      inject: [ConfigService],
    }),
    OfdModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    StockModule,
    SalesModule,
    SuppliersModule,
    CustomersModule,
    ShiftsModule,
    ReportsModule,
    ExportsModule,
    PaymentsModule,
    ScannerModule,
  ],
})
export class AppModule {}
