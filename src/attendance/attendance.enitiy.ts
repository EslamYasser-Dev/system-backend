// src/attendance/attendance.entity.ts
import { Entity,Column, ManyToOne, PrimaryColumn } from 'typeorm';
import { Employee } from '../employee/employee.entity';
import { ulid } from 'ulid';

@Entity()
export class Attendance {
  @PrimaryColumn('ulid')
  id: string = ulid();

  @ManyToOne(() => Employee, (employee) => employee.id, { eager: true })
  employee: Employee;

  @Column({ type: 'date' })
  date: string;
}


