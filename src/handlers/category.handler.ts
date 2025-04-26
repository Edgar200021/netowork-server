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
