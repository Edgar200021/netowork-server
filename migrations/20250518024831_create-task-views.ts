import type { Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("task_views")
		.addColumn("id", "integer", (col) =>
			col.primaryKey().generatedAlwaysAsIdentity(),
		)
		.addColumn("task_id", "integer", (col) =>
			col
				.notNull()
				.references("task.id")
				.onDelete("cascade")
				.onUpdate("cascade"),
		)
		.addColumn("user_id", "integer", (col) =>
			col.references("users.id").onDelete("set null").onUpdate("cascade"),
		)
		.addUniqueConstraint("task_views_task_id_user_id", ["task_id", "user_id"])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("task_views").execute();
}
