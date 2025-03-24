// src/auth/user.entity.ts
import { Entity, Column, PrimaryColumn } from 'typeorm';
import { ulid } from 'ulid';
@Entity()
export class User {
  @PrimaryColumn()
  id:string = ulid();

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({default:"employee"})
  group: string;
}
