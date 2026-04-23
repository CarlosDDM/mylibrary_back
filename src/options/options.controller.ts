import { Controller, Get, SerializeOptions } from '@nestjs/common';
import { OptionsService } from './options.service';
import { ResponseOption } from './dto/response-option.dto';

@Controller('options')
@SerializeOptions({ type: ResponseOption })
export class OptionsController {
  constructor(private readonly optionsService: OptionsService) {}

  @Get()
  findAll() {
    return this.optionsService.findAll();
  }
}
