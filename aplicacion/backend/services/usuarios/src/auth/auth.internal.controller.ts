// auth/auth.internal.controller.ts
import { Controller, Post, UseGuards, Body } from '@nestjs/common';

import { AuthService } from './auth.service';
import { ServiceAuthGuard } from './guards/service-auth.guard';

@Controller('usuarios/batch')
@UseGuards(ServiceAuthGuard)
export class AuthInternalController {
  constructor(private readonly authService: AuthService) {}

  @Post('internal')
  async obtenerUsuariosPorIdsInternal(@Body() body: { ids: string[] }) {
    return this.authService.obtenerUsuariosPorIds(body.ids || []);
  }
}
