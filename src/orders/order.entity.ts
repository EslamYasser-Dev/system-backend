import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { User } from '../auth/user.entity';
import { Product } from '../products/product.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  WALLET = 'wallet',
  STRIPE = 'stripe',
  CHECKOUT = 'checkout',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

@Entity('order_items')
export class OrderItem {
  @PrimaryColumn('uuid')
  id: string = uuid();

  @Column('uuid')
  orderId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column('uuid')
  productId!: string;

  @Column('int')
  quantity!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice!: number;
}

@Entity('orders')
export class Order {
  @PrimaryColumn('uuid')
  id: string = uuid();

  @Column('varchar', { length: 50, unique: true })
  orderNumber!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column('uuid')
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'merchantId' })
  merchant!: User;

  @Column('uuid')
  merchantId!: string;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  @Column({ nullable: true })
  paymentId!: string;

  @Column({ type: 'jsonb', nullable: true })
  paymentDetails!: Record<string, any>;

  @OneToMany(() => OrderItem, item => item.orderId, { cascade: true })
  items!: OrderItem[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
    updatedAt!: Date;

  // Virtual property to check if order is paid
  get isPaid(): boolean {
    return this.paymentStatus === PaymentStatus.PAID;
  }

  // Virtual property to check if order is completed
  get isCompleted(): boolean {
    return this.status === OrderStatus.COMPLETED;
  }
}
