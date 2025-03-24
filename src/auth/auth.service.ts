// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from './user.entity';
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
    if (user && bcrypt.compareSync(password, user.passwordHash) && user.group === 'ADMIN' ) {
     return {email:user.email, id: user.id, roles:user.group}
    }else{
      throw new UnauthorizedException('Invalid credentials or UnAuthrized credentials');
    }
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, roles:user.roles };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(userData: Partial<User>) {
    const user = new User();
    user.name = userData.name;
    user.email = userData.email;
    user.passwordHash = bcrypt.hashSync(userData.passwordHash, 10);
    user.group = userData.group ;
    return this.usersRepository.save(user);
  }
}
