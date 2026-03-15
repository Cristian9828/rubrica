import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SectionsService } from './sections.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sections')
@UseGuards(AuthGuard('jwt'))
export class SectionsController {
  constructor(private sectionsService: SectionsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.sectionsService.findAll(user.id, user.role);
  }

  @Post()
  create(
    @Body() body: { name: string; icon?: string; color?: string; type: 'company' | 'personal' },
    @CurrentUser() user: any,
  ) {
    return this.sectionsService.create(body, user.id, user.role);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { name?: string; icon?: string; color?: string; position?: number },
    @CurrentUser() user: any,
  ) {
    return this.sectionsService.update(id, body, user.id, user.role);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.sectionsService.remove(id, user.id, user.role);
  }
}
