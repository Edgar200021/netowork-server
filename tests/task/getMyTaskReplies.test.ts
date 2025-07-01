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
import {
	GET_TASK_REPLIES_MAX_LIMIT,
	MIN_TASK_REPLY_DESCRIPTION_LENGTH,
} from "../../src/const/validator.js";
import type { CategoryResponseDto } from "../../src/dto/categories/categoryResponse.dto.js";
import { UserRole } from "../../src/storage/db.js";
import type { Category } from "../../src/storage/postgres/types/category.type.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { createValidationError, genUuid } from "../utils.js";
describe("Task", () => {
	let app: TestApp;
	let category: CategoryResponseDto[];
	let taskIds: string[] = [];
	let cookies: string[];
	let clientId: string;

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

		const verifyResult = await app.createAndVerify({
			role: UserRole.Client,
			firstName: "Thomas",
			lastName: "Thomson",
			email: "test@mail.com",
			password: "password",
			passwordConfirmation: "password",
		});

		expect(verifyResult.statusCode).toBe(200);

		cookies = verifyResult.get("Set-Cookie");
		clientId = verifyResult.body.data.id;

		const tasks = [
			{
				clientId,
				title: "Task title",
				description:
					"Dolor ea voluptate ullamco sit non proident nisi. Tempor duis labore aliquip pariatur dolor consequat id magna adipisicing minim aute elit exercitation. Magna sunt ut consectetur ut Lorem nisi mollit nostrud. Sunt excepteur magna proident incididunt. Ex exercitation mollit qui sint magna Lorem irure nulla dolor tempor minim non officia. Excepteur duis dolor qui excepteur tempor eiusmod aute veniam. Duis est dolore cupidatat nostrud in ullamco elit pariatur mollit quis deserunt veniam.",
				categoryId: category[0].id,
				subcategoryId: category[0].subCategories[0].id,
				price: 100,
			},
		];

		const ids = await app.database
			.insertInto("task")
			.values(tasks)
			.returning(["id"])
			.execute();

		taskIds = ids.map((t) => t.id);

		const freelancers = await app.database
			.insertInto("users")
			.values([
				{
					role: UserRole.Freelancer,
					firstName: "Freelancer",
					lastName: "Freelancer",
					email: "freelancer@mail",
					password: "password",
				},
				{
					role: UserRole.Freelancer,
					firstName: "Freelancer 2",
					lastName: "Freelancer 2",
					email: "freelancer2@mail",
					password: "password",
				},
			])
			.returning(["id"])
			.execute();

		for (const { id } of freelancers) {
			await app.database
				.insertInto("taskReplies")
				.values({
					freelancerId: id,
					description: "d".repeat(MIN_TASK_REPLY_DESCRIPTION_LENGTH),
					taskId: taskIds[0],
				})
				.execute();
		}
	});

	afterEach(async () => {
		await app.close();
	});

	describe("Get My Task Replies", () => {
		it("Should return 200 status code when request is valid", async () => {
			const repliesResult = await app.getMyTaskReplies(
				{ taskId: taskIds[0] },
				cookies,
			);

			expect(repliesResult.statusCode).toBe(200);
			expect(repliesResult.body.data).toHaveProperty("totalCount");
			expect(repliesResult.body.data).toHaveProperty("replies");

			expectTypeOf(repliesResult.body.data.totalCount).toBeNumber;
			expectTypeOf(repliesResult.body.data.replies).toBeArray;

			expect(repliesResult.body.data.totalCount).toBe(2);
		});

		it("Should return array of task replies", async () => {
			const testCases = [
				{
					reqBody: {
						taskId: taskIds[0],
					},
					resBody: {
						expectedArrayLength: 2,
					},
				},
				{
					reqBody: {
						taskId: taskIds[0],
						limit: 1,
					},
					resBody: {
						expectedArrayLength: 1,
					},
				},
				{
					reqBody: {
						taskId: taskIds[0],
						page: 2,
					},
					resBody: {
						expectedArrayLength: 0,
					},
				},
				{
					reqBody: {
						taskId: taskIds[0],
						limit: 1,
						page: 2,
					},
					resBody: {
						expectedArrayLength: 1,
					},
				},
			];

			for (const testCase of testCases) {
				const repliesResult = await app.getMyTaskReplies(
					testCase.reqBody,
					cookies,
				);

				console.log(repliesResult);

				expect(repliesResult.statusCode).toBe(200);
				expect(repliesResult.body.data.replies.length).toBe(
					testCase.resBody.expectedArrayLength,
				);
			}
		});

		it("Should return 400 status code when data is invalid", async () => {
			const testCases = [
				{
					reqBody: {
						taskId: "non uuid",
					},
					resBody: createValidationError("taskId"),
				},
				{
					reqBody: {
						taskId: 232,
					},
					resBody: createValidationError("taskId"),
				},
				{
					reqBody: {
						taskId: taskIds[0],
						limit: "string",
						page: "string",
					},
					resBody: createValidationError("limit", "page"),
				},
				{
					reqBody: {
						taskId: taskIds[0],
						limit: GET_TASK_REPLIES_MAX_LIMIT + 1,
					},
					resBody: createValidationError("limit"),
				},
				{
					reqBody: {
						taskId: taskIds[0],
						limit: -1,
						page: -1,
					},
					resBody: createValidationError("limit", "page"),
				},
			];

			for (const testCase of testCases) {
				const repliesResult = await app.getMyTaskReplies(
					testCase.reqBody,
					cookies,
				);

				expect(repliesResult.statusCode).toBe(400);
				expect(repliesResult.body).toHaveProperty("errors");
				expect(
					Object.keys(repliesResult.body.errors as ValidationErrorResponseDto),
				).toEqual(Object.keys(testCase.resBody.errors));
			}
		});

		it("Should return 401 status code when user is not logged in", async () => {
			const repliesResult = await app.getMyTaskReplies({ taskId: taskIds[0] });

			expect(repliesResult.statusCode).toBe(401);
		});

		it(`Should return 403 status code when user role is not "${UserRole.Client}"`, async () => {
			await app.redis.flushdb();
			const verifyResult = await app.createAndVerify({
				role: UserRole.Freelancer,
				firstName: "Thomas",
				lastName: "Thomson",
				email: "freelancer@mail.com",
				password: "password",
				passwordConfirmation: "password",
			});

			expect(verifyResult.statusCode).toBe(200);

			const repliesResult = await app.getMyTaskReplies(
				{ taskId: taskIds[0] },
				verifyResult.get("Set-Cookie"),
			);

			expect(repliesResult.statusCode).toBe(403);
		});

		it("Should return 404 status code when task not found", async () => {
			const repliesResult = await app.getMyTaskReplies(
				{ taskId: genUuid() },
				cookies,
			);
			expect(repliesResult.statusCode).toBe(404);
		});
	});
});
