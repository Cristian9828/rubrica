import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { SetupService } from './setup.service';
import { SetupController } from './setup.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [SetupService],
  controllers: [SetupController],
})
export class SetupModule {}
