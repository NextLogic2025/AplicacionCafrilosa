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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  obtenerPerfil(@Req() _req: AuthRequest) {
    const usuarioId = _req.user?.sub;
    return this.authService.obtenerMiPerfil(usuarioId);
  }

  @Get('usuarios')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  async listarUsuarios(@Req() _req: AuthRequest) {
    return this.authService.listarUsuariosExcluyendoClientes();
  }

  @Get('usuarios/desactivados')
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

  @Put('usuarios/:id/desactivar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  async desactivarUsuario(@Param('id') id: string, @Req() _req: AuthRequest) {
    return this.authService.desactivarUsuario(id, _req.user);
  }

  @Put('usuarios/:id/activar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor')
  async activarUsuario(@Param('id') id: string, @Req() _req: AuthRequest) {
    return this.authService.activarUsuario(id, _req.user);
  }

  // Update user - admin/supervisor can update any user; cliente can update only their own profile
  @Put('usuarios/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'supervisor', 'cliente', 'vendedor','transportista','bodeguero')
  async actualizarUsuario(@Param('id') id: string, @Body() body: Partial<UpdateUsuarioDto>, @Req() _req: AuthRequest) {
    return this.authService.actualizarUsuario(id, body, _req.user);
  }

  // Batch fetch usuarios by IDs (for internal service use)
  @Post('usuarios/batch')
  @UseGuards(JwtAuthGuard)
  async obtenerUsuariosPorIds(@Body() body: { ids: string[] }) {
    return this.authService.obtenerUsuariosPorIds(body.ids || []);
  }

  // Batch fetch usuarios by IDs (for internal service use - NO AUTH)
  @Post('usuarios/batch/internal')
  async obtenerUsuariosPorIdsInternal(@Body() body: { ids: string[] }) {
    return this.authService.obtenerUsuariosPorIds(body.ids || []);
  }
}