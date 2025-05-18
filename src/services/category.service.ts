import { sql } from "kysely";
import { GET_CATEGORY_KEYS } from "../const/redis.js";
import type { Database } from "../storage/postgres/database.js";
import type { Category } from "../storage/postgres/types/category.type.js";
import type { Redis } from "../storage/redis/redis.js";

export class CategoryService {
	constructor(
		private readonly _database: Database,
		private readonly _redis: Redis,
	) {}

	async getAllCategories(): Promise<
		(Category & { subCategories: Pick<Category, "id" | "name">[] })[]
	> {
		const val = await this._redis.get(GET_CATEGORY_KEYS);
		if (val) {
			return JSON.parse(val);
		}

		const categories = await this._database
			.selectFrom("category")
			.innerJoin("category as child", "category.id", "child.parentId")
			.select((eb) =>
				eb.fn
					.jsonAgg(
						sql<
							Pick<Category, "id" | "name">
						>`json_build_object('id', child.id, 'name', child.name)`,
					)
					.as("subCategories"),
			)
			.select([
				"category.id",
				"category.name",
				"category.createdAt",
				"category.updatedAt",
				"category.parentId",
			])
			.where("category.parentId", "is", null)
			.groupBy("category.id")
			.orderBy("category.id")
			.execute();

		await this._redis.set(GET_CATEGORY_KEYS, JSON.stringify(categories));

		return categories;
	}
}
