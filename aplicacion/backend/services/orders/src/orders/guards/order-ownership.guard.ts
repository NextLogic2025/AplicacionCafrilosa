import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { ServiceHttpClient } from '../../common/http/service-http-client.service';

@Injectable()
export class OrderOwnershipGuard implements CanActivate {
    private readonly logger = new Logger(OrderOwnershipGuard.name);

    constructor(private readonly serviceHttp: ServiceHttpClient) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user; // Inyectado por JwtStrategy

        // 1. Los administradores y vendedores tienen acceso total
        const role = (user?.role || '').toString().toLowerCase();
        if (role === 'admin' || role === 'vendedor') return true;

        // 2. Para clientes: validar ownership consultando Catalog si es necesario
        const paramsUserId = request.params.userId;
        const bodyVendedorId = request.body.vendedor_id;
        const bodyClienteId = request.body.cliente_id;

        // Si el cliente está accediendo a su propio recurso vía params.userId
        if (paramsUserId && user.userId === paramsUserId) return true;

        // Si body.vendedor_id coincide con el userId (clientes que se ponen como vendedor), permitir
        if (bodyVendedorId && user.userId === bodyVendedorId) return true;

        // Si el body.cliente_id coincide con el userId (raro), permitir
        if (bodyClienteId && user.userId === bodyClienteId) return true;

        // Último recurso: resolver el cliente asociado al userId consultando Catalog
        if (user?.userId) {
            try {
                const cliente = await this.serviceHttp.get<any>(
                    'catalog-service',
                    `/internal/clients/by-user/${user.userId}`,
                );
                if (cliente && bodyClienteId && String(cliente.id) === String(bodyClienteId)) return true;
                // Also allow when paramsUserId is the user's cliente id
                if (paramsUserId && cliente && String(cliente.id) === String(paramsUserId)) return true;
            } catch (err) {
                this.logger.warn('Error resolviendo cliente desde Catalog en OrderOwnershipGuard', err?.message || err);
                // No bloquear por error de red; dejar que otros checks prevengan acceso
            }
        }

        throw new ForbiddenException('Acceso denegado: No eres el propietario de este recurso.');
    }
}
