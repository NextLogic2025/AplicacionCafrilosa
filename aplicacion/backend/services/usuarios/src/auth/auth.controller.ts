// placeholder (Auth controller)
import { Controller, Post, Body, Get, Req, UseGuards, Put, Param } from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';

interface JwtUser {
  sub: string;
  email?: string;
  rolId?: string | number;
  role?: string | string[];
}

type AuthRequest = Request & { user?: JwtUser };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('registro')
  registrar(@Body() dto: CreateUsuarioDto) {
    return this.authService.registro(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() _req: AuthRequest) {
    const ip = _req.ip;
    const userAgent = _req.get('user-agent');
    return this.authService.login(dto, ip, userAgent);
  }

  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto, @Req() _req: AuthRequest) {
    const ip = _req.ip;
    const userAgent = _req.get('user-agent');
    return this.authService.refreshTokens(body.refresh_token, body.device_id, ip, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() _req: AuthRequest) {
    const usuarioId = _req.user?.sub;
    const ip = _req.ip;
    const userAgent = _req.get('user-agent');
    const authHeader = _req.headers['authorization'] || '';
    const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined;
    return this.authService.logout(usuarioId, token, ip, userAgent);
  }

  @Post('dispositivo')
  @UseGuards(JwtAuthGuard)
  registrarDispositivo(@Body() body: { device_id: string }, @Req() _req: AuthRequest) {
    const usuarioId = _req.user?.sub;
    return this.authService.registrarDispositivo(usuarioId, body.device_id, _req.ip);
  }

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
  @Roles('admin', 'supervisor', 'cliente')
  async actualizarUsuario(@Param('id') id: string, @Body() body: Partial<UpdateUsuarioDto>, @Req() _req: AuthRequest) {
    return this.authService.actualizarUsuario(id, body, _req.user);
  }
}