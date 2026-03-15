import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { uploadsPath } from './uploads.config';

const dataPath = process.env.DATA_PATH || path.join(process.cwd(), 'data');
// Esporta per uso nei moduli (es. SetupService)
process.env.DATA_PATH = dataPath;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadDbConfig() {
  const configFile = path.join(dataPath, 'config.json');
  if (!fs.existsSync(configFile)) return;
  try {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    if (config.dbType) process.env.DB_TYPE = config.dbType;
    if (config.dbHost) process.env.DB_HOST = config.dbHost;
    if (config.dbPort) process.env.DB_PORT = String(config.dbPort);
    if (config.dbUser) process.env.DB_USER = config.dbUser;
    if (config.dbPass) process.env.DB_PASS = config.dbPass;
    if (config.dbName) process.env.DB_NAME = config.dbName;
  } catch {
    console.error('[Rubrica] config.json malformato, verrà ignorato');
  }
}

function resolveJwtSecret(): string {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;

  const secretFile = path.join(dataPath, 'secret.key');
  if (fs.existsSync(secretFile)) {
    return fs.readFileSync(secretFile, 'utf8').trim();
  }

  const secret = crypto.randomBytes(64).toString('hex');
  ensureDir(dataPath);
  fs.writeFileSync(secretFile, secret, { mode: 0o600 });
  console.log(`[Rubrica] JWT secret generato e salvato in ${secretFile}`);
  return secret;
}

async function bootstrap() {
  ensureDir(dataPath);

  // Carica config DB prima di istanziare AppModule (TypeORM legge gli env var)
  loadDbConfig();

  process.env.JWT_SECRET = resolveJwtSecret();

  ensureDir(uploadsPath);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.useStaticAssets(uploadsPath, { prefix: '/api/uploads' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  });
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
