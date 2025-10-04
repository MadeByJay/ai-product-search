import { Module } from '@nestjs/common';
import { Pool } from 'pg';

export const PG_POOL = 'PG_POOL';

@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () =>
        new Pool({ connectionString: process.env.VECTOR_DB_URL }),
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
