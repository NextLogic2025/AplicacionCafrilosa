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
    const ROLE_NAME_TO_ID: Record<string, number> = { admin: 1, supervisor: 2 };
    if (user.rolId && typeof user.rolId === 'number') {
      const neededIds = required
        .map((r) => ROLE_NAME_TO_ID[r])
        .filter((v) => typeof v === 'number') as number[];
      if (neededIds.includes(user.rolId)) return true;
    }

    // Optional: allow by numeric role_level if provided and required includes a level indicator (not used now)
    if (user.role_level && typeof user.role_level === 'number') {
      // Future extension: map required roles to levels and compare
    }

    return false;
  }
}
