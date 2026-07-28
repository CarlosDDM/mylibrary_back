import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ResponseUserDto } from './response-user.dto';
import { Role } from 'src/common/enums/role.enum';

export class ResponseUserRoleDto extends ResponseUserDto {
  @ApiProperty({ enum: Role, enumName: 'Role' })
  @Expose()
  role: Role;
}
