import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { username } });
    // Esegui sempre bcrypt per evitare timing attacks sull'enumerazione utenti
    const dummyHash =
      '$2b$12$invalidsaltinvalidsaltinvalid00000000000000000000000000';
    const valid = await bcrypt.compare(pass, user?.password ?? dummyHash);
    if (!user || !valid) throw new UnauthorizedException('Credenziali non valide');
    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }
}
