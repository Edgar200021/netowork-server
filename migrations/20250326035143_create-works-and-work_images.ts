import { sql, type Kysely } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("works")
		.addColumn("id", "uuid", (col) =>
				col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn("created_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("updated_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("title", "text", (col) => col.notNull())
		.addColumn("user_id", "uuid", (col) =>
			col
				.references("users.id")
				.onDelete("cascade")
				.onUpdate("cascade")
				.notNull(),
		)
		.addUniqueConstraint("works_user_id_title", ["user_id", "title"])
		.execute();

	await db.schema
		.createIndex("idx_works_user_id")
		.on("works")
		.column("user_id")
		.execute();

	await db.schema
		.createTable("work_images")
		.addColumn("id", "uuid", (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn("created_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("updated_at", "timestamp", (col) =>
			col.notNull().defaultTo("now()"),
		)
		.addColumn("image_url", "text", (col) => col.notNull())
		.addColumn("image_id", "text", (col) => col.notNull())
		.addColumn("work_id", "uuid", (col) =>
			col
				.references("works.id")
				.onDelete("cascade")
				.onUpdate("cascade")
				.notNull(),
		)
		.addUniqueConstraint("work_images_image_id_unique", ["image_id"])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("work_images").execute();
	await db.schema.dropTable("works").execute();
}
