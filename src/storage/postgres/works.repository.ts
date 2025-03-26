import type { Kysely, ReferenceExpression } from "kysely";
import type { DB } from "../db.js";
import type {
	NewWork,
	NewWorkImage,
	Work,
	WorkUpdate,
} from "./types/userWorks.types.js";

export class WorksRepository {
	constructor(private readonly _db: Kysely<DB>) {}

	async getAll(): Promise<Work[]> {
		const works = await this._db
			.selectFrom("works as w")
			.leftJoin("workImages as wi", "wi.workId", "w.id")
			.select(["w.id", "w.title", "w.createdAt", "w.updatedAt", "w.userId"])
			.select((eb) =>
				eb.fn.agg<string[]>("array_agg", ["wi.imageUrl"]).as("images"),
			)
			.execute();

		return works;
	}

	async getByKey<T extends keyof Work = "id">(
		key: T,
		value: Work[T],
	): Promise<Work | undefined> {
		const work = await this._db
			.selectFrom("works")
			.leftJoin("workImages as wi", "wi.workId", "works.id")
			.select([
				"works.id",
				"works.title",
				"works.createdAt",
				"works.updatedAt",
				"works.userId",
			])
			.select((eb) =>
				eb.fn.agg<string[]>("array_agg", ["wi.imageUrl"]).as("images"),
			)
			.where(key as ReferenceExpression<DB, "works">, "=", value)
			.executeTakeFirst();

		return work;
	}

	async create(
		work: NewWork,
		workImages: Pick<NewWorkImage, "imageId" | "imageUrl">[],
	): Promise<Work["id"]> {
		const id = await this._db.transaction().execute(async (trx) => {
			const { id } = await trx
				.insertInto("works")
				.values(work)
				.returning("id")
				.executeTakeFirstOrThrow();

			await trx
				.insertInto("workImages")
				.values(workImages.map((w) => ({ ...w, workId: id })))
				.execute();

			return id;
		});

		return id;
	}

	async update<T extends keyof Pick<Work, "id" | "userId">>(
		key: T,
		value: Work[T],
		workUpdate: Pick<WorkUpdate, "title">,
	): Promise<void> {
		await this._db
			.updateTable("works")
			.set(workUpdate)
			.where(key as ReferenceExpression<DB, "works">, "=", value)
			.execute();
	}

	async delete<T extends keyof Pick<Work, "id" | "userId">>(
		key: T,
		value: Work[T],
	): Promise<void> {
		await this._db
			.deleteFrom("works")
			.where(key as ReferenceExpression<DB, "works">, "=", value)
			.execute();
	}
}
