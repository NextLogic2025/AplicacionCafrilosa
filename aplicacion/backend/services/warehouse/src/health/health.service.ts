// health/health.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
    check() {
        return {
            status: 'ok',
            service: 'warehouse-service',
            timestamp: new Date().toISOString(),
        };
    }
}