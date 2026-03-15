import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserSettingsService } from './user-settings.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const VALID_LANGUAGES = ['it', 'en'];
const VALID_THEMES = ['light', 'dark', 'system'];
const VALID_ACCENTS = ['blue', 'green', 'purple', 'orange', 'rose'];

@Controller('user-settings')
@UseGuards(AuthGuard('jwt'))
export class UserSettingsController {
  constructor(private service: UserSettingsService) {}

  @Get('me')
  getMySettings(@CurrentUser() user: any) {
    return this.service.findOrCreate(user.id);
  }

  @Patch('me')
  updateMySettings(
    @CurrentUser() user: any,
    @Body() body: { language?: string; theme?: string; accentColor?: string },
  ) {
    const clean: { language?: string; theme?: string; accentColor?: string } = {};

    if (body.language !== undefined) {
      if (!VALID_LANGUAGES.includes(body.language))
        throw new BadRequestException('Lingua non supportata');
      clean.language = body.language;
    }
    if (body.theme !== undefined) {
      if (!VALID_THEMES.includes(body.theme))
        throw new BadRequestException('Tema non valido');
      clean.theme = body.theme;
    }
    if (body.accentColor !== undefined) {
      if (!VALID_ACCENTS.includes(body.accentColor))
        throw new BadRequestException('Colore non valido');
      clean.accentColor = body.accentColor;
    }

    return this.service.update(user.id, clean);
  }
}
