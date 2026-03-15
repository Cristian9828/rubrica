import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserSetting } from '../user-settings/user-setting.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(UserSetting) private settingsRepo: Repository<UserSetting>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: { sub: number; username: string }) {
    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException();
    const { password, ...result } = user;
    const settings = await this.settingsRepo.findOne({ where: { userId: user.id } });
    return {
      ...result,
      settings: settings
        ? { language: settings.language, theme: settings.theme, accentColor: settings.accentColor }
        : { language: 'it', theme: 'system', accentColor: 'blue' },
    };
  }
}
