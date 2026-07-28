import { Controller, Get, UseFilters } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './indicators/redis.indicator';
import { HealthCheckFilter } from './filters/health-check.filter';

// Os throttlers precisam ser nomeados um a um: @SkipThrottle() sem argumento
// assume { default: true }, e os throttlers registrados no app.module se chamam
// short, medium e long — nenhum é 'default'. Sem isso o probe toma 429.
@Controller('health')
@SkipThrottle({ short: true, medium: true, long: true })
@UseFilters(HealthCheckFilter)
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get('live')
  live() {
    return { status: 'ok' };
  }

  @Get('ready')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.database.pingCheck('postgres', { timeout: 2000 }),
      () => this.redis.checkCache('redis-cache'),
      () => this.redis.checkSession('redis-session'),
    ]);
  }
}
