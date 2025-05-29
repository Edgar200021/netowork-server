import { sql } from "kysely";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { ValidationErrorResponseDto } from "../../src/common/dto/base.dto.js";
import type { CategoryResponseDto } from "../../src/dto/categories/categoryResponse.dto.js";
import { TaskStatus, UserRole } from "../../src/storage/db.js";
import type { Category } from "../../src/storage/postgres/types/category.type.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { createValidationError, pdfPath } from "../utils.js";
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

	describe("Increment View", () => {
		it("Should return 200 status code when request is valid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const incrementResult = await app.incrementTaskView(
				{ taskId: taskIds[0] },
				verifyResult.get("Set-Cookie"),
			);

			expect(incrementResult.statusCode).toBe(200);
			expect(incrementResult.body.data).toBe(null);
		});

		it("Should save task view in database", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			console.log("TASK IDS", taskIds);

			const incrementResult = await app.incrementTaskView(
				{ taskId: taskIds[0] },
				verifyResult.get("Set-Cookie"),
			);

			expect(incrementResult.statusCode).toBe(200);
			expect(incrementResult.body.data).toBe(null);

			const taskView = await app.database
				.selectFrom("taskViews")
				.where("userId", "=", verifyResult.body.data.id)
				.where("taskId", "=", taskIds[0])
				.selectAll()
				.executeTakeFirst();

			expect(taskView).toBeDefined();
		});

		it("Should created only one view with same user id and task id", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			for (let i = 0; i < 2; i++) {
				const incrementResult = await app.incrementTaskView(
					{ taskId: taskIds[0] },
					verifyResult.get("Set-Cookie"),
				);

				expect(incrementResult.statusCode).toBe(200);
				expect(incrementResult.body.data).toBe(null);
			}

			const taskView = await app.database
				.selectFrom("taskViews")
				.select((eb) => eb.fn.count("id").as("count"))
				.where("taskId", "=", taskIds[0])
				.executeTakeFirst();

			expect(taskView).toBeDefined();
			expect(taskView.count).toBe("1");
		});

		it("Should return 400 status code when data is not valid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const testCases = [
				{
					reqBody: {
						taskId: 1,
					},
					resBody: createValidationError("taskId"),
				},
				{
					reqBody: { taskId: "Non uuid" },
					resBody: createValidationError("taskId"),
				},
			];

			for (const testCase of testCases) {
				const result = await app.incrementTaskView(
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
			const result = await app.incrementTaskView({
				taskId: taskIds[0],
			});
			expect(result.statusCode).toBe(401);
		});

		it(`Should return 403 status code when user role is not "${UserRole.Freelancer}"`, async () => {
			const verifyResult = await app.createAndVerify({
				...data,
				role: UserRole.Client,
			});
			expect(verifyResult.statusCode).toBe(200);

			const result = await app.incrementTaskView(
				{ taskId: taskIds[0] },
				verifyResult.get("Set-Cookie"),
			);
			expect(result.statusCode).toBe(403);
		});

		it("Should return 404 status code when task id is not provided", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const result = await app.incrementTaskView(
				{},
				verifyResult.get("Set-Cookie"),
			);
			expect(result.statusCode).toBe(404);
		});
	});
});
