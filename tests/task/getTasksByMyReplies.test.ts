import { sql } from "kysely";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	expectTypeOf,
	it,
} from "vitest";
import type { ValidationErrorResponseDto } from "../../src/common/dto/base.dto.js";
import { GET_ALL_TASKS_MAX_LIMIT } from "../../src/const/validator.js";
import type { CategoryResponseDto } from "../../src/dto/categories/categoryResponse.dto.js";
import { TaskStatus, UserRole } from "../../src/storage/db.js";
import type { Category } from "../../src/storage/postgres/types/category.type.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { createValidationError } from "../utils.js";

describe("Task", () => {
	let app: TestApp;
	let category: CategoryResponseDto[];
	let taskIds: string[] = [];
	let cookies: string[];

	const data = {
		role: UserRole.Freelancer,
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

		const user = await app.database
			.insertInto("users")
			.values({
				firstName: data.firstName,
				lastName: data.lastName,
				email: "random@gmail.com",
				password: data.password,
				role: UserRole.Client,
			})
			.returning(["id"])
			.executeTakeFirstOrThrow();

		const tasks = [
			{
				clientId: user.id,
				title: "Task title",
				description:
					"Dolor ea voluptate ullamco sit non proident nisi. Tempor duis labore aliquip pariatur dolor consequat id magna adipisicing minim aute elit exercitation. Magna sunt ut consectetur ut Lorem nisi mollit nostrud. Sunt excepteur magna proident incididunt. Ex exercitation mollit qui sint magna Lorem irure nulla dolor tempor minim non officia. Excepteur duis dolor qui excepteur tempor eiusmod aute veniam. Duis est dolore cupidatat nostrud in ullamco elit pariatur mollit quis deserunt veniam.",
				categoryId: category[0].id,
				subcategoryId: category[0].subCategories[0].id,
				price: 100,
			},
			{
				clientId: user.id,
				title: "Task title 2",
				description:
					"Dolor ea voluptate ullamco sit non proident nisi. Tempor duis labore aliquip pariatur dolor consequat id magna adipisicing minim aute elit exercitation. Magna sunt ut consectetur ut Lorem nisi mollit nostrud. Sunt excepteur magna proident incididunt. Ex exercitation mollit qui sint magna Lorem irure nulla dolor tempor minim non officia. Excepteur duis dolor qui excepteur tempor eiusmod aute veniam. Duis est dolore cupidatat nostrud in ullamco elit pariatur mollit quis deserunt veniam.",
				categoryId: category[1].id,
				subcategoryId: category[1].subCategories[3].id,
				price: 500,
			},
			{
				clientId: user.id,
				title: "Task title 3",
				description:
					"Dolor ea voluptate ullamco sit non proident nisi. Tempor duis labore aliquip pariatur dolor consequat id magna adipisicing minim aute elit exercitation. Magna sunt ut consectetur ut Lorem nisi mollit nostrud. Sunt excepteur magna proident incididunt. Ex exercitation mollit qui sint magna Lorem irure nulla dolor tempor minim non officia. Excepteur duis dolor qui excepteur tempor eiusmod aute veniam. Duis est dolore cupidatat nostrud in ullamco elit pariatur mollit quis deserunt veniam.",
				categoryId: category[2].id,
				subcategoryId: category[2].subCategories[1].id,
				price: 1000,
			},
		];

		const ids = await app.database
			.insertInto("task")
			.values(tasks)
			.returning(["id"])
			.execute();

		taskIds = ids.map((t) => t.id);

		const freelancer = await app.createAndVerify(data);
		expect(freelancer.status).toBe(200);

		for (const ids of taskIds) {
			await app.database
				.insertInto("taskReplies")
				.values({
					taskId: ids,
					freelancerId: freelancer.body.data.id,
					description:
						"Dolor ea voluptate ullamco sit non proident nisi. Tempor duis labore aliquip pariatur dolor consequat id magna adipisicing minim aute elit exercitation. Magna sunt ut consectetur ut Lorem nisi mollit nostrud. Sunt excepteur magna proident incididunt. Ex exercitation mollit qui sint magna Lorem irure nulla dolor tempor minim non officia. Excepteur duis dolor qui excepteur tempor eiusmod aute veniam. Duis est dolore cupidatat nostrud in ullamco elit pariatur mollit quis deserunt veniam.",
				})
				.execute();
		}

		cookies = freelancer.get("Set-Cookie");

		return new Promise((res) => setTimeout(res, 4000));
	});

	afterEach(async () => {
		await app.close();
		return new Promise((res) => setTimeout(res, 4000));
	});

	describe("Get Tasks By My Replies", () => {
		it("Should return 200 status code when request is valid", async () => {
			const getTasksResult = await app.getTasksByMyReplies({}, cookies);

			expect(getTasksResult.statusCode).toBe(200);
			expect(getTasksResult.body.data).toHaveProperty("totalCount");
			expect(getTasksResult.body.data).toHaveProperty("tasks");

			expectTypeOf(getTasksResult.body.data.totalCount).toBeNumber;
			expectTypeOf(getTasksResult.body.data.replies).toBeArray;
			expect(getTasksResult.body.data.totalCount).toBe(3);

			for (const task of getTasksResult.body.data.tasks) {
				expect(task).toHaveProperty("id");
				expect(task).toHaveProperty("createdAt");
				expect(task).toHaveProperty("title");
				expect(task).toHaveProperty("description");
				expect(task).toHaveProperty("category");
				expect(task).toHaveProperty("subCategory");
				expect(task).toHaveProperty("price");
				expect(task).toHaveProperty("files");
				expect(task).toHaveProperty("creator");
				expect(task).toHaveProperty("status");
				expect(task).toHaveProperty("views");
				expect(task.status).toEqual(TaskStatus.Open);
			}
		});

		it("Should return 200 status code when filters are valid", async () => {
			const testCases = [
				{
					reqBody: {
						limit: 1,
					},
					exptectedLength: 1,
				},
				{
					reqBody: {
						page: 2,
						limit: 1,
					},
					exptectedLength: 1,
				},
				{
					reqBody: {
						page: 3,
						limit: 2,
					},
					exptectedLength: 0,
				},
				{
					reqBody: {
						status: TaskStatus.InProgress,
					},
					exptectedLength: 0,
				},
				{
					reqBody: {
						status: TaskStatus.Completed,
					},
					exptectedLength: 0,
				},
			];

			for (const testCase of testCases) {
				const getTasksResult = await app.getTasksByMyReplies(
					testCase.reqBody,
					cookies,
				);
				expect(getTasksResult.statusCode).toBe(200);
				expect(getTasksResult.body.data.tasks).toHaveLength(
					testCase.exptectedLength,
				);
			}
		});

		it("Should return 400 status code when filters are not valid", async () => {
			const testCases = [
				{
					reqBody: {
						limit: GET_ALL_TASKS_MAX_LIMIT + 1,
					},
					resBody: createValidationError("limit"),
				},
				{
					reqBody: {
						page: -1,
						limit: -1,
					},
					resBody: createValidationError("limit", "page"),
				},
				{
					reqBody: {
						page: "not a number",
						limit: "not a number",
					},
					resBody: createValidationError("limit", "page"),
				},
				{
					reqBody: {
						status: "unknown",
					},
					resBody: createValidationError("status"),
				},
			];

			for (const testCase of testCases) {
				const getTasksResult = await app.getTasksByMyReplies(
					testCase.reqBody,
					cookies,
				);
				expect(getTasksResult.statusCode).toBe(400);
				expect(getTasksResult.body).toHaveProperty("errors");
				expect(
					Object.keys(getTasksResult.body.errors as ValidationErrorResponseDto),
				).toEqual(Object.keys(testCase.resBody.errors));
			}
		});

		it("Should return 401 status code when user is not logged in", async () => {
			const getTasksResult = await app.getTasksByMyReplies({});
			expect(getTasksResult.statusCode).toBe(401);
		});

		it(`Should return 403 status chode when user role is not "${UserRole.Freelancer}"`, async () => {
			await app.redis.flushdb();
			const verifyResult = await app.createAndVerify({
				...data,
				role: UserRole.Client,
				email: "client@gmail.com",
			});
			expect(verifyResult.statusCode).toBe(200);

			const getTasksResult = await app.getTasksByMyReplies(
				{},
				verifyResult.get("Set-Cookie"),
			);
			expect(getTasksResult.statusCode).toBe(403);
		});
	});
});
