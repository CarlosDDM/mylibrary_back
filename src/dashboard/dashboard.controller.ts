import { Controller, Get, SerializeOptions } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ResponseDashboardDto } from './dto/response-dashboard.dto';

@Controller('dashboard')
@SerializeOptions({ type: ResponseDashboardDto })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('statistics')
  findAll() {
    return this.dashboardService.findAll();
  }
}
