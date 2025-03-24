// src/employee/employee.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Employee } from './employee.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private employeesRepository: Repository<Employee>,
  ) {}

  async createEmployee(employeeData: Partial<Employee>): Promise<Employee> {
    const employee = this.employeesRepository.create(employeeData);
    return this.employeesRepository.save(employee);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return this.employeesRepository.find();
  }

  async getEmployeeById(id: string): Promise<Employee> {
    const employee = await this.employeesRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  async updateEmployee(
    id: string,
    updateData: Partial<Employee>,
  ): Promise<Employee> {
    await this.employeesRepository.update(id, updateData);
    return this.getEmployeeById(id);
  }

  async deleteEmployee(id: string): Promise<void> {
    const result = await this.employeesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
  }
}
