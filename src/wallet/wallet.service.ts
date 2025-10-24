import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { WalletTransaction } from './wallet-transaction.entity';
import { User } from '../auth/user.entity';
import { TransactionType } from './wallet-transaction.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(WalletTransaction)
    private readonly transactionRepository: Repository<WalletTransaction>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.walletBalance;
  }

  async deposit(userId: string, amount: number, description?: string): Promise<WalletTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const user = await transactionalEntityManager.findOne(User, { where: { id: userId }, lock: { mode: 'pessimistic_write' } });
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.walletBalance = Number(user.walletBalance) + amount;
      await transactionalEntityManager.save(user);

      const transaction = new WalletTransaction({
        amount,
        type: TransactionType.DEPOSIT,
        description: description || 'Wallet deposit',
        userId,
      });

      return transactionalEntityManager.save(WalletTransaction, transaction);
    });
  }

  async withdraw(userId: string, amount: number, description?: string): Promise<WalletTransaction> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const user = await transactionalEntityManager.findOne(User, { where: { id: userId }, lock: { mode: 'pessimistic_write' } });
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (Number(user.walletBalance) < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      user.walletBalance = Number(user.walletBalance) - amount;
      await transactionalEntityManager.save(user);

      const transaction = new WalletTransaction({
        amount,
        type: TransactionType.WITHDRAWAL,
        description: description || 'Wallet withdrawal',
        userId,
      });

      return transactionalEntityManager.save(WalletTransaction, transaction);
    });
  }

  async getTransactions(userId: string, limit = 10, offset = 0): Promise<{ transactions: WalletTransaction[]; total: number }> {
    const [transactions, total] = await this.transactionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return { transactions, total };
  }

  // Internal method to process payments
  async processPayment(
    userId: string, 
    amount: number, 
    orderId: string,
    description?: string
  ): Promise<WalletTransaction> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const user = await transactionalEntityManager.findOne(User, { where: { id: userId }, lock: { mode: 'pessimistic_write' } });
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (Number(user.walletBalance) < amount) {
        throw new BadRequestException('Insufficient funds');
      }

      user.walletBalance = Number(user.walletBalance) - amount;
      await transactionalEntityManager.save(user);

      const transaction = new WalletTransaction({
        amount,
        type: TransactionType.PAYMENT,
        description: description || `Payment for order ${orderId}`,
        userId,
        metadata: { orderId },
      });

      return transactionalEntityManager.save(WalletTransaction, transaction);
    });
  }

  // Internal method to process earnings for merchants
  async processEarnings(
    userId: string, 
    amount: number, 
    orderId: string,
    description?: string
  ): Promise<WalletTransaction> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const user = await transactionalEntityManager.findOne(User, { where: { id: userId }, lock: { mode: 'pessimistic_write' } });
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.walletBalance = Number(user.walletBalance) + amount;
      await transactionalEntityManager.save(user);

      const transaction = new WalletTransaction({
        amount,
        type: TransactionType.EARNING,
        description: description || `Earnings from order ${orderId}`,
        userId,
        metadata: { orderId },
      });

      return transactionalEntityManager.save(WalletTransaction, transaction);
    });
  }
}
