import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  NotFoundException,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './product.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user-role.enum';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Create a new product (merchant only)' })
  @ApiResponse({ status: 201, description: 'The product has been successfully created.', type: Product })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() productData: Partial<Product>, @Req() req): Promise<Product> {
    return this.productsService.create(productData, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all available products' })
  @ApiResponse({ status: 200, description: 'Return all products.', type: [Product] })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    const skip = (page - 1) * limit;
    return this.productsService.findAll({
      skip,
      take: limit,
      where: { isActive: true, availableUnits: 0 },
      order: { createdAt: 'DESC' },
    });
  }

  @Get('merchant')
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Get products for the current merchant' })
  @ApiResponse({ status: 200, description: 'Return merchant products.', type: [Product] })
  getMerchantProducts(@Req() req) {
    return this.productsService.getMerchantProducts(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific product by ID' })
  @ApiResponse({ status: 200, description: 'Return the product.', type: Product })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(id, true);
  }

  @Put(':id')
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Update a product (merchant only)' })
  @ApiResponse({ status: 200, description: 'The product has been successfully updated.', type: Product })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  update(
    @Param('id') id: string,
    @Body() updateData: Partial<Product>,
    @Req() req,
  ): Promise<Product> {
    return this.productsService.update(id, updateData, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.MERCHANT)
  @ApiOperation({ summary: 'Delete a product (merchant only)' })
  @ApiResponse({ status: 200, description: 'The product has been successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async remove(@Param('id') id: string, @Req() req): Promise<void> {
    await this.productsService.remove(id, req.user.id);
  }
}
