import { sql } from "kysely";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { ValidationErrorResponseDto } from "../../src/common/dto/base.dto.js";
import { TASK_FILES_MAX_COUNT } from "../../src/const/multer.js";
import {
	MAX_TASK_DESCRIPTION_LENGTH,
	MAX_TASK_TITLE_LENGTH,
	MIN_TASK_DESCRIPTION_LENGTH,
	MIN_TASK_TITLE_LENGTH,
} from "../../src/const/validator.js";
import type { CategoryResponseDto } from "../../src/dto/categories/categoryResponse.dto.js";
import type { Category } from "../../src/storage/postgres/types/category.type.js";
import { type TestApp, spawnApp } from "../testApp.js";
import {
	createBaseError,
	createValidationError,
	imagePath,
	pdfPath,
} from "../utils.js";

describe("Task", () => {
	let app: TestApp;
	let category: CategoryResponseDto[];

	const data = {
		role: "client",
		firstName: "Thomas",
		lastName: "Thomson",
		email: "test@mail.com",
		password: "password",
		passwordConfirmation: "password",
	};

	beforeAll(async () => {
		app = await spawnApp();

		const res = await app.database
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

		category = res as CategoryResponseDto[];
	});

	beforeEach(async () => {
		app = await spawnApp();
		return new Promise((res) => setTimeout(res, 4000));
	});

	afterEach(async () => {
		await app.close();
		return new Promise((res) => setTimeout(res, 4000));
	});

	describe("Create Task", () => {
		it("Should return 201 status code when data is valid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const testCases = [
				{
					title: "Title",
					description:
						"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur imperdiet efficitur purus, ac faucibus risus elementum eget. Curabitur nisl quam, posuere ac erat a, vehicula dignissim nulla. Suspendisse consectetur ipsum vitae elit molestie, non rhoncus est venenatis. Donec eu libero nec erat consequat feugiat et vel purus. In dictum condimentum turpis, vitae rutrum leo rutrum sed. Aliquam elementum turpis a ante interdum, a consectetur lorem lobortis. Praesent ut lectus elit. Sed sit amet egestas magna. Morbi suscipit sapien in ex imperdiet, et hendrerit dui molestie. Maecenas eu malesuada turpis. Etiam viverra mauris leo, et placerat quam hendrerit sed.",
					categoryId: category[0].id,
					subCategoryId: category[0].subCategories[0].id,
					price: 100,
					files: [pdfPath],
				},
				{
					title: "Title",
					description:
						"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur imperdiet efficitur purus, ac faucibus risus elementum eget. Curabitur nisl quam, posuere ac erat a, vehicula dignissim nulla. Suspendisse consectetur ipsum vitae elit molestie, non rhoncus est venenatis. Donec eu libero nec erat consequat feugiat et vel purus. In dictum condimentum turpis, vitae rutrum leo rutrum sed. Aliquam elementum turpis a ante interdum, a consectetur lorem lobortis. Praesent ut lectus elit. Sed sit amet egestas magna. Morbi suscipit sapien in ex imperdiet, et hendrerit dui molestie. Maecenas eu malesuada turpis. Etiam viverra mauris leo, et placerat quam hendrerit sed.",
					categoryId: category[0].id,
					subCategoryId: category[0].subCategories[0].id,
					price: 100,
				},
			];

			for (const [index, testCase] of testCases.entries()) {
				const result = await app.createTask(
					testCase,
					verifyResult.get("Set-Cookie"),
				);

				expect(result.statusCode).toBe(201);
				expect(result.body).toBeTypeOf("object");
				expect(result.body).toHaveProperty("status");
				expect(result.body).toHaveProperty("data");
				expect(result.body.data).toBeTypeOf("object");
				expect(result.body.data).toHaveProperty("id");
				expect(result.body.data).toHaveProperty("title");
				expect(result.body.data).toHaveProperty("description");
				expect(result.body.data).toHaveProperty("price");
				expect(result.body.data).toHaveProperty("creator");
				expect(result.body.data).toHaveProperty("category");
				expect(result.body.data).toHaveProperty("subCategory");
				expect(result.body.data).toHaveProperty("createdAt");
				expect(result.body.data).toHaveProperty("status");
				if (index === 0) {
					expect(result.body.data).toHaveProperty("files");
				}
			}
		});

		it("Should save task in database when task is created", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const result = await app.createTask(
				{
					title: "Title",
					description:
						"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur imperdiet efficitur purus, ac faucibus risus elementum eget. Curabitur nisl quam, posuere ac erat a, vehicula dignissim nulla. Suspendisse consectetur ipsum vitae elit molestie, non rhoncus est venenatis. Donec eu libero nec erat consequat feugiat et vel purus. In dictum condimentum turpis, vitae rutrum leo rutrum sed. Aliquam elementum turpis a ante interdum, a consectetur lorem lobortis. Praesent ut lectus elit. Sed sit amet egestas magna. Morbi suscipit sapien in ex imperdiet, et hendrerit dui molestie. Maecenas eu malesuada turpis. Etiam viverra mauris leo, et placerat quam hendrerit sed.",
					categoryId: category[0].id,
					subCategoryId: category[0].subCategories[0].id,
					price: 100,
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(result.statusCode).toBe(201);

			const databaseTask = await app.database
				.selectFrom("task")
				.selectAll()
				.where("title", "=", "Title")
				.executeTakeFirst();

			expect(databaseTask).toBeDefined();
		});

		it("Should return 400 status code when data is missing or invalid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const testCases = [
				{
					reqBody: {
						title: "title",
						price: 100,
						description: "d".repeat(MAX_TASK_DESCRIPTION_LENGTH),
						categoryId: category[0].id,
						subCategoryId: category[1].subCategories[0].id,
					},
					resBody: createBaseError(),
				},
				{
					reqBody: {
						title: "title",
						price: 100,
						description: "d".repeat(MAX_TASK_DESCRIPTION_LENGTH),
						categoryId: category[0].id,
						subCategoryId: category[0].subCategories[0].id,
						files: [imagePath],
					},
					resBody: createBaseError(),
				},
				{
					reqBody: {
						title: "title",
						price: 100,
					},
					resBody: createValidationError(
						"description",
						"categoryId",
						"subCategoryId",
					),
				},
				{
					reqBody: {
						title: "title",
						price: 100,
					},
					resBody: createValidationError(
						"description",
						"categoryId",
						"subCategoryId",
					),
				},
				{
					reqBody: {
						title: "t".repeat(MAX_TASK_TITLE_LENGTH + 1),
						price: 100,
						description: "t".repeat(MAX_TASK_DESCRIPTION_LENGTH + 1),
					},
					resBody: createValidationError(
						"title",
						"description",
						"categoryId",
						"subCategoryId",
					),
				},
				{
					reqBody: {
						title: "t".repeat(MIN_TASK_TITLE_LENGTH - 1),
						price: 100,
						description: "t".repeat(MIN_TASK_DESCRIPTION_LENGTH - 1),
					},
					resBody: createValidationError(
						"title",
						"description",
						"categoryId",
						"subCategoryId",
					),
				},
				{
					reqBody: {
						title: "title",
						description: "d".repeat(MAX_TASK_DESCRIPTION_LENGTH),
						categoryId: category[0].id,
						subCategoryId: category[0].subCategories[0].id,
					},
					resBody: createValidationError("price"),
				},
				{
					reqBody: {
						title: "title",
						description: "d".repeat(MAX_TASK_DESCRIPTION_LENGTH),
						price: "Invalid price",
						categoryId: category[0].id,
						subCategoryId: category[0].subCategories[0].id,
					},
					resBody: createValidationError("price"),
				},
			];

			for (const [index, testCase] of testCases.entries()) {
				const result = await app.createTask(
					testCase.reqBody,
					verifyResult.get("Set-Cookie"),
				);

				if (index === 0 || index === 1) {
					expect(result.statusCode).toBe(400);
					expect(Object.keys(result.body)).toEqual(
						Object.keys(testCase.resBody),
					);
					continue;
				}

				expect(result.body).toHaveProperty("errors");
				expect(
					Object.keys(result.body.errors as ValidationErrorResponseDto),
					// @ts-ignore
				).toEqual(Object.keys(testCase.resBody.errors));
			}
		});

		it(`Should return 400 status code when files count is more than ${TASK_FILES_MAX_COUNT}`, async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const result = await app.createTask(
				{
					title: "Title",
					description:
						"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur imperdiet efficitur purus, ac faucibus risus elementum eget. Curabitur nisl quam, posuere ac erat a, vehicula dignissim nulla. Suspendisse consectetur ipsum vitae elit molestie, non rhoncus est venenatis. Donec eu libero nec erat consequat feugiat et vel purus. In dictum condimentum turpis, vitae rutrum leo rutrum sed. Aliquam elementum turpis a ante interdum, a consectetur lorem lobortis. Praesent ut lectus elit. Sed sit amet egestas magna. Morbi suscipit sapien in ex imperdiet, et hendrerit dui molestie. Maecenas eu malesuada turpis. Etiam viverra mauris leo, et placerat quam hendrerit sed.",
					categoryId: category[0].id,
					subCategoryId: category[0].subCategories[0].id,
					price: 100,
					files: Array(TASK_FILES_MAX_COUNT + 1).fill(imagePath),
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(result.statusCode).toBe(400);
		});

		it("Should return 401 status code when user is not logged in", async () => {
			const result = await app.createTask({
				title: "Title",
				description:
					"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur imperdiet efficitur purus, ac faucibus risus elementum eget. Curabitur nisl quam, posuere ac erat a, vehicula dignissim nulla. Suspendisse consectetur ipsum vitae elit molestie, non rhoncus est venenatis. Donec eu libero nec erat consequat feugiat et vel purus. In dictum condimentum turpis, vitae rutrum leo rutrum sed. Aliquam elementum turpis a ante interdum, a consectetur lorem lobortis. Praesent ut lectus elit. Sed sit amet egestas magna. Morbi suscipit sapien in ex imperdiet, et hendrerit dui molestie. Maecenas eu malesuada turpis. Etiam viverra mauris leo, et placerat quam hendrerit sed.",
				categoryId: category[0].id,
				subCategoryId: category[0].subCategories[0].id,
				price: 100,
				files: [pdfPath],
			});
			expect(result.statusCode).toBe(401);
		});

		it('Should return 403 status code when user status is not "Client"', async () => {
			const verifyResult = await app.createAndVerify({
				...data,
				role: "freelancer",
			});
			expect(verifyResult.statusCode).toBe(200);

			const result = await app.createTask(
				{
					title: "Title",
					description:
						"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur imperdiet efficitur purus, ac faucibus risus elementum eget. Curabitur nisl quam, posuere ac erat a, vehicula dignissim nulla. Suspendisse consectetur ipsum vitae elit molestie, non rhoncus est venenatis. Donec eu libero nec erat consequat feugiat et vel purus. In dictum condimentum turpis, vitae rutrum leo rutrum sed. Aliquam elementum turpis a ante interdum, a consectetur lorem lobortis. Praesent ut lectus elit. Sed sit amet egestas magna. Morbi suscipit sapien in ex imperdiet, et hendrerit dui molestie. Maecenas eu malesuada turpis. Etiam viverra mauris leo, et placerat quam hendrerit sed.",
					categoryId: category[0].id,
					subCategoryId: category[0].subCategories[0].id,
					price: 100,
					files: [pdfPath],
				},
				verifyResult.get("Set-Cookie"),
			);
			expect(result.statusCode).toBe(403);
		});
	});
});
