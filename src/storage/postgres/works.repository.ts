//import type {
//	ComparisonOperatorExpression,
//	Kysely,
//	ReferenceExpression,
//} from "kysely";
//import type { DB } from "../db.js";
//import type { User } from "./types/user.types.js";
//import type {
//	NewWork,
//	NewWorkImage,
//	Work,
//	WorkUpdate,
//} from "./types/userWorks.types.js";

//export class WorksRepository {
//	constructor(private readonly _db: Kysely<DB>) {}

//	async getAll(
//		filters?: Partial<{
//			[key in keyof Work]: {
//				value: Work[key];
//				op: ComparisonOperatorExpression;
//			};
//		}>,
//	): Promise<(Work & { images: string[] })[]> {
		//let query = this._db
		//	.selectFrom("works")
		//	.leftJoin("workImages as wi", "wi.workId", "works.id")
		//	.select([
		//		"works.id",
		//		"works.title",
		//		"works.createdAt",
		//		"works.updatedAt",
		//		"works.userId",
		//	])
		//	.select((eb) =>
		//		eb.fn.agg<string[]>("array_agg", ["wi.imageUrl"]).as("images"),
		//	)
		//	.groupBy("works.id");

//		if (filters && Object.keys(filters).length > 0) {
//			for (const [key, { value, op }] of Object.entries(filters)) {
//				query = query.where(key as ReferenceExpression<DB, "works">, op, value);
//			}
//		}310

//		const works = await query.execute();

//		return works;
//	}

//	async getByKey<T extends keyof Work = "id">(
//		key: T,
//		value: Work[T],
//	): Promise<Work | undefined> {
//		const work = await this._db
//			.selectFrom("works")
//			.leftJoin("workImages as wi", "wi.workId", "works.id")
//			.select([
//				"works.id",
//				"works.title",
//				"works.createdAt",
//				"works.updatedAt",
//				"works.userId",
//			])
//			.select((eb) =>
//				eb.fn.agg<string[]>("array_agg", ["wi.imageUrl"]).as("images"),
//			)
//			.where(key as ReferenceExpression<DB, "works">, "=", value)
//			.executeTakeFirst();

//		return work;
//	}

//	async getByUserId<T extends keyof Omit<Work, "userId"> = "id">(
//		userId: User["id"],
//		key: T,
//		value: Work[T],
//	): Promise<Work | undefined> {
//		const work = await this._db
//			.selectFrom("works")
//			.leftJoin("workImages as wi", "wi.workId", "works.id")
//			.select([
//				"works.id",
//				"works.title",
//				"works.createdAt",
//				"works.updatedAt",
//				"works.userId",
//			])
//			.select((eb) =>
//				eb.fn.agg<string[]>("array_agg", ["wi.imageUrl"]).as("images"),
//			)
//			.where("works.userId", "=", userId)
//			.where(key as ReferenceExpression<DB, "works">, "=", value)
//			.groupBy("works.id")
//			.executeTakeFirst();

//		return work;
//	}

//	async create(
//		newWork: NewWork,
//		workImages: Pick<NewWorkImage, "imageId" | "imageUrl">[],
//	): Promise<Work & { images: string[] }> {
		//const work = await this._db.transaction().execute(async (trx) => {
		//	const result = await trx
		//		.insertInto("works")
		//		.values(newWork)
		//		.returningAll()
		//		.executeTakeFirstOrThrow();

		//	await trx
		//		.insertInto("workImages")
		//		.values(workImages.map((w) => ({ ...w, workId: result.id })))
		//		.execute();

		//	return { ...result, images: workImages.map((w) => w.imageUrl) };
		//});

//		return work;
//	}

//	async update<T extends keyof Pick<Work, "id" | "userId">>(
//		key: T,
//		value: Work[T],
//		workUpdate: Pick<WorkUpdate, "title">,
//	): Promise<void> {
//		await this._db
//			.updateTable("works")
//			.set(workUpdate)
//			.where(key as ReferenceExpression<DB, "works">, "=", value)
//			.execute();
//	}

//	async delete<T extends keyof Pick<Work, "id" | "userId">>(
//		key: T,
//		value: Work[T],
//	): Promise<void> {
//		await this._db
//			.deleteFrom("works")
//			.where(key as ReferenceExpression<DB, "works">, "=", value)
//			.execute();
//	}
//}
