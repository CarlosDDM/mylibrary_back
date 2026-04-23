import { Controller, Get, SerializeOptions } from '@nestjs/common';
import { OptionsService } from './options.service';
import { ResponseOption } from './dto/response-option.dto';

@Controller('options')
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get()
  @SerializeOptions({ type: ResponseOption })
  findAll() {
    return this.optionsService.findAll();
  }
}
