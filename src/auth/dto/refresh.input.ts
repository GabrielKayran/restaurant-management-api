import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshInput {
  @ApiProperty({
    description: 'Refresh token previously issued by the API.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh-token',
  })
  @IsString({ message: 'validation.auth.refreshTokenMustBeString' })
  @MinLength(10, { message: 'validation.auth.refreshTokenTooShort' })
  refreshToken: string;
}
