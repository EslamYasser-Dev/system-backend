import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  Logger,
  Inject,
  forwardRef,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Order, OrderStatus, PaymentStatus, PaymentMethod, OrderItem } from './order.entity';
import { User } from '../auth/user.entity';
import { ProductsService } from '../products/products.service';
import { WalletService } from '../wallet/wallet.service';
import { v4 as uuid } from 'uuid';
import { UserRole } from '../auth/user-role.enum';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly logger = new Logger(OrdersService.name);
  private stripe: Stripe;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly productsService: ProductsService,
    @Inject(forwardRef(() => WalletService))
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
    private dataSource: DataSource,
  ) {}

  onModuleInit() {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
    }
  }

  private generateOrderNumber(): string {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }

  async createOrder(
    userId: string,
    items: Array<{ productId: string; quantity: number }>,
    paymentMethod: PaymentMethod,
  ): Promise<Order> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      // Get products with quantities
      const productIds = items.map((item) => item.productId);
      const products = await this.productsService.findAll({
        where: { id: In(productIds) },
        relations: ['merchant'],
      });

      if (products.items.length !== items.length) {
        throw new NotFoundException('One or more products not found');
      }

      // Validate quantities and calculate total
      const orderItems: OrderItem[] = [];
      let totalAmount = 0;
      let merchantId: string | null = null;

      for (const item of items) {
        const product = products.items.find((p) => p.id === item.productId);
        if (!product) continue;

        // Check if all items are from the same merchant
        if (merchantId && product.merchantId !== merchantId) {
          throw new BadRequestException('All products must be from the same merchant');
        }
        merchantId = product.merchantId;

        // Check stock
        if (product.availableUnits < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product: ${product.name}. Available: ${product.availableUnits}, Requested: ${item.quantity}`,
          );
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        const orderItem = this.orderItemRepository.create({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: itemTotal,
        });

        orderItems.push(orderItem);
      }

      if (!merchantId) {
        throw new BadRequestException('No valid products in order');
      }

      // Create the order
      const order = this.orderRepository.create({
        orderNumber: this.generateOrderNumber(),
        userId,
        merchantId,
        totalAmount,
        status: OrderStatus.PENDING,
        paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        items: orderItems,
      });

      const savedOrder = await transactionalEntityManager.save(Order, order);

      // Process payment based on method
      if (paymentMethod === PaymentMethod.WALLET) {
        await this.processWalletPayment(userId, savedOrder.id, totalAmount);
      } else if (paymentMethod === PaymentMethod.STRIPE) {
        await this.createStripePaymentIntent(savedOrder);
      }
      // Add other payment methods here

      return savedOrder;
    });
  }

  private async processWalletPayment(
    userId: string,
    orderId: string,
    amount: number,
  ): Promise<void> {
    try {
      await this.walletService.processPayment(
        userId,
        amount,
        orderId,
        `Payment for order ${orderId}`,
      );

      await this.updateOrderStatus(orderId, {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.PROCESSING,
      });

      // Fulfill the order
      await this.fulfillOrder(orderId);
    } catch (error) {
      this.logger.error(`Wallet payment failed for order ${orderId}:`, error);
      await this.updateOrderStatus(orderId, {
        paymentStatus: PaymentStatus.FAILED,
        status: OrderStatus.FAILED,
      });
      throw new BadRequestException('Payment failed: ' + error.message);
    }
  }

  private async createStripePaymentIntent(order: Order): Promise<void> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(order.totalAmount * 100), // Convert to cents
        currency: 'usd',
        metadata: { orderId: order.id },
        description: `Order #${order.orderNumber}`,
        payment_method_types: ['card'],
      });

      await this.orderRepository.update(order.id, {
        paymentId: paymentIntent.id,
        paymentDetails: {
          clientSecret: paymentIntent.client_secret,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create Stripe payment intent:', error);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  async confirmStripePayment(
    paymentIntentId: string,
  ): Promise<{ success: boolean; orderId?: string }> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured');
    }

    const order = await this.orderRepository.findOne({
      where: { paymentId: paymentIntentId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId,
      );

      if (paymentIntent.status === 'succeeded') {
        await this.updateOrderStatus(order.id, {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.PROCESSING,
          paymentDetails: {
            ...order.paymentDetails,
            paymentIntent,
          },
        });

        // Fulfill the order
        await this.fulfillOrder(order.id);

        return { success: true, orderId: order.id };
      } else {
        await this.updateOrderStatus(order.id, {
          paymentStatus: PaymentStatus.FAILED,
          status: OrderStatus.FAILED,
          paymentDetails: {
            ...order.paymentDetails,
            paymentIntent,
          },
        });

        return { success: false, orderId: order.id };
      }
    } catch (error) {
      this.logger.error('Error confirming Stripe payment:', error);
      throw new BadRequestException('Error confirming payment');
    }
  }

  private async fulfillOrder(orderId: string): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('Order is not in processing status');
    }

    try {
      // Update product stock
      for (const item of order.items) {
        await this.productsService.reduceStock(item.productId, item.quantity);
      }

      // Update order status
      await this.updateOrderStatus(orderId, {
        status: OrderStatus.COMPLETED,
      });

      // Credit merchant's wallet
      await this.walletService.processEarnings(
        order.merchantId,
        order.totalAmount,
        order.id,
        `Earnings from order ${order.orderNumber}`,
      );
    } catch (error) {
      this.logger.error(`Failed to fulfill order ${orderId}:`, error);
      // TODO: Implement order failure handling and refund logic
      throw error;
    }
  }

  async cancelOrder(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    // If payment was made, process refund
    if (order.paymentStatus === PaymentStatus.PAID) {
      // Implement refund logic based on payment method
      if (order.paymentMethod === PaymentMethod.WALLET) {
        await this.walletService.processEarnings(
          order.userId,
          order.totalAmount,
          order.id,
          `Refund for cancelled order ${order.orderNumber}`,
        );
      }
      // Add other payment method refunds here
    }

    // Update order status
    return this.updateOrderStatus(orderId, {
      status: OrderStatus.CANCELLED,
      paymentStatus:
        order.paymentStatus === PaymentStatus.PAID
          ? PaymentStatus.REFUNDED
          : order.paymentStatus,
    });
  }

  async findUserOrders(
    userId: string,
    status?: OrderStatus,
  ): Promise<Order[]> {
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    return this.orderRepository.find({
      where,
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMerchantOrders(
    merchantId: string,
    status?: OrderStatus,
  ): Promise<Order[]> {
    const where: any = { merchantId };
    if (status) {
      where.status = status;
    }

    return this.orderRepository.find({
      where,
      relations: ['items', 'items.product', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOrderById(orderId: string, userId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: [
        { id: orderId, userId },
        { id: orderId, merchantId: userId },
      ],
      relations: ['items', 'items.product', 'user', 'merchant'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private async updateOrderStatus(
    orderId: string,
    updateData: Partial<Order>,
  ): Promise<Order> {
    await this.orderRepository.update(orderId, updateData);
    return this.orderRepository.findOneOrFail({ where: { id: orderId } });
  }
}
