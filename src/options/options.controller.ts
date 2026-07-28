import { Controller, Get, SerializeOptions, UseGuards } from '@nestjs/common';
import { OptionsService } from './options.service';
import { ResponseOption } from './dto/response-option.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiThrottled,
  ApiUnauthorized,
} from 'src/common/decorators/api-errors.decorator';

@ApiTags('options')
@ApiCookieAuth()
@ApiUnauthorized()
@ApiThrottled()
@Controller('options')
@SerializeOptions({ type: ResponseOption })
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  /** Listas de status, mídias e idiomas para preencher formulários */
  @Get()
  @UseGuards(AuthenticatedGuard)
  @ApiOkResponse({ type: ResponseOption })
  findAll() {
    return this.optionsService.findAll();
  }
}
