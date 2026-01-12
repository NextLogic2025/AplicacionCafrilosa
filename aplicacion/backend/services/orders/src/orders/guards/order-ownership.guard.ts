import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class OrderOwnershipGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user; // Inyectado por JwtStrategy

        // Extraer el ID objetivo según el contexto
        const targetUserId = request.params.userId || request.body.usuario_id || request.body.cliente_id;

        // 1. Los administradores y vendedores tienen acceso total
        const isAdmin = user.role?.toLowerCase() === 'admin';
        const isVendedor = user.role?.toLowerCase() === 'vendedor';
        if (isAdmin || isVendedor) return true;

        // 2. Verificar si el usuario intenta acceder a sus propios datos
        // Para clientes: verificar que el userId coincida con el cliente_id o usuario_id
        if (user.userId === targetUserId) return true;

        throw new ForbiddenException('Acceso denegado: No eres el propietario de este recurso.');
    }
}