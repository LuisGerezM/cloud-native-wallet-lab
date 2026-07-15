import { Injectable } from '@nestjs/common';

interface HealthStatus {
  status: string;
  timestamp: string;
}

@Injectable()
export class HealthService {
  check(): HealthStatus {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
