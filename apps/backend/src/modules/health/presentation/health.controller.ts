import { Controller, Get } from '@nestjs/common';
import { HealthService } from '../application/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): ReturnType<HealthService['check']> {
    return this.healthService.check();
  }
}
