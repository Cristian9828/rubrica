import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './contact.entity';
import { Tag } from '../tags/tag.entity';
import { uploadsPath } from '../uploads.config';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact) private repo: Repository<Contact>,
    @InjectRepository(Tag) private tagRepo: Repository<Tag>,
  ) {}

  private deletePhotoFile(photoUrl: string | null) {
    if (!photoUrl || !photoUrl.startsWith('/api/uploads/')) return;
    // path.basename() rimuove eventuali path traversal (../../etc/passwd → passwd)
    const filename = path.basename(photoUrl.replace('/api/uploads/', ''));
    const filepath = path.resolve(uploadsPath, filename);
    // Verifica che il percorso risolto rimanga dentro uploadsPath
    if (!filepath.startsWith(path.resolve(uploadsPath) + path.sep)) return;
    fs.unlink(filepath, () => {});
  }

  async findAll(
    userId: number,
    query: {
      search?: string;
      sectionId?: number;
      tagId?: number;
      type?: 'company' | 'personal';
      archived?: boolean;
    },
  ) {
    const qb = this.repo.createQueryBuilder('c');
    qb.leftJoinAndSelect('c.tags', 'tag');
    qb.leftJoinAndSelect('c.section', 'section');

    // Visibility: company contacts visible to all, personal only to owner
    qb.where(
      '(c.type = :company OR (c.type = :personal AND c.user_id = :userId))',
      { company: 'company', personal: 'personal', userId },
    );

    // Archivio: di default mostra solo i non archiviati
    if (query.archived) {
      qb.andWhere('c.archived_at IS NOT NULL');
    } else {
      qb.andWhere('c.archived_at IS NULL');
    }

    if (query.search) {
      const s = `%${query.search}%`;
      qb.andWhere(
        '(c.first_name LIKE :s OR c.last_name LIKE :s OR c.company LIKE :s OR c.role LIKE :s)',
        { s },
      );
    }

    if (query.sectionId) {
      qb.andWhere('c.section_id = :sectionId', { sectionId: query.sectionId });
    }

    if (query.tagId) {
      qb.andWhere('tag.id = :tagId', { tagId: query.tagId });
    }

    if (query.type) {
      qb.andWhere('c.type = :filterType', { filterType: query.type });
    }

    qb.orderBy('c.first_name', 'ASC').addOrderBy('c.last_name', 'ASC');
    return qb.getMany();
  }

  async findOne(id: number, userId: number) {
    const contact = await this.repo.findOne({
      where: { id },
      relations: ['tags', 'section'],
    });
    if (!contact) throw new NotFoundException();
    if (contact.type === 'personal' && contact.userId !== userId) {
      throw new ForbiddenException();
    }
    return contact;
  }

  async create(
    data: {
      firstName: string;
      lastName?: string;
      company?: string;
      role?: string;
      phones?: string[];
      emails?: string[];
      website?: string;
      notes?: string;
      photo?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      country?: string;
      sectionId?: number;
      type: 'company' | 'personal';
      tagIds?: number[];
    },
    userId: number,
    userRole: string,
  ) {
    if (data.type === 'company' && userRole !== 'admin') {
      throw new ForbiddenException('Solo gli admin possono creare contatti aziendali');
    }

    const { tagIds, ...contactData } = data;
    const contact = this.repo.create({
      ...contactData,
      userId: data.type === 'personal' ? userId : null,
    });

    if (tagIds?.length) {
      contact.tags = await this.tagRepo.findByIds(tagIds);
    }

    return this.repo.save(contact);
  }

  async update(
    id: number,
    data: {
      firstName?: string;
      lastName?: string;
      company?: string;
      role?: string;
      phones?: string[];
      emails?: string[];
      website?: string;
      notes?: string;
      photo?: string;
      address?: string;
      city?: string;
      postalCode?: string;
      country?: string;
      sectionId?: number;
      tagIds?: number[];
    },
    userId: number,
    userRole: string,
  ) {
    const contact = await this.repo.findOne({
      where: { id },
      relations: ['tags'],
    });
    if (!contact) throw new NotFoundException();
    if (contact.type === 'company' && userRole !== 'admin') {
      throw new ForbiddenException();
    }
    if (contact.type === 'personal' && contact.userId !== userId) {
      throw new ForbiddenException();
    }

    const { tagIds, ...updateData } = data;

    // Se la foto viene cambiata o rimossa, elimina il vecchio file
    if (updateData.photo !== undefined && updateData.photo !== contact.photo) {
      this.deletePhotoFile(contact.photo);
    }

    Object.assign(contact, updateData);

    if (tagIds !== undefined) {
      contact.tags = tagIds.length
        ? await this.tagRepo.findByIds(tagIds)
        : [];
    }

    return this.repo.save(contact);
  }

  async remove(id: number, userId: number, userRole: string) {
    const contact = await this.repo.findOne({ where: { id } });
    if (!contact) throw new NotFoundException();
    if (contact.type === 'company' && userRole !== 'admin') {
      throw new ForbiddenException();
    }
    if (contact.type === 'personal' && contact.userId !== userId) {
      throw new ForbiddenException();
    }
    this.deletePhotoFile(contact.photo);
    await this.repo.remove(contact);
  }

  async archive(id: number, userId: number, userRole: string) {
    const contact = await this.repo.findOne({ where: { id } });
    if (!contact) throw new NotFoundException();
    if (contact.type === 'company' && userRole !== 'admin') {
      throw new ForbiddenException();
    }
    if (contact.type === 'personal' && contact.userId !== userId) {
      throw new ForbiddenException();
    }
    contact.archivedAt = new Date();
    return this.repo.save(contact);
  }

  async unarchive(id: number, userId: number, userRole: string) {
    const contact = await this.repo.findOne({ where: { id } });
    if (!contact) throw new NotFoundException();
    if (contact.type === 'company' && userRole !== 'admin') {
      throw new ForbiddenException();
    }
    if (contact.type === 'personal' && contact.userId !== userId) {
      throw new ForbiddenException();
    }
    contact.archivedAt = null;
    return this.repo.save(contact);
  }

  async exportContacts(
    userId: number,
    format: 'xlsx' | 'vcf',
    sectionId?: number,
    type?: 'company' | 'personal',
  ): Promise<{ data: Buffer | string; contentType: string; filename: string }> {
    const contacts = await this.findAll(userId, { sectionId, type });

    if (format === 'vcf') {
      const vcards = contacts.map((c) => {
        const lines = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `N:${c.lastName || ''};${c.firstName};;;`,
          `FN:${c.firstName}${c.lastName ? ' ' + c.lastName : ''}`,
        ];
        if (c.company) lines.push(`ORG:${c.company}`);
        if (c.role) lines.push(`TITLE:${c.role}`);
        if (c.phones) c.phones.forEach((p) => lines.push(`TEL:${p}`));
        if (c.emails) c.emails.forEach((e) => lines.push(`EMAIL:${e}`));
        if (c.website) lines.push(`URL:${c.website}`);
        if (c.notes) lines.push(`NOTE:${c.notes}`);
        lines.push('END:VCARD');
        return lines.join('\r\n');
      });
      return {
        data: vcards.join('\r\n'),
        contentType: 'text/vcard',
        filename: 'contatti.vcf',
      };
    }

    // XLSX
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Contatti');

    sheet.columns = [
      { header: 'Nome', key: 'firstName', width: 18 },
      { header: 'Cognome', key: 'lastName', width: 18 },
      { header: 'Azienda', key: 'company', width: 22 },
      { header: 'Ruolo', key: 'role', width: 18 },
      { header: 'Telefoni', key: 'phones', width: 25 },
      { header: 'Email', key: 'emails', width: 28 },
      { header: 'Sito', key: 'website', width: 25 },
      { header: 'Indirizzo', key: 'address', width: 22 },
      { header: 'Città', key: 'city', width: 16 },
      { header: 'CAP', key: 'postalCode', width: 10 },
      { header: 'Paese', key: 'country', width: 14 },
      { header: 'Note', key: 'notes', width: 30 },
      { header: 'Tipo', key: 'type', width: 12 },
      { header: 'Tag', key: 'tags', width: 20 },
    ];

    // Bold header row
    sheet.getRow(1).font = { bold: true };

    contacts.forEach((c) => {
      sheet.addRow({
        firstName: c.firstName,
        lastName: c.lastName || '',
        company: c.company || '',
        role: c.role || '',
        phones: (c.phones || []).join('; '),
        emails: (c.emails || []).join('; '),
        website: c.website || '',
        address: c.address || '',
        city: c.city || '',
        postalCode: c.postalCode || '',
        country: c.country || '',
        notes: c.notes || '',
        type: c.type === 'company' ? 'Aziendale' : 'Personale',
        tags: (c.tags || []).map((t) => t.name).join(', '),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      data: Buffer.from(buffer),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      filename: 'contatti.xlsx',
    };
  }
}
