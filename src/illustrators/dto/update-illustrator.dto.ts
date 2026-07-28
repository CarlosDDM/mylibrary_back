import { PartialType } from '@nestjs/swagger';
import { CreateIllustratorDto } from './create-illustrator.dto';

export class UpdateIllustratorDto extends PartialType(CreateIllustratorDto) {}
