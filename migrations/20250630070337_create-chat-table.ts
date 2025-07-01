import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("chat")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("created_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("updated_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("creator_id", "uuid", (col) =>
			col
				.notNull()
				.references("users.id")
				.onDelete("cascade")
				.onUpdate("cascade"),
		)
		.addColumn("recipient_id", "uuid", (col) =>
			col
				.notNull()
				.references("users.id")
				.onDelete("cascade")
				.onUpdate("cascade"),
		)
		.addUniqueConstraint("chat_creator_id_recipiend_id_unique", [
			"creator_id",
			"recipient_id",
		])
		.execute();

	await db.schema
		.createTable("messages")
		.addColumn("id", "integer", (col) =>
			col.primaryKey().generatedAlwaysAsIdentity(),
		)
		.addColumn("created_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("updated_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("chat_id", "uuid", (col) =>
			col
				.notNull()
				.references("chat.id")
				.onDelete("cascade")
				.onUpdate("cascade"),
		)
		.addColumn("sender_id", "uuid", (col) =>
			col
				.notNull()
				.references("users.id")
				.onDelete("cascade")
				.onUpdate("cascade"),
		)
		.addColumn("message", "text", (col) => col.notNull())
		.addColumn("files", sql`text[]`, (col) =>
			col.notNull().defaultTo(sql`'{}'`),
		)
		.addColumn("is_read", "boolean", (col) => col.notNull().defaultTo(false))
		.execute();

	await db.executeQuery(
		sql`
      CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS trigger AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      `.compile(db),
	);

	await db.executeQuery(
		sql`
      CREATE TRIGGER messages_updated_at_trg
        BEFORE UPDATE ON messages
        FOR EACH ROW
        EXECUTE FUNCTION update_timestamp();
      `.compile(db),
	);

	await db.schema
		.createIndex("messages_chat_id_idx")
		.on("messages")
		.column("chat_id")
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.executeQuery(
		sql`
        DROP TRIGGER IF EXISTS messages_updated_at_trg ON messages;
        DROP FUNCTION IF EXISTS update_timestamp();
      `.compile(db),
	);
	await db.schema.dropTable("messages").execute();
	await db.schema.dropTable("chat").execute();
}
