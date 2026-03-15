import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import { User } from '../users/user.entity';

const dataPath = process.env.DATA_PATH || path.join(process.cwd(), 'data');
const configFile = path.join(dataPath, 'config.json');

export interface DbConfig {
  dbType: 'sqlite' | 'postgres';
  dbHost?: string;
  dbPort?: number;
  dbUser?: string;
  dbPass?: string;
  dbName?: string;
}

@Injectable()
export class SetupService {
  constructor(@InjectRepository(User) private usersRepo: Repository<User>) {}

  isDbConfigured(): boolean {
    return fs.existsSync(configFile);
  }

  getDbType(): string {
    if (!this.isDbConfigured()) return 'sqlite';
    try {
      return JSON.parse(fs.readFileSync(configFile, 'utf8')).dbType || 'sqlite';
    } catch {
      return 'sqlite';
    }
  }

  async isConfigured(): Promise<boolean> {
    try {
      const count = await this.usersRepo.count();
      return count > 0;
    } catch {
      return false;
    }
  }

  async testPostgres(config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }): Promise<void> {
    const client = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      connectionTimeoutMillis: 5000,
    });
    try {
      await client.connect();
      await client.end();
    } catch (err: any) {
      throw new BadRequestException(
        `Connessione PostgreSQL fallita: ${err.message}`,
      );
    }
  }

  saveDbConfig(config: DbConfig): void {
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }
    fs.writeFileSync(configFile, JSON.stringify(config, null, 2), {
      mode: 0o600,
    });
  }

  async init(dto: { username: string; displayName: string; password: string }) {
    if (await this.isConfigured()) {
      throw new ConflictException('Sistema già configurato');
    }
    const hash = await bcrypt.hash(dto.password, 12);
    const user = this.usersRepo.create({
      username: dto.username,
      displayName: dto.displayName,
      password: hash,
      role: 'admin',
    });
    await this.usersRepo.save(user);
    return { ok: true };
  }
}
