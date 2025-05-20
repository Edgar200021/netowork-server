import { sql } from "kysely";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	expectTypeOf,
	it,
} from "vitest";
import type { ValidationErrorResponseDto } from "../../src/common/dto/base.dto.js";
import { GET_ALL_TASKS_MAX_LIMIT } from "../../src/const/validator.js";
import type { CategoryResponseDto } from "../../src/dto/categories/categoryResponse.dto.js";
import type { Category } from "../../src/storage/postgres/types/category.type.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { createValidationError } from "../utils.js";
import { UserRole } from '../../src/storage/db.js';

describe("Task", () => {
	let app: TestApp;

	const data = {
		role: UserRole.Client,
		firstName: "Thomas",
		lastName: "Thomson",
		email: "test@mail.com",
		password: "password",
		passwordConfirmation: "password",
	};

	beforeEach(async () => {
		app = await spawnApp();
		return new Promise((res) => setTimeout(res, 4000));
	});

	afterEach(async () => {
		await app.close();
		return new Promise((res) => setTimeout(res, 4000));
	});

	describe("Get My Tasks", () => {
		it("Should return empty array if no tasks", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const response = await app.getMyTasks({}, verifyResult.get("Set-Cookie"));
			expect(response.statusCode).toBe(200);
			expect(response.body).toBeTypeOf("object");
			expect(response.body).toHaveProperty("status");
			expect(response.body).toHaveProperty("data");
			expectTypeOf(response.body.data).toBeArray;
			expect(response.body.data).toHaveLength(0);
		});

		it("Should return array of tasks if tasks exist", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const category: CategoryResponseDto[] = await app.database
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

			const response = await app.getMyTasks({}, verifyResult.get("Set-Cookie"));
			expect(response.statusCode).toBe(200);
			expect(response.body).toBeTypeOf("object");
			expect(response.body).toHaveProperty("status");
			expect(response.body).toHaveProperty("data");
			expectTypeOf(response.body.data).toBeArray;
			expect(response.body.data).toHaveLength(1);
		});

		it("Should return 400 status code when filters are invalid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const testCases = [
				{
					reqBody: {
						limit: -1,
					},
					resBody: createValidationError("limit"),
				},
				{
					reqBody: {
						page: -1,
					},
					resBody: createValidationError("page"),
				},
				{
					reqBody: {
						limit: GET_ALL_TASKS_MAX_LIMIT + 1,
					},
					resBody: createValidationError("limit"),
				},
				{
					reqBody: {
						status: "unknown",
					},
					resBody: createValidationError("status"),
				},
			];

			for (const testCase of testCases) {
				const result = await app.getMyTasks(
					testCase.reqBody,
					verifyResult.get("Set-Cookie"),
				);
				expect(result.statusCode).toBe(400);

				expect(result.body).toHaveProperty("errors");
				expect(
					Object.keys(result.body.errors as ValidationErrorResponseDto),
				).toEqual(Object.keys(testCase.resBody.errors));
			}
		});

		it("Should return 401 status code when user is not authenticated", async () => {
			const response = await app.getMyTasks({});
			expect(response.statusCode).toBe(401);
		});

		it(`Should return 403 status code when user role is not "${UserRole.Client}"`, async () => {
			const verifyResult = await app.createAndVerify({...data, role: UserRole.Freelancer});
			expect(verifyResult.statusCode).toBe(200);

			const response = await app.getMyTasks({}, verifyResult.get("Set-Cookie"));
			expect(response.statusCode).toBe(403);
		})
	});
});
