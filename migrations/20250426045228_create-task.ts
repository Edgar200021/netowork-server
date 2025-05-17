import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createType("task_status")
		.asEnum(["open", "in_progress", "completed"])
		.execute();

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
		.addColumn("category_id", "integer", (col) =>
			col
				.references("category.id")
				.notNull()
				.onDelete("cascade")
				.onUpdate("cascade"),
		)
		.addColumn("subcategory_id", "integer", (col) =>
			col.references("category.id").onDelete("set null").onUpdate("set null"),
		)
		.addColumn("client_id", "integer", (col) =>
			col.references("users.id").onDelete("cascade").notNull(),
		)
		.addColumn("freelancer_id", "integer", (col) => col.references("users.id"))
		.addColumn("price", "integer", (col) => col.notNull())
		.addColumn("status", sql`task_status`, (col) =>
			col.notNull().defaultTo(sql`'open'::task_status`),
		)
		.execute();

	await db.schema
		.createTable("task_files")
		.addColumn("id", "integer", (col) =>
			col.primaryKey().generatedAlwaysAsIdentity(),
		)
		.addColumn("created_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("updated_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("file_id", "text", (col) => col.notNull())
		.addColumn("file_url", "text", (col) => col.notNull())
		.addColumn("file_name", "text", (col) => col.notNull())
		.addColumn("task_id", "integer", (col) =>
			col
				.references("task.id")
				.onDelete("cascade")
				.onUpdate("cascade")
				.notNull(),
		)
		.addUniqueConstraint("task_files_task_id_file_id_unique", [
			"task_id",
			"file_id",
		])
		.execute();

	await db.schema
		.createIndex("task_files_task_id_idx")
		.on("task_files")
		.column("task_id")
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("task_files").execute();
	await db.schema.dropTable("task").execute();
	await db.schema.dropType("task_status").execute();
}
