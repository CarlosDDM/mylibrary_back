import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    type: [String],
    description:
      'Uma entrada por problema. A validação de corpo devolve várias; os demais erros, uma só.',
  })
  message: string[];

  @ApiProperty({ description: 'Nome HTTP do status, ex. Not Found' })
  error: string;

  @ApiProperty({ description: 'Repete o status HTTP da resposta' })
  statusCode: number;
}
