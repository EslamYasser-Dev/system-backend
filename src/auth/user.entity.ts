import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  OneToMany, 
  CreateDateColumn, 
  UpdateDateColumn, 
  DeleteDateColumn,
  Index,
  BeforeInsert,
  BeforeUpdate
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { WalletTransaction } from '../wallet/wallet-transaction.entity';
import { UserRole } from './user-role.enum';

@Entity('users')
@Index(['email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ name: 'password_hash' })
  @Exclude()
  passwordHash!: string;

  @Column({ select: false, nullable: true })
  @Exclude()
  password?: string;

  @Column({ 
    type: 'decimal', 
    precision: 12, 
    scale: 2, 
    default: 0,
    unsigned: true 
  })
  walletBalance!: number;

  @Column({ 
    type: 'enum', 
    enum: UserRole, 
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @OneToMany(() => WalletTransaction, transaction => transaction.user)
  transactions!: WalletTransaction[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.passwordHash = await bcrypt.hash(this.password, await bcrypt.genSalt(10));
      this.password = undefined;
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash);
  }

  // For backward compatibility
  @Column({ nullable: true })
  group?: string;

  get groupName(): string {
    return this.group || this.role;
  }
}