import { Injectable } from '@nestjs/common';
import { CacheService } from 'src/cache/cache.service';
import { Franchise } from 'src/franchises/entities/franchise.entity';
import { Serie } from 'src/series/entities/serie.entity';
import { Work } from 'src/works/entities/work.entity';
import { DataSource } from 'typeorm';
import { DASHBOARD_STATS_KEY } from 'src/cache/cache.keys';

@Injectable()
export class DashboardService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cacheService: CacheService,
  ) {}

  findAll() {
    return this.cacheService.wrap(DASHBOARD_STATS_KEY, () =>
      this.getStatistics(),
    );
  }

  private getStatistics() {
    return this.dataSource.transaction(async (manager) => {
      const totalWorks = await manager.count(Work);
      const result = await manager
        .createQueryBuilder(Work, 'w')
        .select('SUM(w.price)', 'sum')
        .getRawOne<{ sum: string | null }>();
      const totalPrice = result?.sum != null ? parseFloat(result.sum) : null;
      const totalFranchises = await manager.count(Franchise);
      const totalSeries = await manager.count(Serie);
      return { totalWorks, totalPrice, totalFranchises, totalSeries };
    });
  }
}
