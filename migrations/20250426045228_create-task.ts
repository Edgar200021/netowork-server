import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("task")
		.addColumn("id", "integer", (col) =>
			col.primaryKey().generatedAlwaysAsIdentity(),
		)
		.addColumn("created_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("updated_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("title", "text", (col) => col.notNull())
		.addColumn("description", "text", (col) => col.notNull())
		.addColumn("file_urls", sql`text[]`, (col) => col.notNull().defaultTo('{}'))
		.addColumn("file_ids", sql`text[]`, (col) => col.notNull().defaultTo('{}'))
		.addColumn("category_id", "integer", (col) =>
			col.references("category.id").onDelete("cascade").onUpdate("cascade"),
		)
		.addColumn("subcategory_id", "integer", (col) =>
			col.references("category.id").onDelete("set null").onUpdate("set null"),
		)
		.addColumn("client_id", "integer", (col) =>
			col.references("users.id").onDelete("cascade").notNull(),
		)
		.addColumn("freelancer_id", "integer", (col) => col.references("users.id"))
		.addColumn("price", "integer", (col) => col.notNull())
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("task").execute();
}
