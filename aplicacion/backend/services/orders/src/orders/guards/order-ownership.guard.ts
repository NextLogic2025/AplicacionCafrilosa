import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class OrderOwnershipGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user = request.user; // Inyectado por JwtStrategy

        // 1. Los administradores y vendedores tienen acceso total
        const isAdmin = user.role?.toLowerCase() === 'admin';
        const isVendedor = user.role?.toLowerCase() === 'vendedor';
        if (isAdmin || isVendedor) return true;

        // 2. Para clientes: verificar múltiples formas de ownership
        // - El userId en params (para rutas como /cart/:userId)
        // - El vendedor_id en body (clientes haciendo su propio pedido usan su userId como vendedor_id)
        // - El cliente_id en body (si coincide con el userId, aunque normalmente son diferentes)
        const paramsUserId = request.params.userId;
        const bodyVendedorId = request.body.vendedor_id;
        const bodyClienteId = request.body.cliente_id;

        // Verificar si el usuario está accediendo a sus propios recursos
        if (paramsUserId && user.userId === paramsUserId) return true;
        if (bodyVendedorId && user.userId === bodyVendedorId) return true;
        if (bodyClienteId && user.userId === bodyClienteId) return true;

        throw new ForbiddenException('Acceso denegado: No eres el propietario de este recurso.');
    }
}