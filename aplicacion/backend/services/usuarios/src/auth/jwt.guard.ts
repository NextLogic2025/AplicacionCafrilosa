import { Injectable, ExecutionContext, UnauthorizedException, CanActivate, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthToken } from '../entities/auth-token.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(AuthToken) private tokenRepo: Repository<AuthToken>,
  ) {}

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
      
      // Verificar que el token no esté revocado en BD
      const tokenRecords = await this.tokenRepo.find({
        where: { 
          usuario: { id: payload.sub },
          tipo: 'access',
          revocado: false,
        },
      });

      if (tokenRecords.length === 0) {
        throw new UnauthorizedException('Token has been revoked or does not exist');
      }

      // Verificar que al menos uno de los tokens tenga un hash que coincida
      let tokenValido = false;
      for (const tokenRecord of tokenRecords) {
        const esIgual = await bcrypt.compare(token, tokenRecord.token_hash);
        if (esIgual) {
          tokenValido = true;
          break;
        }
      }

      if (!tokenValido) {
        throw new UnauthorizedException('Token hash does not match');
      }

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
