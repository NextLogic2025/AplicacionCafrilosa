import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'dev_jwt_secret'
    });
  }

  async validate(payload: any) {
    // Propagar rolId si el token lo trae (compatibilidad con servicio `usuarios`)
    return { userId: payload.sub, email: payload.email, role: payload.role, role_level: payload.role_level, rolId: payload.rolId };
  }
}
