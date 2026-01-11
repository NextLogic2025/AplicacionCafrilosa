import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express'; // Importante para tipar Express

import { AuthService } from './auth.service';
import { CreateUsuarioDto, LoginDto, RefreshTokenDto } from './dto';
import { JwtAuthGuard } from './guards/jwt.guard';

// Definimos la interfaz del usuario que inyecta el Guard en el Request
interface JwtUser {
  sub: string;
  email?: string;
  rolId?: string | number;
  role?: string | string[];
}

// Extendemos el Request de Express para incluir al usuario
type AuthRequest = Request & { user?: JwtUser };

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  registrar(@Body() dto: CreateUsuarioDto) {
    return this.authService.registro(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() _req: AuthRequest) {
    // Obtenemos IP y UserAgent para auditoría y seguridad
    const ip = _req.ip;
    const userAgent = _req.get('user-agent');
    return this.authService.login(dto, ip, userAgent);
  }

  // Batch interno para otros servicios (sin guard) para obtener nombres por id
  @Post('usuarios/batch/internal')
  async obtenerUsuariosPorIds(@Body() body: { ids: string[] }) {
    return this.authService.obtenerUsuariosPorIds(body?.ids || []);
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
    
    // Extraemos el token Bearer manualmente del header para revocarlo
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
}