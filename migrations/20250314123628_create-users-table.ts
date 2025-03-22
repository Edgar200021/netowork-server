import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createType("user_role")
		.asEnum(["admin", "client", "freelancer"])
		.execute();

	await db.schema
		.createTable("users")
		.addColumn("id", "integer", (col) =>
			col.primaryKey().generatedAlwaysAsIdentity(),
		)
		.addColumn("created_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("updated_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("email", "text", (col) => col.notNull().unique())
		.addColumn("password", "text", (col) => col.notNull())
		.addColumn("first_name", "text", (col) => col.notNull())
		.addColumn("last_name", "text", (col) => col.notNull())
		.addColumn("role", sql`user_role`, (col) => col.notNull())
		.addColumn("is_verified", "boolean", (col) =>
			col.notNull().defaultTo(false),
		)
		.addColumn("is_banned", "boolean", (col) => col.notNull().defaultTo(false))
		.addColumn("about_me", "text")
		.addColumn("avatar", "text")
		.addColumn("avatar_id", "text")
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("users").execute();
	await db.schema.dropType("user_role").execute();
}
