import { IsString, IsOptional } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  refresh_token: string;

  @IsOptional()
  @IsString()
  device_id?: string;
}
