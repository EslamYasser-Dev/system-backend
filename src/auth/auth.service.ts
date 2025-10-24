// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersRepository.findOne({ where: { email } });
    
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // For backward compatibility, check both role and group
    const userRole = user.role || user.group as UserRole;
    
    return {
      email: user.email,
      id: user.id,
      role: userRole,
      roles: [userRole] // Keep roles as array for JWT compatibility
    };
  }

  async login(user: any) {
    const payload = { 
      email: user.email, 
      sub: user.id, 
      role: user.role,
      roles: user.roles 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      }
    };
  }

  async register(userData: Partial<User>) {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({ 
      where: { email: userData.email } 
    });
    
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    const user = new User();
    user.name = userData.name;
    user.email = userData.email;
    user.passwordHash = await bcrypt.hash(userData.passwordHash, 10);
    
    // Set role, default to USER if not provided
    user.role = userData.role || UserRole.USER;
    
    // For backward compatibility
    user.group = user.role;
    
    const savedUser = await this.usersRepository.save(user);
    
    // Don't return password hash
    const { passwordHash, ...result } = savedUser;
    return result;
  }
}
