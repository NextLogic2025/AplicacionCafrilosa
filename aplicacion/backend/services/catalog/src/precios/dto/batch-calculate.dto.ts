import { IsArray, IsOptional, IsString, IsNumber, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BatchItemDto {
  @IsUUID() // O IsString si tus IDs no son UUIDs
  id: string;

  @IsOptional()
  @IsNumber()
  cantidad?: number;
}

export class BatchCalculateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchItemDto)
  items: BatchItemDto[];

  @IsOptional()
  @IsUUID()
  cliente_id?: string;
}