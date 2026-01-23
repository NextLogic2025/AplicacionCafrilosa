import { 
  Body, Controller, Delete, Get, Param, Post, Put, UseGuards, 
  ParseIntPipe, HttpStatus 
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/create-category.dto';

@ApiTags('Categorías')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly svc: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorías activas' })
  @ApiResponse({ status: 200, description: 'Lista recuperada', type: [Category] })
  findAll() {
    return this.svc.findAll();
  }

  @Get('deleted')
  @Roles('admin', 'supervisor')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar papelera de reciclaje (Soft Deleted)' })
  findDeleted() {
    return this.svc.findDeleted();
  }

  @Get(':id')
  @Roles('admin', 'supervisor', 'vendedor', 'bodeguero', 'cliente', 'transportista')
  @ApiOperation({ summary: 'Obtener detalle de categoría' })
  @ApiResponse({ status: 404, description: 'Categoría no encontrada' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  @Roles('admin', 'supervisor')
  @ApiOperation({ summary: 'Crear nueva categoría' })
  @ApiResponse({ status: 201, description: 'Creado exitosamente', type: Category })
  create(@Body() dto: CreateCategoryDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @Roles('admin', 'supervisor')
  @ApiOperation({ summary: 'Actualizar categoría' })
  @ApiResponse({ status: 200, description: 'Categoría actualizada', type: Category })
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() dto: UpdateCategoryDto
  ) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'supervisor')
  @ApiOperation({ summary: 'Eliminar categoría (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Categoría eliminada (soft)', schema: { example: { success: true, id: 1, deleted_at: '2026-01-18T00:00:00Z' } } })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.softDelete(id);
  }

  @Post(':id/restore')
  @Roles('admin', 'supervisor')
  @ApiOperation({ summary: 'Restaurar categoría eliminada' })
  @ApiResponse({ status: 200, description: 'Categoría restaurada', type: Category })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.svc.restore(id);
  }
}