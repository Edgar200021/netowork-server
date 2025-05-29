import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("task_views")
		.addColumn("id", "uuid", (col) =>
				col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn("task_id", "uuid", (col) =>
			col
				.notNull()
				.references("task.id")
				.onDelete("cascade")
				.onUpdate("cascade"),
		)
		.addColumn("user_id", "uuid", (col) =>
			col.references("users.id").onDelete("set null").onUpdate("cascade"),
		)
		.addUniqueConstraint("task_views_task_id_user_id", ["task_id", "user_id"])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("task_views").execute();
}
