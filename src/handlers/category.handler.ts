import type { Request, Response } from "express";
import { CategoryResponseDto } from "../dto/categories/categoryResponse.dto.js";
import type { GetAllCategoriesResponseDto } from "../dto/categories/getAllCategories/getAllCategoriesResponse.dto.js";
import type { Middlewares } from "../middlewares/middlewares.js";
import type { CategoryService } from "../services/category.service.js";
import { asyncWrapper } from "../utils/handlerAsyncWrapper.js";
import { BaseHandler } from "./base.handler.js";

export class CategoryHandler extends BaseHandler {
	constructor(
		private readonly _middlewares: Middlewares,
		private readonly _categoryService: CategoryService,
	) {
		super();
		this.bindMethods();
		this.setupRoutes();
	}

	protected bindMethods(): void {
		this.getAllCategories = this.getAllCategories.bind(this);
	}

	protected setupRoutes() {
		this.router.get(
			"/",
			this._middlewares.auth,
			asyncWrapper(this.getAllCategories),
		);
	}

	/**
	 * @openapi
	 * /api/v1/categories:
	 *   get:
	 *     tags:
	 *       - Categories
	 *     summary: Get all categories
	 *     description: Get all categories
	 *     responses:
	 *       200:
	 *         description: Success
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/GetAllCategoriesResponseDto'
	 *       401:
	 *         description: Unauthorized
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 status:
	 *                   type: string
	 *                 error:
	 *                   type: string
	 */
	async getAllCategories(
		req: Request<unknown, GetAllCategoriesResponseDto>,
		res: Response<GetAllCategoriesResponseDto>,
	) {
		const categories = await this._categoryService.getAllCategories();

		res.status(200).json({
			status: "success",
			data: categories.map((category) => new CategoryResponseDto(category)),
		});
	}
}
