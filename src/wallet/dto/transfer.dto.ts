import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, IsUUID, IsOptional } from 'class-validator';

export class TransferDto {
  @ApiProperty({
    description: 'Recipient user ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  toUserId!: string;

  @ApiProperty({
    description: 'Amount to transfer',
    minimum: 0.01,
    example: 25.75,
  })
  @IsNumber()
  @IsPositive()
  amount!: number;

  @ApiProperty({
    description: 'Optional description for the transfer',
    required: false,
    example: 'Payment for services',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
