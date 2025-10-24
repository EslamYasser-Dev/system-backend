import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

export class WithdrawDto {
  @ApiProperty({
    description: 'Amount to withdraw',
    minimum: 0.01,
    example: 50.25,
  })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    description: 'Optional description for the withdrawal',
    required: false,
    example: 'Withdrawal for order #123',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
