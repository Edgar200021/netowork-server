import { sql } from "kysely";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { ValidationErrorResponseDto } from "../../src/common/dto/base.dto.js";
import type { CategoryResponseDto } from "../../src/dto/categories/categoryResponse.dto.js";
import { TaskStatus, UserRole } from "../../src/storage/db.js";
import type { Category } from "../../src/storage/postgres/types/category.type.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { createValidationError } from "../utils.js";

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

	let taskData: {
		title: string;
		description: string;
		categoryId: number;
		subCategoryId: number;
		price: number;
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

		taskData = {
			title: "Title",
			description:
				"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur imperdiet efficitur purus, ac faucibus risus elementum eget. Curabitur nisl quam, posuere ac erat a, vehicula dignissim nulla. Suspendisse consectetur ipsum vitae elit molestie, non rhoncus est venenatis. Donec eu libero nec erat consequat feugiat et vel purus. In dictum condimentum turpis, vitae rutrum leo rutrum sed. Aliquam elementum turpis a ante interdum, a consectetur lorem lobortis. Praesent ut lectus elit. Sed sit amet egestas magna. Morbi suscipit sapien in ex imperdiet, et hendrerit dui molestie. Maecenas eu malesuada turpis. Etiam viverra mauris leo, et placerat quam hendrerit sed.",
			categoryId: category[0].id,
			subCategoryId: category[0].subCategories[0].id,
			price: 100,
		};
	});

	beforeEach(async () => {
		app = await spawnApp();
		return new Promise((res) => setTimeout(res, 4000));
	});

	afterEach(async () => {
		await app.close();
		return new Promise((res) => setTimeout(res, 4000));
	});

	describe("Delete Task", () => {
		it("Should return 200 status code when data is valid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const createResult = await app.createTask(
				taskData,
				verifyResult.get("Set-Cookie"),
			);

			expect(createResult.statusCode).toBe(201);
			expect(createResult.body.data.id).toBeDefined();

			const deleteResult = await app.deleteTask(
				{
					taskId: createResult.body.data.id,
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(deleteResult.statusCode).toBe(200);
		});

		it("Should be deleted from database when request is successful", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const createResult = await app.createTask(
				taskData,
				verifyResult.get("Set-Cookie"),
			);

			expect(createResult.statusCode).toBe(201);
			expect(createResult.body.data.id).toBeDefined();

			const deleteResult = await app.deleteTask(
				{
					taskId: createResult.body.data.id,
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(deleteResult.statusCode).toBe(200);

			const task = await app.database
				.selectFrom("task")
				.where("id", "=", createResult.body.data.id)
				.selectAll()
				.executeTakeFirst();

			expect(task).toBeUndefined();
		});

		it("Should return 400 status code when data is invalid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const testCase = {
				reqBody: {
					taskId: "Invalid task id",
				},
				resBody: createValidationError("taskId"),
			};

			const deleteResult = await app.deleteTask(
				testCase.reqBody,
				verifyResult.get("Set-Cookie"),
			);

			expect(deleteResult.statusCode).toBe(400);
			expect(deleteResult.body).toHaveProperty("errors");
			expect(
				Object.keys(deleteResult.body.errors as ValidationErrorResponseDto),
			).toEqual(Object.keys(testCase.resBody.errors));
		});

		it(`Should return 400 status code when task status is not "${TaskStatus.Open}"`, async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const createResult = await app.createTask(
				taskData,
				verifyResult.get("Set-Cookie"),
			);

			expect(createResult.statusCode).toBe(201);
			expect(createResult.body.data.id).toBeDefined();

			const statuses = [TaskStatus.InProgress, TaskStatus.Completed];

			for (const status of statuses) {
				await app.database
					.updateTable("task")
					.set({
						status,
					})
					.execute();

				const deleteResult = await app.deleteTask(
					{
						taskId: createResult.body.data.id,
					},
					verifyResult.get("Set-Cookie"),
				);

				expect(deleteResult.statusCode).toBe(400);
			}
		});

		it("Should return 401 status code when user is not authenticated", async () => {
			const deleteResult = await app.deleteTask({
				taskId: 1,
			});

			expect(deleteResult.statusCode).toBe(401);
		});

		it(`Should return 403 status code when user role is not "${UserRole.Client}"`, async () => {
			const verifyResult = await app.createAndVerify({
				...data,
				role: UserRole.Freelancer,
			});
			expect(verifyResult.statusCode).toBe(200);

			const deleteResult = await app.deleteTask(
				{
					taskId: 1,
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(deleteResult.statusCode).toBe(403);
		});
	});
});
