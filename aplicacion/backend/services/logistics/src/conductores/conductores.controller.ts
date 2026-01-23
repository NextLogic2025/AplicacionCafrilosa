import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConductoresService } from './conductores.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateConductorDto } from './dto/create-conductor.dto';
import { UpdateConductorDto } from './dto/update-conductor.dto';

@ApiTags('Conductores')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('conductores')
export class ConductoresController {
  constructor(private readonly svc: ConductoresService) {}

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
  create(@Body() dto: CreateConductorDto) {
    return this.svc.create(dto as any);
  }

  @Put(':id')
  @Roles('admin', 'supervisor')
  update(@Param('id') id: string, @Body() dto: UpdateConductorDto) {
    return this.svc.update(id, dto as any);
  }

  @Delete(':id')
  @Roles('admin', 'supervisor')
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }
}
