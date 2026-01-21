import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConductoresService } from './conductores.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Conductores')
@Controller('conductores')
export class ConductoresController {
  constructor(private readonly svc: ConductoresService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor')
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor')
  create(@Body() dto: any) {
    return this.svc.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'supervisor')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
