import type { Category } from "../../storage/postgres/types/category.type.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     CategoryResponseDto:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         name:
 *           type: string
 *         subCategories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: number
 *               name:
 *                 type: string
 */
export class CategoryResponseDto {
	readonly id: number;
	readonly name: string;
	readonly subCategories: Pick<Category, "id" | "name">[];

	constructor(
		category: Category & { subCategories: Pick<Category, "id" | "name">[] },
	) {
		this.id = category.id;
		this.name = category.name;
		this.subCategories = category.subCategories;
	}
}
