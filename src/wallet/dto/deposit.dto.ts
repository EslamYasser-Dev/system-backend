import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';

export class DepositDto {
  @ApiProperty({
    description: 'Amount to deposit',
    minimum: 0.01,
    example: 100.50,
  })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    description: 'Optional description for the transaction',
    required: false,
    example: 'Initial deposit',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
