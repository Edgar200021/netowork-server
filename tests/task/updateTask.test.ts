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
import { UserRole } from "../../src/storage/db.js";
import type { Category } from "../../src/storage/postgres/types/category.type.js";
import { type TestApp, spawnApp } from "../testApp.js";
import {
	createBaseError,
	createValidationError,
	genUuid,
	pdfPath,
	txtPath,
} from "../utils.js";

describe("Task", () => {
	let app: TestApp;
	let category: CategoryResponseDto[];

	const data = {
		role: UserRole.Client,
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
	});

	afterEach(async () => {
		await app.close();
	});

	describe("Update Task", () => {
		it("Should return 200 status code when data is valid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const createResult = await app.createTask(
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

			expect(createResult.statusCode).toBe(201);
			expect(createResult.body.data.id).toBeDefined();

			const testCases = [
				{
					reqBody: {
						title: "Updated title",
					},
					resBody: {
						title: "Updated title",
					},
				},
				{
					reqBody: {
						description: "Updated description".repeat(10),
					},
					resBody: {
						description: "Updated description".repeat(10),
					},
				},
				{
					reqBody: {
						categoryId: category[0].id,
						subCategoryId: category[0].subCategories[1].id,
					},
					resBody: {
						category: category[0].name,
						subCategory: category[0].subCategories[1].name,
					},
				},
				{
					reqBody: {
						price: 1000,
					},
					resBody: {
						price: 1000,
					},
				},
				{
					reqBody: {
						files: [pdfPath, txtPath],
					},
					resBody: {
						files: [
							{
								fileId: expect.any(String),
								fileUrl: expect.any(String),
								fileName: expect.any(String),
							},
							{
								fileId: expect.any(String),
								fileUrl: expect.any(String),
								fileName: expect.any(String),
							},
							{
								fileId: expect.any(String),
								fileUrl: expect.any(String),
								fileName: expect.any(String),
							},
						],
					},
				},
			];

			for (const testCase of testCases) {
				const updateResult = await app.updateTask(
					{
						...testCase.reqBody,
						taskId: createResult.body.data.id,
					},
					verifyResult.get("Set-Cookie"),
				);

				expect(updateResult.status).toBe(200);
				const keys = Object.keys(testCase.resBody);

				for (const key of keys) {
					if (key === "files") {
						expect(updateResult.body.data.files).toHaveLength(
							//@ts-ignore
							testCase.resBody[key].length,
						);
						for (const file of updateResult.body.data.files) {
							//@ts-ignore
							expect(file).toEqual(testCase.resBody[key][0]);
						}

						continue;
					}
					//@ts-ignore
					expect(updateResult.body.data[key]).toEqual(testCase.resBody[key]);
				}
			}
		});

		it("Should return 400 status code when data is invalid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const createResult = await app.createTask(
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

			expect(createResult.statusCode).toBe(201);

			const testCases = [
				{
					reqBody: {
						categoryId: category[0].id,
						subCategoryId: category[1].subCategories[0].id,
					},
					resBody: createBaseError(),
				},
				{
					reqBody: {
						taskId: "Invalid id",
					},
					resBody: createValidationError("taskId"),
				},
				{
					reqBody: {
						title: "t".repeat(MIN_TASK_TITLE_LENGTH - 1),
					},
					resBody: createValidationError("title"),
				},
				{
					reqBody: {
						title: "t".repeat(MAX_TASK_TITLE_LENGTH + 1),
					},
					resBody: createValidationError("title"),
				},
				{
					reqBody: {
						description: "d".repeat(MIN_TASK_DESCRIPTION_LENGTH - 1),
					},
					resBody: createValidationError("description"),
				},
				{
					reqBody: {
						description: "d".repeat(MAX_TASK_DESCRIPTION_LENGTH + 1),
					},
					resBody: createValidationError("description"),
				},
				{
					reqBody: {
						price: "Invalid price",
					},
					resBody: createValidationError("price"),
				},
				{
					reqBody: {
						price: -1,
					},
					resBody: createValidationError("price"),
				},
			];

			for (const [index, testCase] of testCases.entries()) {
				const updateResult = await app.updateTask(
					{
						taskId: createResult.body.data.id,
						...testCase.reqBody,
					},
					verifyResult.get("Set-Cookie"),
				);

				expect(updateResult.status).toBe(400);
				if (index === 0) {
					expect(Object.keys(updateResult.body)).toEqual(
						Object.keys(testCase.resBody),
					);

					continue;
				}

				expect(updateResult.body).toHaveProperty("errors");
				expect(
					Object.keys(updateResult.body.errors as ValidationErrorResponseDto),
					// @ts-ignore
				).toEqual(Object.keys(testCase.resBody.errors));
			}
		});

		it(`Should return 400 status code when files count is more than ${TASK_FILES_MAX_COUNT}`, async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const createResult = await app.createTask(
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

			expect(createResult.statusCode).toBe(201);

			const updateResult = await app.updateTask(
				{
					taskId: createResult.body.data.id,
					files: Array(
						TASK_FILES_MAX_COUNT - createResult.body.data.files.length + 1,
					).fill(txtPath),
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(updateResult.status).toBe(400);
		});

		it("Should return 401 status code when user is not authenticated", async () => {
			const updateResult = await app.updateTask({
				taskId: 123,
				title: "New title",
			});

			expect(updateResult.status).toBe(401);
		});

		it(`Should return 403 status code when user is not "${UserRole.Client}"`, async () => {
			const verifyResult = await app.createAndVerify({
				...data,
				role: UserRole.Freelancer,
			});
			expect(verifyResult.statusCode).toBe(200);

			const result = await app.updateTask(
				{
					taskId: "Some id",
				},
				verifyResult.get("Set-Cookie"),
			);
			expect(result.statusCode).toBe(403);
		});

		it("Should return 404 status code when task id is not provided or task not found", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const createResult = await app.createTask(
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

			expect(createResult.statusCode).toBe(201);

			const testCases = [
				{ taskId: undefined },
				{ taskId: genUuid(), title: "New title" },
			];

			for (const testCase of testCases) {
				const updateResult = await app.updateTask(
					testCase,
					verifyResult.get("Set-Cookie"),
				);

				expect(updateResult.status).toBe(404);
			}
		});
	});
});
