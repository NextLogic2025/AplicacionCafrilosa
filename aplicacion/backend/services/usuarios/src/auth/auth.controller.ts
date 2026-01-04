// placeholder (Auth controller)
import { Controller, Post, Body, Get, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { Request } from 'express';

import { AuthService } from './auth.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './jwt.guard';

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

  @Post('registro')
  registrar(@Body() dto: CreateUsuarioDto) {
    return this.authService.registro(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: AuthRequest) {
    const ip = req.ip;
    const userAgent = req.get('user-agent');
    return this.authService.login(dto, ip, userAgent);
  }

  @Post('refresh')
  refresh(@Body() body: RefreshTokenDto, @Req() req: AuthRequest) {
    const ip = req.ip;
    const userAgent = req.get('user-agent');
    return this.authService.refreshTokens(body.refresh_token, body.device_id, ip, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: AuthRequest) {
    const usuarioId = req.user?.sub;
    const ip = req.ip;
    const userAgent = req.get('user-agent');
    const authHeader = req.headers['authorization'] || '';
    const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined;
    return this.authService.logout(usuarioId, token, ip, userAgent);
  }

  @Post('dispositivo')
  @UseGuards(JwtAuthGuard)
  registrarDispositivo(@Body() body: { device_id: string }, @Req() req: AuthRequest) {
    const usuarioId = req.user?.sub;
    return this.authService.registrarDispositivo(usuarioId, body.device_id, req.ip);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  obtenerPerfil(@Req() req: AuthRequest) {
    const usuarioId = req.user?.sub;
    return this.authService.obtenerMiPerfil(usuarioId);
  }

  @Get('usuarios')
  @UseGuards(JwtAuthGuard)
  async listarUsuarios(@Req() req: AuthRequest) {
    const user = req.user;
    const roles = Array.isArray(user?.role) ? user.role.map((r) => String(r).toLowerCase()) : [String(user?.role || '').toLowerCase()];
    const isSupervisor = (user?.rolId === 2) || roles.includes('supervisor');
    if (!isSupervisor) throw new ForbiddenException('No autorizado');
    return this.authService.listarUsuariosExcluyendoClientes();
  }

  @Get('vendedores')
  @UseGuards(JwtAuthGuard)
  async listarVendedores(@Req() req: AuthRequest) {
    const user = req.user;
    const roles = Array.isArray(user?.role) ? user.role.map((r) => String(r).toLowerCase()) : [String(user?.role || '').toLowerCase()];
    const isSupervisor = (user?.rolId === 2) || roles.includes('supervisor');
    if (!isSupervisor) throw new ForbiddenException('No autorizado');
    return this.authService.listarVendedores();
  }
}