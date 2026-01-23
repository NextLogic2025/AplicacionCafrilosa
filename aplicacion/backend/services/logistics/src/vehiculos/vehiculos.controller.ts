import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { VehiculosService } from './vehiculos.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Vehiculos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('vehiculos')
export class VehiculosController {
  constructor(private readonly svc: VehiculosService) {}

  @Get()
  @Roles('admin', 'supervisor')
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  @Roles('admin', 'supervisor')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @Roles('admin', 'supervisor')
  create(@Body() dto: any) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @Roles('admin', 'supervisor')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin', 'supervisor')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
