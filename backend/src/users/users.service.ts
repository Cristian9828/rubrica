import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
  ) {}

  async findAll() {
    const users = await this.repo.find({ order: { createdAt: 'DESC' } });
    return users.map(({ password, ...u }) => u);
  }

  async findOne(id: number) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException();
    const { password, ...result } = user;
    return result;
  }

  async create(data: {
    username: string;
    password: string;
    displayName: string;
    role?: 'admin' | 'user';
  }) {
    const exists = await this.repo.findOne({
      where: { username: data.username },
    });
    if (exists) throw new ConflictException('Username già in uso');
    const hash = await bcrypt.hash(data.password, 10);
    const user = await this.repo.save({
      ...data,
      password: hash,
    });
    const { password, ...result } = user;
    return result;
  }

  async update(
    id: number,
    data: { displayName?: string; password?: string; role?: 'admin' | 'user' },
  ) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException();
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    Object.assign(user, data);
    await this.repo.save(user);
    const { password, ...result } = user;
    return result;
  }

  async remove(id: number) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException();
    await this.repo.remove(user);
  }
}
