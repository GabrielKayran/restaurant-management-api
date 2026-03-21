import { ApiProperty } from '@nestjs/swagger';

export class PreparationTimeTrendResponseDto {
  @ApiProperty({
    description: 'Time bucket label according to selected granularity.',
    example: '2026-03-19',
  })
  bucket: string;

  @ApiProperty({
    description: 'Average preparation time in minutes for the bucket.',
    example: 18.4,
  })
  averageMinutes: number;

  @ApiProperty({
    description: '90th percentile preparation time in minutes for the bucket.',
    example: 29,
  })
  p90Minutes: number;
}
