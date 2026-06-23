import { Controller, Get, Query, SerializeOptions } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { ResponseSearchDto } from './dto/response-search-dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @SerializeOptions({ type: ResponseSearchDto })
  findAll(@Query() query: SearchQueryDto) {
    return this.searchService.findAll(query);
  }
}
