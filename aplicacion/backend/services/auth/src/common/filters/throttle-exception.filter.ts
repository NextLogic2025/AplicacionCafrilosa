import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Response, Request } from 'express';

/**
 * Filtro de excepciones para rate limiting
 * Proporciona mensajes claros y loguea intentos sospechosos
 */
@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(ThrottlerExceptionFilter.name);

    catch(exception: ThrottlerException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const status = HttpStatus.TOO_MANY_REQUESTS;

        // Extraer información del contexto
        const ip = request.ip || request.socket?.remoteAddress || 'unknown';
        const userAgent = request.get('user-agent') || 'unknown';
        const path = request.path;
        const method = request.method;

        // Tiempo estimado de espera (por defecto 60 segundos del TTL configurado)
        const retryAfterSeconds = 60;

        // Loguear intento sospechoso para auditoría
        this.logger.warn(
            `Rate limit excedido - IP: ${ip}, Path: ${method} ${path}, User-Agent: ${userAgent}`,
        );

        response.status(status).json({
            statusCode: status,
            error: 'Too Many Requests',
            message: `Demasiados intentos. Por favor, intente nuevamente en ${retryAfterSeconds} segundos.`,
            retryAfter: retryAfterSeconds,
            timestamp: new Date().toISOString(),
        });
    }
}
