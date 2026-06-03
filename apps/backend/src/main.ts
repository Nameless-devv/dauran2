import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import * as express from 'express';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp));

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: '*',
    credentials: false,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.init();

  const port = Number(process.env.PORT || 3000);
  http.createServer(expressApp).listen(port, () => {
    console.log(`HTTP  → http://localhost:${port}/api/v1`);
  });

  // HTTPS — iPhone live camera scanner uchun (getUserMedia HTTPS talab qiladi)
  const certsDir = path.join(process.cwd(), 'certs');
  const keyPath  = path.join(certsDir, 'key.pem');
  const certPath = path.join(certsDir, 'cert.pem');

  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const httpsOptions = {
      key:  fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    https.createServer(httpsOptions, expressApp).listen(3443, () => {
      console.log(`HTTPS → https://192.168.0.101:3443/api/v1`);
    });
  } else {
    console.log('HTTPS sertifikat topilmadi — certs/key.pem, certs/cert.pem kerak');
  }
}
bootstrap();
