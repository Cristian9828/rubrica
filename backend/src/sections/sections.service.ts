import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Section } from './section.entity';

@Injectable()
export class SectionsService {
  constructor(
    @InjectRepository(Section) private repo: Repository<Section>,
  ) {}

  async findAll(userId: number, userRole: string) {
    const qb = this.repo.createQueryBuilder('s');
    qb.where('s.type = :company', { company: 'company' });
    qb.orWhere('(s.type = :personal AND s.user_id = :userId)', {
      personal: 'personal',
      userId,
    });
    qb.orderBy('s.type', 'ASC').addOrderBy('s.position', 'ASC');
    return qb.getMany();
  }

  async create(
    data: { name: string; icon?: string; color?: string; type: 'company' | 'personal' },
    userId: number,
    userRole: string,
  ) {
    if (data.type === 'company' && userRole !== 'admin') {
      throw new ForbiddenException('Solo gli admin possono creare sezioni aziendali');
    }
    const section = this.repo.create({
      ...data,
      userId: data.type === 'personal' ? userId : null,
    });
    return this.repo.save(section);
  }

  async update(
    id: number,
    data: { name?: string; icon?: string; color?: string; position?: number },
    userId: number,
    userRole: string,
  ) {
    const section = await this.repo.findOne({ where: { id } });
    if (!section) throw new NotFoundException();
    if (section.type === 'company' && userRole !== 'admin') {
      throw new ForbiddenException();
    }
    if (section.type === 'personal' && section.userId !== userId) {
      throw new ForbiddenException();
    }
    Object.assign(section, data);
    return this.repo.save(section);
  }

  async remove(id: number, userId: number, userRole: string) {
    const section = await this.repo.findOne({ where: { id } });
    if (!section) throw new NotFoundException();
    if (section.type === 'company' && userRole !== 'admin') {
      throw new ForbiddenException();
    }
    if (section.type === 'personal' && section.userId !== userId) {
      throw new ForbiddenException();
    }
    await this.repo.remove(section);
  }
}
