import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role.enum';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('wallet')
@ApiBearerAuth()
@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@Roles(UserRole.USER, UserRole.MERCHANT)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the current wallet balance',
    schema: {
      type: 'object',
      properties: {
        balance: { type: 'number', example: 1000.5 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  async getBalance(@Req() req: any) {
    return { balance: await this.walletService.getBalance(req.user.id) };
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Deposit funds to wallet' })
  @ApiBody({ type: DepositDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully deposited funds',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input',
  })
  async deposit(@Req() req: any, @Body() depositDto: DepositDto) {
    return this.walletService.deposit(
      req.user.id,
      depositDto.amount,
      depositDto.description,
    );
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Withdraw funds from wallet' })
  @ApiBody({ type: WithdrawDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully withdrawn funds',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or insufficient funds',
  })
  async withdraw(@Req() req: any, @Body() withdrawDto: WithdrawDto) {
    return this.walletService.withdraw(
      req.user.id,
      withdrawDto.amount,
      withdrawDto.description,
    );
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Get wallet transaction history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns paginated transaction history',
  })
  async getTransactions(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number = 10,
  ) {
    return this.walletService.getTransactions(req.user.id, page, limit);
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer funds to another user' })
  @ApiBody({ type: TransferDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully transferred funds',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input or insufficient funds',
  })
  async transfer(@Req() req: any, @Body() transferDto: TransferDto) {
    return this.walletService.transfer(
      req.user.id,
      transferDto.toUserId,
      transferDto.amount,
      transferDto.description,
    );
  }
}
