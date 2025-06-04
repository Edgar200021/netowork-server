import { sql } from "kysely";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { ValidationErrorResponseDto } from "../../src/common/dto/base.dto.js";
import {
	MAX_TASK_REPLY_DESCRIPTION_LENGTH,
	MIN_TASK_REPLY_DESCRIPTION_LENGTH,
} from "../../src/const/validator.js";
import type { CategoryResponseDto } from "../../src/dto/categories/categoryResponse.dto.js";
import { TaskStatus, UserRole } from "../../src/storage/db.js";
import type { Category } from "../../src/storage/postgres/types/category.type.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { createValidationError, genUuid } from "../utils.js";
describe("Task", () => {
	let app: TestApp;
	let category: CategoryResponseDto[];
	let taskIds: string[] = [];

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

		try {
			const user = await app.database
				.insertInto("users")
				.values({
					role: data.role,
					firstName: data.firstName,
					lastName: data.lastName,
					email: "random@gmail.com",
					password: data.password,
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
						"Enim ea enim eiusmod minim amet do id labore anim ut id quis. Fugiat culpa veniam dolor est. Et aliqua aute ex qui sunt laboris cupidatat id sint. Do laboris reprehenderit cupidatat nostrud voluptate proident ipsum officia ipsum occaecat ad. Deserunt ipsum exercitation dolor ad elit id minim nisi velit.",
					categoryId: category[1].id,
					subcategoryId: category[1].subCategories[3].id,
					price: 500,
				},
				{
					clientId: user.id,
					title: "Task title 3",
					description:
						"Qui labore magna ex eiusmod pariatur. Non anim cillum irure sunt ipsum exercitation do irure incididunt aliquip ex eiusmod eu. Eu ea sit eu amet nulla reprehenderit dolor officia proident ut anim. Sit ea laborum reprehenderit do tempor voluptate occaecat veniam. Non id officia consequat incididunt consectetur amet dolor reprehenderit duis dolore fugiat laboris sunt sint. Aute labore culpa nulla velit deserunt aliqua in non dolor eiusmod adipisicing irure fugiat enim.",
					categoryId: category[2].id,
					subcategoryId: category[2].subCategories[0].id,
					price: 1000,
				},
			];

			const ids = await app.database
				.insertInto("task")
				.values(tasks)
				.returning(["id"])
				.execute();

			taskIds = ids.map((t) => t.id);

			return new Promise((res) => setTimeout(res, 4000));
		} catch (error) {
			console.log("ERRORR", error);
			throw error;
		}
	});

	afterEach(async () => {
		await app.close();
		return new Promise((res) => setTimeout(res, 4000));
	});

	describe("Create Task Reply", () => {
		it("Should return 201 status code when request is valid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const createReplyResult = await app.createTaskReply(
				{
					taskId: taskIds[0],
					description: "d".repeat(MIN_TASK_REPLY_DESCRIPTION_LENGTH),
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(createReplyResult.statusCode).toBe(201);
			expect(createReplyResult.body.data).toBeNull();
		});

		it("Should save reply in database when request is valid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const createReplyResult = await app.createTaskReply(
				{
					taskId: taskIds[0],
					description: "d".repeat(MIN_TASK_REPLY_DESCRIPTION_LENGTH),
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(createReplyResult.statusCode).toBe(201);
			expect(createReplyResult.body.data).toBeNull();

			const reply = await app.database
				.selectFrom("taskReplies")
				.selectAll()
				.where("freelancerId", "=", verifyResult.body.data.id)
				.where("taskId", "=", taskIds[0])
				.executeTakeFirst();

			expect(reply).toBeDefined();
		});

		it("Should return 400 status code when data is not valid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const testCases = [
				{
					reqBody: {
						taskId: "Invalid id",
					},
					resBody: createValidationError("taskId"),
				},
				{
					reqBody: {
						taskId: taskIds[0],
					},
					resBody: createValidationError("description"),
				},
				{
					reqBody: {
						taskId: taskIds[0],
						description: "d".repeat(MIN_TASK_REPLY_DESCRIPTION_LENGTH - 1),
					},
					resBody: createValidationError("description"),
				},
				{
					reqBody: {
						taskId: taskIds[0],
						description: "d".repeat(MAX_TASK_REPLY_DESCRIPTION_LENGTH + 1),
					},
					resBody: createValidationError("description"),
				},
			];

			for (const testCase of testCases) {
				const createReplyResult = await app.createTaskReply(
					testCase.reqBody,
					verifyResult.get("Set-Cookie"),
				);

				expect(createReplyResult.statusCode).toBe(400);
				expect(createReplyResult.body).toHaveProperty("errors");
				expect(
					Object.keys(
						createReplyResult.body.errors as ValidationErrorResponseDto,
					),
				).toEqual(Object.keys(testCase.resBody.errors));
			}
		});

		it("Should return 400 status code when reply already created for task", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const createReplyResult = await app.createTaskReply(
				{
					taskId: taskIds[0],
					description: "d".repeat(MIN_TASK_REPLY_DESCRIPTION_LENGTH),
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(createReplyResult.statusCode).toBe(201);
			expect(createReplyResult.body.data).toBeNull();

			const secondCreateReplyResult = await app.createTaskReply(
				{
					taskId: taskIds[0],
					description: "d".repeat(MIN_TASK_REPLY_DESCRIPTION_LENGTH),
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(secondCreateReplyResult.statusCode).toBe(400);
		});

		it(`Should return 400 status code when task status is not "${TaskStatus.Open}"`, async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			await app.database
				.updateTable("task")
				.set({
					status: TaskStatus.Completed,
				})
				.where("id", "=", taskIds[0])
				.execute();

			const createReplyResult = await app.createTaskReply(
				{
					taskId: taskIds[0],
					description: "d".repeat(MIN_TASK_REPLY_DESCRIPTION_LENGTH),
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(createReplyResult.statusCode).toBe(400);
		});

		it("Should return 401 status code when user is not logged in", async () => {
			const createReplyResult = await app.createTaskReply({
				taskId: taskIds[0],
				description: "d".repeat(MIN_TASK_REPLY_DESCRIPTION_LENGTH),
			});
			expect(createReplyResult.statusCode).toBe(401);
		});

		it(`Should return 403 status code when user role is not "${UserRole.Freelancer}"`, async () => {
			const verifyResult = await app.createAndVerify({
				...data,
				role: UserRole.Client,
			});
			expect(verifyResult.status).toBe(200);

			const createReplyResult = await app.createTaskReply(
				{
					taskId: taskIds[0],
					description: "d".repeat(MIN_TASK_REPLY_DESCRIPTION_LENGTH),
				},
				verifyResult.get("Set-Cookie"),
			);
			expect(createReplyResult.statusCode).toBe(403);
		});

		it("Should return 404 status code when task id is not provided or task not found", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const testCases = [genUuid(), undefined];

			for (const testCase of testCases) {
				const createReplyResult = await app.createTaskReply(
					{
						taskId: testCase,
						description: "d".repeat(MIN_TASK_REPLY_DESCRIPTION_LENGTH),
					},
					verifyResult.get("Set-Cookie"),
				);
				expect(createReplyResult.statusCode).toBe(404);
			}
		});
	});
});
