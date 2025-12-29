// placeholder (Auth controller)
import { Controller, Post, Body, Get, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  registrar(@Body() dto: CreateUsuarioDto) {
    return this.authService.registro(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip;
    const userAgent = req.get('user-agent');
    return this.authService.login(dto, ip, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: Request) {
    const usuarioId = (req as any).user?.sub;
    const ip = req.ip;
    const userAgent = req.get('user-agent');
    const authHeader = req.headers['authorization'] || '';
    const token = typeof authHeader === 'string' ? authHeader.split(' ')[1] : undefined;
    return this.authService.logout(usuarioId, token, ip, userAgent);
  }

  @Post('dispositivo')
  @UseGuards(JwtAuthGuard)
  registrarDispositivo(@Body() body: { device_id: string }, @Req() req: Request) {
    const usuarioId = (req as any).user?.sub;
    return this.authService.registrarDispositivo(usuarioId, body.device_id, req.ip);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  obtenerPerfil(@Req() req: Request) {
    const usuarioId = (req as any).user?.sub;
    return this.authService.obtenerMiPerfil(usuarioId);
  }
}