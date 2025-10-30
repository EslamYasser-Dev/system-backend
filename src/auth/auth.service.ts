import { 
  Injectable, 
  UnauthorizedException, 
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserRole } from './user-role.enum';
import { RegisterDto } from './dto/register.dto';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'passwordHash', 'role', 'isActive', 'name']
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: User): Promise<LoginResponse> {
    const roles = Array.isArray(user.role) ? user.role : [user.role || UserRole.USER];
    
    const payload = { 
      email: user.email, 
      sub: user.id,
      roles,
    };
    
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });
    
    await this.usersRepository.update(user.id, { updatedAt: new Date() });
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: parseInt(process.env.JWT_EXPIRES_IN || '3600', 10),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    };
  }

  async register(registerDto: RegisterDto) {
    if (!registerDto.email || !registerDto.password) {
      throw new BadRequestException('Email and password are required');
    }

    if (registerDto.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    const existingUser = await this.usersRepository.findOne({ 
      where: { email: registerDto.email } 
    });
    
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
    
    // Let User entity handle password hashing via @BeforeInsert()
    const user = this.usersRepository.create({
      name: registerDto.name,
      email: registerDto.email,
      password: registerDto.password, // plain text - entity will hash it
      role: registerDto.role || UserRole.USER,
      isActive: true,
      walletBalance: 0,
    });
    
    await this.usersRepository.save(user);
    
    const { passwordHash, ...result } = user;
    return result;
  }

  async refreshToken(userId: string): Promise<LoginResponse> {
    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
      select: ['id', 'email', 'name', 'role', 'isActive']
    });
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }
    
    return this.login(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('New password must be at least 8 characters long');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
      select: ['id', 'passwordHash', 'isActive']
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }
    
    const isPasswordValid = await user.validatePassword(currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    
    // Use plain password field to let entity handle hashing
    user.password = newPassword;
    await this.usersRepository.save(user);
    
    this.logger.log(`Password updated for user ${userId}`);
    return { message: 'Password updated successfully' };
  }
}