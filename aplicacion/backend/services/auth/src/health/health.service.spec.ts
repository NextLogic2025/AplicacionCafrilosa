import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HealthService],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('check', () => {
    it('debe retornar status ok', () => {
      const result = service.check();

      expect(result).toEqual({ status: 'ok' });
    });

    it('debe retornar un objeto con la propiedad status', () => {
      const result = service.check();

      expect(result).toHaveProperty('status');
      expect(typeof result.status).toBe('string');
    });
  });
});
