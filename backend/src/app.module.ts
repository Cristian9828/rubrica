import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SectionsModule } from './sections/sections.module';
import { ContactsModule } from './contacts/contacts.module';
import { TagsModule } from './tags/tags.module';
import { UserSettingsModule } from './user-settings/user-settings.module';
import { SetupModule } from './setup/setup.module';
import { User } from './users/user.entity';
import { Section } from './sections/section.entity';
import { Contact } from './contacts/contact.entity';
import { Tag } from './tags/tag.entity';
import { UserSetting } from './user-settings/user-setting.entity';

const dbType = (process.env.DB_TYPE as 'sqlite' | 'postgres') || 'sqlite';

// In produzione (NODE_ENV=production) la sincronizzazione automatica è disabilitata
// per evitare modifiche accidentali allo schema. In sviluppo locale rimane attiva.
const synchronize = process.env.NODE_ENV !== 'production';

const sqliteConfig = {
  type: 'sqlite' as const,
  database: process.env.DB_PATH || './data/rubrica.db',
  entities: [User, Section, Contact, Tag, UserSetting],
  synchronize,
};

const postgresConfig = {
  type: 'postgres' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'rubrica',
  password: process.env.DB_PASS || 'rubrica',
  database: process.env.DB_NAME || 'rubrica',
  entities: [User, Section, Contact, Tag, UserSetting],
  synchronize,
};

@Module({
  imports: [
    TypeOrmModule.forRoot(dbType === 'postgres' ? postgresConfig : sqliteConfig),
    AuthModule,
    UsersModule,
    SectionsModule,
    ContactsModule,
    TagsModule,
    UserSettingsModule,
    SetupModule,
  ],
})
export class AppModule {}
