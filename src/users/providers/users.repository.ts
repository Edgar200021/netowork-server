import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DATABASE_CONNECTION } from 'src/drizzle/drizzle.module';
import * as schema from 'src/drizzle/schema';

@Injectable()
export class UsersRepository {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly database: NodePgDatabase<typeof schema>,
  ) {}

  async getAll(): Promise<(typeof schema.users.$inferSelect)[]> {
    const users = await this.database.select().from(schema.users);
    return users;
  }

  async getByEmail(
    email: string,
  ): Promise<undefined | typeof schema.users.$inferSelect> {
    const user = await this.database.query.users.findFirst({
      where: eq(schema.users.email, email),
    });

    return user;
  }

  async create(
    data: typeof schema.users.$inferInsert,
  ): Promise<(typeof schema.users.$inferSelect)['id']> {
    const result = await this.database
      .insert(schema.users)
      .values(data)
      .returning({ id: schema.users.id });

    return result[0].id;
  }
}
