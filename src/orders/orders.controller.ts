import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Req,
  Query,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto } from './dto/create-order.dto';

@ApiTags('orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @Req() req: any,
  ) {
    try {
      const order = await this.ordersService.createOrder(
        req.user.id,
        createOrderDto.items,
        createOrderDto.paymentMethod,
      );

      return {
        success: true,
        data: order,
        message: 'Order created successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Get()
  @Roles(UserRole.USER, UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get user\'s orders' })
  @ApiResponse({ status: 200, description: 'Returns user orders' })
  async getUserOrders(
    @Req() req: any,
    @Query('status') status?: string,
  ) {
    const isMerchant = req.user.role === UserRole.MERCHANT;
    
    const orders = isMerchant
      ? await this.ordersService.findMerchantOrders(req.user.id, status as any)
      : await this.ordersService.findUserOrders(req.user.id, status as any);

    return {
      success: true,
      data: orders,
    };
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Returns order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async getOrderById(@Param('id') orderId: string, @Req() req: any) {
    try {
      const order = await this.ordersService.findOrderById(orderId, req.user.id);
      return {
        success: true,
        data: order,
      };
    } catch (error) {
      throw new NotFoundException('Order not found');
    }
  }

  @Post(':id/cancel')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelOrder(@Param('id') orderId: string, @Req() req: any) {
    try {
      const order = await this.ordersService.cancelOrder(orderId, req.user.id);
      return {
        success: true,
        data: order,
        message: 'Order cancelled successfully',
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post('stripe/webhook')
  @ApiOperation({ summary: 'Stripe webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed' })
  async handleStripeWebhook(@Req() req: any) {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = this.ordersService['stripe'].webhooks.constructEvent(
        req.rawBody,
        sig,
        endpointSecret!,
      );
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await this.ordersService.confirmStripePayment(paymentIntent.id);
        break;
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }
}
