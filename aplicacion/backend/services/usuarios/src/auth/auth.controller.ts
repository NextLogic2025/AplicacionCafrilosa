// placeholder (Auth controller)
import { Controller, Get, Post, Req, UseGuards, Put, Param, Body } from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';

interface JwtUser {
  sub: string;
  email?: string;
  rolId?: string | number;
  role?: string | string[];
}

type AuthRequest = Request & { user?: JwtUser };

@Controller('usuarios')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  obtenerPerfil(@Req() _req: AuthRequest) {
    const usuarioId = _req.user?.sub;
    return this.authService.obtenerMiPerfil(usuarioId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  async listarUsuarios(@Req() _req: AuthRequest) {
    return this.authService.listarUsuariosExcluyendoClientes();
  }

  @Get('desactivados')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  async listarUsuariosDesactivados(@Req() _req: AuthRequest) {
    return this.authService.listarUsuariosDesactivados();
  }

  @Get('vendedores')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  async listarVendedores(@Req() _req: AuthRequest) {
    return this.authService.listarVendedores();
  }

  @Put(':id/desactivar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  async desactivarUsuario(@Param('id') id: string, @Req() _req: AuthRequest) {
    return this.authService.desactivarUsuario(id, _req.user);
  }

  @Put(':id/activar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  async activarUsuario(@Param('id') id: string, @Req() _req: AuthRequest) {
    return this.authService.activarUsuario(id, _req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor', 'cliente', 'vendedor','transportista','bodeguero')
  async actualizarUsuario(@Param('id') id: string, @Body() body: Partial<UpdateUsuarioDto>, @Req() _req: AuthRequest) {
    return this.authService.actualizarUsuario(id, body, _req.user);
  }

  @Post('batch/internal')
  async obtenerUsuariosPorIdsInternal(@Body() body: { ids: string[] }) {
    return this.authService.obtenerUsuariosPorIds(body.ids || []);
  }
}