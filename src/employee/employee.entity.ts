import { Entity, Column, PrimaryColumn } from 'typeorm';
import { ulid } from 'ulid';

@Entity()
export class Employee {
  @PrimaryColumn('ulid')
  id: string = ulid();

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: 'Normal Employee' })
  group: string;
}