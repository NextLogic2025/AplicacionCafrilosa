import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  private readonly logger = new Logger(ServiceAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'] || request.headers['Authorization'];

    if (!authHeader) {
      this.logger.warn(`Intento de acceso interno sin token desde IP: ${request.ip}`);
      throw new UnauthorizedException('Token de servicio requerido');
    }

    const parts = authHeader.split(' ');
    const token = parts.length > 1 ? parts[1] : parts[0];
    const validToken = process.env.SERVICE_TOKEN;

    if (token === validToken) return true;

    this.logger.error(`Token de servicio inválido: ${token}`);
    throw new UnauthorizedException('Token de servicio inválido');
  }
}
