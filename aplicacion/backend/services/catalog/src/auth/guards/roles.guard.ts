import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // avoid logging user details in production — keep silent for successful checks

    if (!user) return false;

    // Normalize required roles to lowercase for case-insensitive compare
    const required = requiredRoles.map((r) => String(r).toLowerCase());

    // Support user.role being string or array of strings
    const userRoles: string[] = [];
    if (Array.isArray(user.role)) {
      for (const r of user.role) if (r) userRoles.push(String(r).toLowerCase());
    } else if (user.role) {
      userRoles.push(String(user.role).toLowerCase());
    }

    // If any user role matches any required role -> allow
    if (userRoles.some((ur) => required.includes(ur))) return true;

    // Support tokens that include a numeric `rolId` claim instead of role name
    // Map known role names to IDs used in `usuarios` DB. Ajusta los IDs si es necesario.
    const ROLE_NAME_TO_ID: Record<string, number> = { admin: 1, supervisor: 2, bodeguero: 3, vendedor: 4, transportista: 5, cliente: 6 };
    if (user.rolId) {
      const numericRolId = Number(user.rolId);
      if (!Number.isNaN(numericRolId)) {
        const neededIds = required
          .map((r) => ROLE_NAME_TO_ID[r])
          .filter((v) => typeof v === 'number') as number[];
        if (neededIds.includes(numericRolId)) return true;
      }
    }

    // Optional: allow by numeric role_level if provided and required includes a level indicator (not used now)
    if (user.role_level && typeof user.role_level === 'number') {
      // Future extension: map required roles to levels and compare
    }

    this.logger.warn('RolesGuard denied: insufficient roles');
    return false;
  }
}
