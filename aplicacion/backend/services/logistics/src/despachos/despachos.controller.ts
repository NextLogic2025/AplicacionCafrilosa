import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DespachosService } from './despachos.service';
import { CreateDespachoDto } from './dto/create-despacho.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Despachos')
@Controller('despachos')
export class DespachosController {
  constructor(private readonly svc: DespachosService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor', 'bodeguero')
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor', 'transportista')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor')
  create(@Body() dto: CreateDespachoDto) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor')
  update(@Param('id') id: string, @Body() dto: Partial<CreateDespachoDto>) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
