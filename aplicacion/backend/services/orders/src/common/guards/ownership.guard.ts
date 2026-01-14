import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetUserId = request.params.userId;

    const roles = Array.isArray(user?.role) ? user.role : [user?.role];
    const isAdmin = roles.some((r: any) => String(r).toLowerCase() === 'admin');

    if (isAdmin) return true;
    if (user?.userId === targetUserId) return true;

    throw new ForbiddenException('No tiene permisos para acceder a este recurso');
  }
}