import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePreferencesDto {
  @IsOptional() @IsString() default_category?: string;
  @IsOptional() @IsInt() @Min(1) price_max?: number;
  @IsOptional() @IsInt() @Min(1) page_limit?: number;
  @IsOptional() @IsString() theme?: string;
}
