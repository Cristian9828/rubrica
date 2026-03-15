import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './tag.entity';

@Injectable()
export class TagsService {
  constructor(@InjectRepository(Tag) private repo: Repository<Tag>) {}

  findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
  }

  async create(data: { name: string; color?: string }) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: { name?: string; color?: string }) {
    const tag = await this.repo.findOne({ where: { id } });
    if (!tag) throw new NotFoundException();
    Object.assign(tag, data);
    return this.repo.save(tag);
  }

  async remove(id: number) {
    const tag = await this.repo.findOne({ where: { id } });
    if (!tag) throw new NotFoundException();
    await this.repo.remove(tag);
  }
}
