import { type Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("task_replies")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`),
		)
		.addColumn("created_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("updated_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("description", "text", (col) => col.notNull())
		.addColumn("freelancer_id", "uuid", (col) =>
			col
				.notNull()
				.references("users.id")
				.onDelete("cascade")
				.onUpdate("cascade"),
		)
		.addColumn("task_id", "uuid", (col) =>
			col
				.notNull()
				.references("task.id")
				.onDelete("cascade")
				.onUpdate("cascade"),
		)
		.addUniqueConstraint("task_replies_freelancer_id_task_id", [
			"freelancer_id",
			"task_id",
		])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("task_replies").execute();
}
