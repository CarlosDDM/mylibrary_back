import { Injectable } from '@nestjs/common';
import { CreateIllustratorDto } from './dto/create-illustrator.dto';
import { UpdateIllustratorDto } from './dto/update-illustrator.dto';

@Injectable()
export class IllustratorsService {
  create(createIllustratorDto: CreateIllustratorDto) {
    return 'This action adds a new illustrator';
  }

  findAll() {
    return `This action returns all illustrators`;
  }

  findOne(id: number) {
    return `This action returns a #${id} illustrator`;
  }

  update(id: number, updateIllustratorDto: UpdateIllustratorDto) {
    return `This action updates a #${id} illustrator`;
  }

  remove(id: number) {
    return `This action removes a #${id} illustrator`;
  }
}
