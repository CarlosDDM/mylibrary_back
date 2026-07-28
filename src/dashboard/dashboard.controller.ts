import { Controller, Get, SerializeOptions, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ResponseDashboardDto } from './dto/response-dashboard.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiThrottled,
  ApiUnauthorized,
} from 'src/common/decorators/api-errors.decorator';

@ApiTags('dashboard')
@ApiCookieAuth()
@ApiUnauthorized()
@ApiThrottled()
@Controller('dashboard')
@SerializeOptions({ type: ResponseDashboardDto })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** Totais de obras, preço somado, franquias e séries */
  @Get('statistics')
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: ResponseDashboardDto })
  findAll() {
    return this.dashboardService.findAll();
  }
}
