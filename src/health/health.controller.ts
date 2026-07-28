import { Controller, Get, UseFilters } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './indicators/redis.indicator';
import { HealthCheckFilter } from './filters/health-check.filter';
import { ApiTags } from '@nestjs/swagger';
import { ApiHealthLive, ApiHealthReady } from './docs/health.docs';

@ApiTags('health')
@Controller('health')
@SkipThrottle({ short: true, medium: true, long: true })
@UseFilters(HealthCheckFilter)
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  /** Liveness: responde 200 enquanto o processo estiver de pé */
  @Get('live')
  @ApiHealthLive()
  live() {
    return { status: 'ok' };
  }

  /** Readiness: verifica Postgres e os dois Redis */
  @Get('ready')
  @HealthCheck({ noCache: true, swaggerDocumentation: false })
  @ApiHealthReady()
  check() {
    return this.health.check([
      () => this.database.pingCheck('postgres', { timeout: 2000 }),
      () => this.redis.checkCache('redis-cache'),
      () => this.redis.checkSession('redis-session'),
    ]);
  }
}
