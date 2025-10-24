// src/auth/user.entity.ts
import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { WalletTransaction } from '../wallet/wallet-transaction.entity';
import { UserRole } from './user-role.enum';

@Entity()
export class User {
  @PrimaryColumn('uuid')
  id: string = uuid();

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  walletBalance: number;

  @Column({ 
    type: 'enum', 
    enum: UserRole, 
    default: UserRole.USER 
  })
  role: UserRole;

  // For backward compatibility
  @Column({ nullable: true })
  group?: string;

  @OneToMany(() => WalletTransaction, transaction => transaction.user)
  transactions: WalletTransaction[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Getter for backward compatibility
  get groupName(): string {
    return this.group || this.role;
  }
}
