import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../auth/user.entity';
import { v4 as uuid } from 'uuid';

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAWAL = 'withdrawal',
  PAYMENT = 'payment',
  EARNING = 'earning',
  REFUND = 'refund',
  TRANSFER_OUT = 'transfer_out',
  TRANSFER_IN = 'transfer_in',
  FEE = 'fee'
}

@Entity('wallet_transactions')
export class WalletTransaction {
  @PrimaryColumn('uuid')
  id: string = uuid();

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  relatedUserId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'enum', enum: TransactionType })
  type!: TransactionType;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  balanceAfter!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @ManyToOne(() => User, user => user.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  constructor(partial?: Partial<WalletTransaction>) {
    Object.assign(this, partial);
  }
}
