import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/guards/roles.decorator';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('HR')
export class EmployeeController {
  constructor(private employeeService: EmployeeService) {}

  // POST /employees
  @Post()
  async createEmployee(
    @Body() body: { name: string; email: string; group: string },
  ) {
    return this.employeeService.createEmployee(body);
  }

  // GET /employees
  @Get()
  async getAllEmployees() {
    return this.employeeService.getAllEmployees();
  }

  // GET /employees/:id
  @Get(':id')
  async getEmployeeById(@Param('id') id: string) {
    return this.employeeService.getEmployeeById(id);
  }

  // PUT /employees/:id
  @Put(':id')
  async updateEmployee(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; group?: string },
  ) {
    return this.employeeService.updateEmployee(id, body);
  }

  // DELETE /employees/:id
  @Delete(':id')
  async deleteEmployee(@Param('id') id: string) {
    return this.employeeService.deleteEmployee(id);
  }
}