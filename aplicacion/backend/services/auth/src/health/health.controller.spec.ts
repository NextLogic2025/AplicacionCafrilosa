import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: jest.Mocked<HealthService>;

  beforeEach(async () => {
    const mockHealthService = {
      check: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get(HealthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('debe retornar el resultado del health service', () => {
      const expectedResult = { status: 'ok' };
      healthService.check.mockReturnValue(expectedResult);

      const result = controller.check();

      expect(result).toEqual(expectedResult);
      expect(healthService.check).toHaveBeenCalled();
    });

    it('debe llamar al health service exactamente una vez', () => {
      healthService.check.mockReturnValue({ status: 'ok' });

      controller.check();

      expect(healthService.check).toHaveBeenCalledTimes(1);
    });
  });
});
