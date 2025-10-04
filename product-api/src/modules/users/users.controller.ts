import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Post()
  create(
    @Body()
    dto: {
      id: string;
      email: string;
      name?: string;
      avatar_url?: string;
    },
  ) {
    return this.svc.createUserWithDefaults({
      ...dto,
      defaults: { page_limit: 24, theme: 'light' },
    });
  }
}
