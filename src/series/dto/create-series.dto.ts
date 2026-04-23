import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateSeriesDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  serieVolumes: number | null;

  @IsUUID()
  @IsNotEmpty()
  statusId: string;

  @IsUUID()
  @IsOptional()
  franchiseId?: string | null;
}
