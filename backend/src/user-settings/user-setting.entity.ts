import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('user_settings')
export class UserSetting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', unique: true })
  userId: number;

  @Column({ default: 'it' })
  language: string;

  @Column({ default: 'system' })
  theme: string;

  @Column({ name: 'accent_color', default: 'blue' })
  accentColor: string;
}
