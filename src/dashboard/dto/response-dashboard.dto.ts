import { Expose } from 'class-transformer';

export class ResponseDashboardDto {
  @Expose()
  totalWorks: number;

  @Expose()
  totalPrice: number | null;

  @Expose()
  totalFranchises: number;

  @Expose()
  totalSeries: number;
}
