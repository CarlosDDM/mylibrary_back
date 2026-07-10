import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class AddCoverDto {
  @Transform(({ value }: { value: unknown }) =>
    value === 'true' || value === true
      ? true
      : value === 'false' || value === false
        ? false
        : value,
  )
  @IsBoolean()
  @IsOptional()
  isSpecialEdition?: boolean;
}
