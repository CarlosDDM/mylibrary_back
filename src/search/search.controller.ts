import {
  Controller,
  Get,
  Query,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { ResponseSearchDto } from './dto/response-search-dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(AuthenticatedGuard)
  @SerializeOptions({ type: ResponseSearchDto })
  findAll(@Query() query: SearchQueryDto) {
    return this.searchService.findAll(query);
  }
}
