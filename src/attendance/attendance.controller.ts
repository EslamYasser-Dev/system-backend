// src/attendance/attendance.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  ParseIntPipe,
  Param,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HR')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  // POST /attendance
  @Post()
  async addAttendance(@Body() body: { employeeId: string; date: string }) {
    return this.attendanceService.addAttendance(body.employeeId, body.date);
  }

  // GET /attendance
  @Get()
  async getAllAttendances() {
    return this.attendanceService.getAllAttendances();
  }

  // GET /attendance/employee/:id
  @Get('employee/:id')
  async getAttendanceByEmployee(@Param('id', ParseIntPipe) id: string) {
    return this.attendanceService.getAttendanceByEmployee(id);
  }
}
