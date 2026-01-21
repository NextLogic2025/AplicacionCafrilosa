import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
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
  constructor(private readonly authService: AuthService) { }

  // Rate limit estricto: máximo 3 registros por minuto para prevenir spam
  @Post('registro')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  registrar(@Body() dto: CreateUsuarioDto) {
    return this.authService.registro(dto);
  }

  // Rate limit estricto: máximo 5 intentos de login por minuto para prevenir fuerza bruta
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto, @Req() _req: AuthRequest) {
    // Obtenemos IP y UserAgent para auditoría y seguridad
    const ip = _req.ip;
    const userAgent = _req.get('user-agent');
    return this.authService.login(dto, ip, userAgent);
  }

  // Rate limit moderado para refresh
  @Post('refresh')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  refresh(@Body() body: RefreshTokenDto, @Req() _req: AuthRequest) {
    const ip = _req.ip;
    const userAgent = _req.get('user-agent');
    return this.authService.refreshTokens(body.refresh_token, body.device_id, ip, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle() // No hay riesgo en logout autenticado
  logout(@Req() _req: AuthRequest, @Body() body?: { refresh_token?: string }) {
    const usuarioId = _req.user?.sub;
    const ip = _req.ip;
    const userAgent = _req.get('user-agent');

    // Usar refresh token del body si se proporciona, sino revocar todos
    const refreshToken = body?.refresh_token;

    return this.authService.logout(usuarioId, refreshToken, ip, userAgent);
  }

  // Logout de todos los dispositivos
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  logoutAll(@Req() _req: AuthRequest) {
    const usuarioId = _req.user?.sub;
    const ip = _req.ip;
    const userAgent = _req.get('user-agent');

    // Pasar undefined como refreshToken para revocar todos
    return this.authService.logout(usuarioId, undefined, ip, userAgent, true);
  }

  @Post('validate-token')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  validateToken(@Req() _req: AuthRequest) {
    return {
      valid: true,
      userId: _req.user?.sub,
      email: _req.user?.email,
      role: _req.user?.role,
    };
  }

  @Post('dispositivo')
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  registrarDispositivo(@Body() body: { device_id: string }, @Req() _req: AuthRequest) {
    const usuarioId = _req.user?.sub;
    return this.authService.registrarDispositivo(usuarioId, body.device_id, _req.ip);
  }
}