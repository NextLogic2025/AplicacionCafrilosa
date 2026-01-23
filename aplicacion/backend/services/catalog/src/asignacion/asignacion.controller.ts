import { Controller, Get, Post, Delete, Put, Body, Param, UseGuards, ParseIntPipe, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AsignacionService } from './asignacion.service';
import { CreateAsignacionDto } from './dto/create-asignacion.dto';

@ApiTags('Asignación de Vendedores')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('asignacion')
export class AsignacionController {
  constructor(private svc: AsignacionService) {}

  @Get()
  
  @Roles('admin', 'supervisor')
  @ApiOperation({ summary: 'Listar todas las asignaciones activas' })
  list() {
    return this.svc.findAll();
  }

  @Post()
  @Roles('admin', 'supervisor')
  @ApiOperation({ summary: 'Asignar vendedor a zona', description: 'Valida que solo exista un vendedor principal por zona.' })
  @ApiResponse({ status: 201, description: 'Asignación creada.' })
  @ApiResponse({ status: 400, description: 'Conflicto: Ya existe un principal.' })
  create(@Body() dto: CreateAsignacionDto) { // <--- Usamos DTO aquí
    return this.svc.create(dto);
  }

  @Put(':id')
  @Roles('admin', 'supervisor')
  @ApiOperation({ summary: 'Actualizar asignación' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Partial<CreateAsignacionDto>) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'supervisor')
  @ApiOperation({ summary: 'Eliminar asignación (Soft Delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}