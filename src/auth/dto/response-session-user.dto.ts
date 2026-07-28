import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/common/enums/role.enum';

export class ResponseSessionUserDto {
  @ApiProperty({ format: 'uuid' })
  userId: string;

  @ApiProperty({ enum: Role, enumName: 'Role' })
  role: Role;
}
