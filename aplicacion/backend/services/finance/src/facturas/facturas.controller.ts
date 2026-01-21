import { Controller, Get, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { FacturasService } from './facturas.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@ApiTags('Facturas')
@ApiBearerAuth()
@Controller('facturas')
export class FacturasController {
  constructor(private readonly facturasService: FacturasService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('supervisor', 'bodeguero', 'transportista', 'cliente')
  findAll(@Req() req: any) {
    const rawRole = req.user?.role;
    const roles = Array.isArray(rawRole) ? rawRole.map((r: any) => String(r).toLowerCase()) : [String(rawRole || '').toLowerCase()];
    const isCliente = roles.includes('cliente');
    const userId = req.user?.userId;
    if (isCliente) return this.facturasService.findAll(userId);
    return this.facturasService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('supervisor', 'bodeguero', 'transportista', 'cliente')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const factura = await this.facturasService.findOne(id);
    if (!factura) return null;

    const rawRole = req.user?.role;
    const roles = Array.isArray(rawRole) ? rawRole.map((r: any) => String(r).toLowerCase()) : [String(rawRole || '').toLowerCase()];
    const isCliente = roles.includes('cliente');
    const userId = req.user?.userId;
    if (isCliente && factura.clienteId !== userId) {
      throw new ForbiddenException('No autorizado para ver esta factura');
    }

    return factura;
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'supervisor')
  create(@Body() createDto: any) {
    return this.facturasService.create(createDto);
  }
}
