import { IsArray, IsNotEmpty, IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

class ReservationItemDto {
  @IsNotEmpty()
  productId: string;

  @IsString()
  @IsOptional()
  sku: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;
}

export class CreateReservationDto {
  @IsArray()
  @Type(() => ReservationItemDto)
  items: ReservationItemDto[];

  // Accept both camelCase `tempId` and snake_case `temp_id` when mapping in controller
  @IsString()
  @IsOptional()
  tempId?: string;
}
