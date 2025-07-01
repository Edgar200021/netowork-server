import { sql } from "kysely";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { CategoryResponseDto } from "../../src/dto/categories/categoryResponse.dto.js";
import { TaskStatus, UserRole } from "../../src/storage/db.js";
import type { Category } from "../../src/storage/postgres/types/category.type.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { createValidationError, genUuid } from "../utils.js";

describe("Task", () => {
	let app: TestApp;
	let category: CategoryResponseDto[];
	const taskIds: string[] = [];

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

			for (const { id } of ids) {
				taskIds.push(id);
			}
		} catch (error) {
			console.log("ERRORR", error);
			throw error;
		}
	});

	afterEach(async () => {
		await app.close();
	});

	describe("Get Task", () => {
		it("Should return 200 status code when id is valid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const getTaskResult = await app.getTask(
				{ taskId: taskIds[0] },
				verifyResult.get("Set-Cookie"),
			);

			expect(getTaskResult.statusCode).toBe(200);

			expect(getTaskResult.body.data).toHaveProperty("id");
			expect(getTaskResult.body.data).toHaveProperty("createdAt");
			expect(getTaskResult.body.data).toHaveProperty("title");
			expect(getTaskResult.body.data).toHaveProperty("description");
			expect(getTaskResult.body.data).toHaveProperty("category");
			expect(getTaskResult.body.data).toHaveProperty("subCategory");
			expect(getTaskResult.body.data).toHaveProperty("price");
			expect(getTaskResult.body.data).toHaveProperty("files");
			expect(getTaskResult.body.data).toHaveProperty("creator");
			expect(getTaskResult.body.data).toHaveProperty("status");
			expect(getTaskResult.body.data.status).toEqual(TaskStatus.Open);
		});

		it("Should return 400 status code when id is invalid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const getTaskResult = await app.getTask(
				{ taskId: "Invalid task id" },
				verifyResult.get("Set-Cookie"),
			);
			const exptected = createValidationError("taskId");

			expect(getTaskResult.statusCode).toBe(400);
			expect(getTaskResult.body).toHaveProperty("errors");
			expect(Object.keys(getTaskResult.body.errors)).toEqual(
				Object.keys(exptected.errors),
			);
		});

		it("Should return 401 status code when user is not logged in", async () => {
			const getTaskResult = await app.getTask({ taskId: taskIds[0] });
			expect(getTaskResult.statusCode).toBe(401);
		});

		it(`Should return 403 status code when user is not '${UserRole.Freelancer}'`, async () => {
			const verifyResult = await app.createAndVerify({
				...data,
				role: UserRole.Client,
			});
			expect(verifyResult.statusCode).toBe(200);

			const getTaskResult = await app.getTask(
				{ taskId: taskIds[0] },
				verifyResult.get("Set-Cookie"),
			);
			expect(getTaskResult.statusCode).toBe(403);
		});

		it("Should return 404 status code when task is not found", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const getTaskResult = await app.getTask(
				{ taskId: genUuid() },
				verifyResult.get("Set-Cookie"),
			);
			expect(getTaskResult.statusCode).toBe(404);
		});
	});
});
