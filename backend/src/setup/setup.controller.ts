import {
  Controller,
  Get,
  Post,
  Body,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SetupService, DbConfig } from './setup.service';

@Controller('setup')
export class SetupController {
  constructor(private setupService: SetupService) {}

  @Get('status')
  async status() {
    const configured = await this.setupService.isConfigured();
    const dbConfigured = this.setupService.isDbConfigured();
    const dbType = this.setupService.getDbType();
    return { configured, dbConfigured, dbType };
  }

  /** Testa la connessione a PostgreSQL senza salvare nulla */
  @Post('test-db')
  @HttpCode(HttpStatus.OK)
  async testDb(
    @Body()
    body: {
      host?: string;
      port?: number;
      user?: string;
      password?: string;
      database?: string;
    },
  ) {
    if (!body.host || !body.user || !body.database) {
      throw new BadRequestException('Host, user e database sono obbligatori');
    }
    await this.setupService.testPostgres({
      host: body.host,
      port: body.port || 5432,
      user: body.user,
      password: body.password || '',
      database: body.database,
    });
    return { ok: true };
  }

  /**
   * Salva la configurazione DB e riavvia il processo.
   * Docker restart policy ripristina il container automaticamente.
   */
  @Post('configure-db')
  async configureDb(
    @Body()
    body: {
      dbType?: string;
      host?: string;
      port?: number;
      user?: string;
      password?: string;
      database?: string;
    },
  ) {
    if (body.dbType !== 'sqlite' && body.dbType !== 'postgres') {
      throw new BadRequestException('dbType deve essere sqlite o postgres');
    }

    let config: DbConfig;

    if (body.dbType === 'postgres') {
      if (!body.host || !body.user || !body.database) {
        throw new BadRequestException('Host, user e database sono obbligatori');
      }
      // Verifica la connessione prima di salvare
      await this.setupService.testPostgres({
        host: body.host,
        port: body.port || 5432,
        user: body.user,
        password: body.password || '',
        database: body.database,
      });
      config = {
        dbType: 'postgres',
        dbHost: body.host,
        dbPort: body.port || 5432,
        dbUser: body.user,
        dbPass: body.password || '',
        dbName: body.database,
      };
    } else {
      config = { dbType: 'sqlite' };
    }

    this.setupService.saveDbConfig(config);

    // Riavvio graceful: risponde al client, poi esce
    // Docker restart: always ripristina il processo
    setImmediate(() => process.exit(0));

    return { ok: true, restarting: body.dbType === 'postgres' };
  }

  @Post('init')
  async init(
    @Body()
    body: { username?: string; displayName?: string; password?: string },
  ) {
    if (!body.username?.trim()) {
      throw new BadRequestException('Username obbligatorio');
    }
    if (!body.displayName?.trim()) {
      throw new BadRequestException('Nome visualizzato obbligatorio');
    }
    if (!body.password || body.password.length < 8) {
      throw new BadRequestException('Password di almeno 8 caratteri');
    }
    return this.setupService.init({
      username: body.username.trim(),
      displayName: body.displayName.trim(),
      password: body.password,
    });
  }
}
