// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { EmployeeModule } from './employee/employee.module';
import { AttendanceModule } from './attendance/attendance.module';
import { User } from './auth/user.entity';
import { Employee } from './employee/employee.entity';
import { Attendance } from './attendance/attendance.enitiy';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Employee, Attendance],
      synchronize: true, 
    }),
    AuthModule,
    EmployeeModule,
    AttendanceModule,
  ],
  controllers: [AppController],
  providers:[AppService],
})
export class AppModule {}
