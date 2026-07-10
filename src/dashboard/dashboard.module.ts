import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { CacheModule } from 'src/cache/cache.module';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService],
  imports: [CacheModule],
})
export class DashboardModule {}
