import { IsString } from 'class-validator';

export class ToggleSavedDto {
  @IsString() productId!: string;
}
