// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Endpoint: POST /auth/login
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  // (Optional) Endpoint: POST /auth/register
  // Only for initial setup or admin purpose
  @Post('register')
  async register(
    @Body()
    body: {
      name: string;
      email: string;
      password: string;
      group: string;
    },
  ) {
    return this.authService.register({
      name: body.name,
      email: body.email,
      passwordHash: body.password,
      group: body.group,
    });
  }
}
