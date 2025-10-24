import { Controller, Get, Post, Body, UseGuards, Req, Param, ParseIntPipe, Query, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role.enum';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.USER, UserRole.MERCHANT)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@Req() req:any) {
    return { balance: await this.walletService.getBalance(req.user.id) };
  }

  @Post('deposit')
  async deposit(
    @Req() req:any,
    @Body('amount') amount: number,
    @Body('description') description?: string,
  ) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Valid amount is required');
    }
    return this.walletService.deposit(req.user.id, amount, description);
  }

  @Post('withdraw')
  async withdraw(
    @Req() req:any,
    @Body('amount') amount: number,
    @Body('description') description?: string,
  ) {
    if (!amount || amount <= 0) {
      throw new BadRequestException('Valid amount is required');
    }
    return this.walletService.withdraw(req.user.id, amount, description);
  }

  @Get('transactions')
  async getTransactions(
    @Req() req:any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 10,
    @Query('offset', new ParseIntPipe({ optional: true })) offset = 0,
  ) {
    return this.walletService.getTransactions(req.user.id, limit, offset);
  }
}
