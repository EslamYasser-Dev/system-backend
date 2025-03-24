// src/attendance/attendance.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from './attendance.enitiy';
import { Repository } from 'typeorm';
import { EmployeeService } from '../employee/employee.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    private employeeService: EmployeeService,
  ) {}

  async addAttendance(employeeId: number, date: string): Promise<Attendance> {
    const employee = await this.employeeService.getEmployeeById(employeeId);
    const attendance = this.attendanceRepository.create({ employee, date });
    return this.attendanceRepository.save(attendance);
  }

  async getAttendanceByEmployee(employeeId: number): Promise<Attendance[]> {
    return this.attendanceRepository.find({
      where: { employee: { id: employeeId } },
    });
  }

  async getAllAttendances(): Promise<Attendance[]> {
    return this.attendanceRepository.find();
  }
}
