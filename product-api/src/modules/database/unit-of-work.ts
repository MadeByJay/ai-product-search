import { Inject, Injectable } from '@nestjs/common';
import type { Pool, PoolClient, QueryResult } from 'pg';
import { PG_POOL } from './databases.module';

/** A minimal interface that both Pool and PoolClient satisfy */
export interface Queryable {
  query: (text: string, params?: any[]) => Promise<QueryResult<any>>;
}

/**
 * UnitOfWork wraps a single transaction. Use run() to execute a function
 * that receives a bound client (implements Queryable) and is committed or
 * rolled back automatically.
 */
@Injectable()
export class UnitOfWork {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async run<T>(fn: (tx: Queryable) => Promise<T>): Promise<T> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      try {
        await client.query('ROLLBACK');
      } catch {}
      throw err;
    } finally {
      client.release();
    }
  }
}
