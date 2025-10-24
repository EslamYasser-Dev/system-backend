import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, FindManyOptions } from 'typeorm';
import { Product } from './product.entity';
import { User } from '../auth/user.entity';
import { UserRole } from '../auth/user-role.enum';

type ProductQuery = FindManyOptions<Product> & {
  where?: FindOptionsWhere<Product> | FindOptionsWhere<Product>[];
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(productData: Partial<Product>, merchant: User): Promise<Product> {
    if (merchant.role !== UserRole.MERCHANT) {
      throw new ForbiddenException('Only merchants can create products');
    }

    const product = this.productRepository.create({
      ...productData,
      merchant,
      merchantId: merchant.id,
    });

    return this.productRepository.save(product);
  }

  async update(
    id: string,
    updateData: Partial<Product>,
    userId: string,
    isAdmin = false,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({ 
      where: { id },
      relations: ['merchant']
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Only the merchant who owns the product or an admin can update it
    if (product.merchantId !== userId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to update this product');
    }

    // Prevent changing the merchant ID
    if (updateData.merchantId && updateData.merchantId !== product.merchantId && !isAdmin) {
      throw new ForbiddenException('Cannot change product ownership');
    }

    Object.assign(product, updateData);
    return this.productRepository.save(product);
  }

  async findOne(id: string, includeMerchant = false): Promise<Product> {
    const relations = includeMerchant ? ['merchant'] : [];
    const product = await this.productRepository.findOne({
      where: { id },
      relations,
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findAll(
    options: ProductQuery = {},
    includeMerchant = false,
  ): Promise<{ items: Product[]; total: number }> {
    const [items, total] = await this.productRepository.findAndCount({
      ...options,
      relations: includeMerchant ? ['merchant'] : [],
    });

    return { items, total };
  }

  async remove(id: string, userId: string, isAdmin = false): Promise<void> {
    const product = await this.productRepository.findOne({ 
      where: { id },
      relations: ['merchant']
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Only the merchant who owns the product or an admin can delete it
    if (product.merchantId !== userId && !isAdmin) {
      throw new ForbiddenException('You do not have permission to delete this product');
    }

    await this.productRepository.remove(product);
  }

  async reduceStock(productId: string, quantity: number): Promise<void> {
    const result = await this.productRepository
      .createQueryBuilder()
      .update(Product)
      .set({
        availableUnits: () => `available_units - ${quantity}`,
      })
      .where('id = :id', { id: productId })
      .andWhere('available_units >= :quantity', { quantity })
      .execute();

    if (result.affected === 0) {
      throw new BadRequestException('Insufficient stock or product not found');
    }
  }

  async increaseStock(productId: string, quantity: number): Promise<void> {
    await this.productRepository
      .createQueryBuilder()
      .update(Product)
      .set({
        availableUnits: () => `available_units + ${quantity}`,
      })
      .where('id = :id', { id: productId })
      .execute();
  }

  async getMerchantProducts(merchantId: string): Promise<Product[]> {
    return this.productRepository.find({
      where: { merchantId },
      order: { createdAt: 'DESC' },
    });
  }
}
