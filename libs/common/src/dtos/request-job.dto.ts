import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ChainWatchOptionsDto } from './chain.watch.dto';

export class ContentSearchRequestDto {
  @IsOptional()
  @IsString()
  id: string;

  @IsString()
  @ApiProperty({
    description: 'The starting block number to search from',
    example: '100',
  })
  startBlock: string;

  @IsString()
  @ApiProperty({
    description: 'The ending block number to search to',
    example: '101',
  })
  endBlock: string;

  @IsOptional()
  @ApiProperty({
    description: 'The schemaIds/dsnpIds to filter by',
  })
  filters: ChainWatchOptionsDto;
}
