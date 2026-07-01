import { Controller, Get, SerializeOptions, UseGuards } from '@nestjs/common';
import { OptionsService } from './options.service';
import { ResponseOption } from './dto/response-option.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';

@Controller('options')
@SerializeOptions({ type: ResponseOption })
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get()
  @UseGuards(AuthenticatedGuard)
  findAll() {
    return this.optionsService.findAll();
  }
}
