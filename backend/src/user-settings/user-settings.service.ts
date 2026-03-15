import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSetting } from './user-setting.entity';

@Injectable()
export class UserSettingsService {
  constructor(
    @InjectRepository(UserSetting) private repo: Repository<UserSetting>,
  ) {}

  async findOrCreate(userId: number): Promise<UserSetting> {
    let settings = await this.repo.findOne({ where: { userId } });
    if (!settings) {
      settings = await this.repo.save(this.repo.create({ userId }));
    }
    return settings;
  }

  async update(
    userId: number,
    data: { language?: string; theme?: string; accentColor?: string },
  ): Promise<UserSetting> {
    let settings = await this.repo.findOne({ where: { userId } });
    if (!settings) {
      settings = this.repo.create({ userId });
    }
    Object.assign(settings, data);
    return this.repo.save(settings);
  }
}
