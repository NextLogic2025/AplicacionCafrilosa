import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) return false;

    const required = requiredRoles.map((r) => String(r).toLowerCase());

    const userRoles: string[] = [];
    if (Array.isArray(user.role)) {
      for (const r of user.role) if (r) userRoles.push(String(r).toLowerCase());
    } else if (user.role) {
      userRoles.push(String(user.role).toLowerCase());
    }

    if (userRoles.some((ur) => required.includes(ur))) return true;

    const ROLE_NAME_TO_ID: Record<string, number> = { admin: 1, supervisor: 2, bodeguero: 3, vendedor: 4, transportista: 5, cliente: 6 };
    if (user.rolId && typeof user.rolId === 'number') {
      const neededIds = required
        .map((r) => ROLE_NAME_TO_ID[r])
        .filter((v) => typeof v === 'number') as number[];
      if (neededIds.includes(user.rolId)) return true;
    }

    return false;
  }
}
