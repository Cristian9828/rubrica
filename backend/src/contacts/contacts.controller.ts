import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ContactsService } from './contacts.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { uploadsPath } from '../uploads.config';

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const photoStorage = diskStorage({
  destination: uploadsPath,
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_IMAGE_EXTENSIONS.includes(ext) ? ext : '.bin';
    cb(null, `${randomUUID()}${safeExt}`);
  },
});

@Controller('contacts')
@UseGuards(AuthGuard('jwt'))
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('sectionId') sectionId?: string,
    @Query('tagId') tagId?: string,
    @Query('type') type?: 'company' | 'personal',
    @Query('archived') archived?: string,
  ) {
    return this.contactsService.findAll(user.id, {
      search,
      sectionId: sectionId ? +sectionId : undefined,
      tagId: tagId ? +tagId : undefined,
      type,
      archived: archived === 'true',
    });
  }

  @Get('export')
  async export(
    @Res() res: Response,
    @CurrentUser() user: any,
    @Query('format') format: 'xlsx' | 'vcf' = 'xlsx',
    @Query('sectionId') sectionId?: string,
    @Query('type') type?: 'company' | 'personal',
  ) {
    const result = await this.contactsService.exportContacts(
      user.id,
      format,
      sectionId ? +sectionId : undefined,
      type,
    );
    res.setHeader('Content-Type', result.contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    res.send(result.data);
  }

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: photoStorage,
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ext = extname(file.originalname).toLowerCase();
        if (
          !file.mimetype.startsWith('image/') ||
          !ALLOWED_IMAGE_EXTENSIONS.includes(ext)
        ) {
          return cb(
            new BadRequestException('Solo immagini JPG, PNG, GIF o WebP'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadPhoto(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Nessun file ricevuto');
    return { url: `/api/uploads/${file.filename}` };
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.contactsService.findOne(id, user.id);
  }

  @Post()
  create(@Body() body: any, @CurrentUser() user: any) {
    return this.contactsService.create(body, user.id, user.role);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
    @CurrentUser() user: any,
  ) {
    return this.contactsService.update(id, body, user.id, user.role);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.contactsService.remove(id, user.id, user.role);
  }

  @Patch(':id/archive')
  archive(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.contactsService.archive(id, user.id, user.role);
  }

  @Patch(':id/unarchive')
  unarchive(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.contactsService.unarchive(id, user.id, user.role);
  }
}
