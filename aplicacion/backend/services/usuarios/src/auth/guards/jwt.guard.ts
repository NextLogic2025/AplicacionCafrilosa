import { Injectable, ExecutionContext, UnauthorizedException, CanActivate } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    const [scheme, token] = parts;
    if (scheme.toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Invalid token scheme. Use: Bearer <token>');
    }

    if (!token || token.length === 0) {
      throw new UnauthorizedException('Empty token');
    }

    try {
      // Verificar que el JWT sea válido
      const payload = this.jwtService.verify(token);
      
      // Only verify signature and expiration here. For immediate revocation
      // check use a blacklist (Redis) or short-lived access tokens with refresh validation.

      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid or expired token: ' + error.message);
    }
  }
}
