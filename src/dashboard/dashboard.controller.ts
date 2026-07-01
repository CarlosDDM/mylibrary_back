import { Controller, Get, SerializeOptions, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ResponseDashboardDto } from './dto/response-dashboard.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';

@Controller('dashboard')
@SerializeOptions({ type: ResponseDashboardDto })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('statistics')
  @UseGuards(AuthenticatedGuard)
  findAll() {
    return this.dashboardService.findAll();
  }
}
