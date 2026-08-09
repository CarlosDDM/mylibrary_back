import {
  Controller,
  Get,
  Query,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { ResponseSearchDto } from './dto/response-search.dto';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { ApiCookieAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiThrottled,
  ApiUnauthorized,
} from 'src/common/decorators/api-errors.decorator';

@ApiTags('search')
@ApiCookieAuth()
@ApiUnauthorized()
@ApiThrottled()
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /** Busca full text de obras e séries numa chamada só. Casa prefixo de palavra, ignora acento e ordem das palavras */
  @Get()
  @UseGuards(AuthenticatedGuard)
  @SerializeOptions({ type: ResponseSearchDto })
  @ApiOkResponse({ type: ResponseSearchDto })
  findAll(@Query() query: SearchQueryDto) {
    return this.searchService.findAll(query);
  }
}
