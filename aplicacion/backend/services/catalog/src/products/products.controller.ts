import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly svc: ProductsService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  create(@Body() dto: Partial<Product>) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  update(@Param('id') id: string, @Body() dto: Partial<Product>) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  remove(@Param('id') id: string) {
    return this.svc.softDelete(id);
  }
}
