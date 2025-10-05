import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class SyncUserDto {
  @IsEmail() email!: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'avatar_url must be a valid URL' })
  avatar_url?: string;
}
