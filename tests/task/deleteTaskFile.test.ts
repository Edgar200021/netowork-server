import { sql } from "kysely";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { ValidationErrorResponseDto } from "../../src/common/dto/base.dto.js";
import type { CategoryResponseDto } from "../../src/dto/categories/categoryResponse.dto.js";
import { UserRole } from "../../src/storage/db.js";
import type { Category } from "../../src/storage/postgres/types/category.type.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { createValidationError, pdfPath } from "../utils.js";

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
		return new Promise((res) => setTimeout(res, 4000));
	});

	afterEach(async () => {
		await app.close();
		return new Promise((res) => setTimeout(res, 4000));
	});

	describe("Delete Task File", () => {
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
			expect(createResult.body.data.files).toBeDefined();
			expect(createResult.body.data.files.length).toBe(1);

			const deleteFileResult = await app.deleteTaskFile(
				{
					taskId: createResult.body.data.id,
					fileId: createResult.body.data.files[0].fileId,
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(deleteFileResult.statusCode).toBe(200);
		});

		it("Should return 400 status code when data is invalid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const testCases = [
				{
					reqBody: {
						taskId: "Invalid task id",
						fileId: "some file id",
					},
					resBody: createValidationError("taskId"),
				},
				{
					reqBody: {
						fileId: 123,
						taskId: 12,
					},
					resBody: createValidationError("fileId"),
				},
			];

			for (const testCase of testCases) {
				const deleteFileResult = await app.deleteTaskFile(
					testCase.reqBody,
					verifyResult.get("Set-Cookie"),
				);

				expect(deleteFileResult.statusCode).toBe(400);
				expect(deleteFileResult.body).toHaveProperty("errors");
				expect(
					Object.keys(
						deleteFileResult.body.errors as ValidationErrorResponseDto,
					),
				).toEqual(Object.keys(testCase.resBody.errors));
			}
		});

		it("Should return 400 status code when task has no files", async () => {
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
			expect(createResult.body.data.id).toBeDefined();

			const deleteFileResult = await app.deleteTaskFile(
				{
					taskId: createResult.body.data.id,
					fileId: "Some file id",
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(deleteFileResult.statusCode).toBe(400);
		});

		it("Should return 401 status code when user is not authenticated", async () => {
			const deleteFileResult = await app.deleteTaskFile({
				taskId: 123,
				fileId: 123,
			});

			expect(deleteFileResult.status).toBe(401);
		});

		it(`Should return 403 status code when user is not ${UserRole.Client}`, async () => {
			const verifyResult = await app.createAndVerify({
				...data,
				role: UserRole.Freelancer,
			});
			expect(verifyResult.statusCode).toBe(200);

			const deleteTaskFileResult = await app.deleteTaskFile(
				{
					taskId: 123,
					fileId: "file id",
				},
				verifyResult.get("Set-Cookie"),
			);
			expect(deleteTaskFileResult.statusCode).toBe(403);
		});

		it("Should return 404 status code when task not found or file not found or task id is not provided", async () => {
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
			expect(createResult.body.data.files).toBeDefined();
			expect(createResult.body.data.files.length).toBe(1);

			const testCases = [
				{
					fileId: "Some file id",
					taskId: undefined,
				},
				{
					fileId: createResult.body.data.files[0].fileId,
					taskId: 50,
				},
				{
					taskId: createResult.body.data.id,
					fileId: "Some file id",
				},
			];

			for (const testCase of testCases) {
				const deleteFileResult = await app.deleteTaskFile(
					testCase,
					verifyResult.get("Set-Cookie"),
				);
				expect(deleteFileResult.statusCode).toBe(404);
			}
		});
	});
});
