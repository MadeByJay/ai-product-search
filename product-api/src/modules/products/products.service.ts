import { Injectable, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from '../products/repos/products.repository';

@Injectable()
export class ProductsService {
  constructor(private readonly products: ProductsRepository) {}

  async getById(id: string) {
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async getSimilar(id: string, limit = 12) {
    // Ensure the base product exists; otherwise return 404
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    return this.products.similar(id, Math.max(1, Math.min(50, limit)));
  }
}
