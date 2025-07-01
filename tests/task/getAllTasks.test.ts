import { sql } from "kysely";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { ValidationErrorResponseDto } from "../../src/common/dto/base.dto.js";
import { GET_ALL_TASKS_MAX_LIMIT } from "../../src/const/validator.js";
import type { CategoryResponseDto } from "../../src/dto/categories/categoryResponse.dto.js";
import { TaskStatus, UserRole } from "../../src/storage/db.js";
import type { Category } from "../../src/storage/postgres/types/category.type.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { createValidationError, pdfPath } from "../utils.js";

describe("Task", () => {
	let app: TestApp;
	let category: CategoryResponseDto[];

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

		await app.database.insertInto("task").values(tasks).execute();
	});

	afterEach(async () => {
		await app.close();
	});

	describe("Get All Tasks", () => {
		it("Should return 200 status code when getting all tasks", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const getTasksResult = await app.getAllTasks(
				{},
				verifyResult.get("Set-Cookie"),
			);

			expect(getTasksResult.statusCode).toBe(200);
			expect(getTasksResult.body.data.tasks).toHaveLength(3);

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
				expect(task.status).toEqual(TaskStatus.Open);
			}
		});

		it("Should return correct tasks for various filter and sort parameters", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const testCases = [
				{
					name: "No filters or sorting",
					reqBody: {},
					expected: {
						statusCode: 200,
						dataLength: 3,
					},
				},
				{
					name: "Filter by single subCategoryId",
					reqBody: {
						subCategoryIds: category[0].subCategories[0].id.toString(),
					},
					expected: {
						statusCode: 200,
						dataLength: 1,
						dataTitles: ["Task title"],
					},
				},
				{
					name: "Filter by multiple subCategoryIds",
					reqBody: {
						subCategoryIds: `${category[0].subCategories[0].id},${category[1].subCategories[3].id}`,
					},
					expected: {
						statusCode: 200,
						dataLength: 2,
					},
				},
				{
					name: "Search by title keyword",
					reqBody: { search: "title" },
					expected: {
						statusCode: 200,
						dataLength: 3,
					},
				},
				{
					name: "Search with no results",
					reqBody: { search: "random" },
					expected: {
						statusCode: 200,
						dataLength: 0,
						dataTitles: [],
					},
				},
				{
					name: "Sort by price descending",
					reqBody: { sort: "price-desc" },
					expected: {
						statusCode: 200,
						dataLength: 3,
						dataTitles: ["Task title 3", "Task title 2", "Task title"],
					},
				},
				{
					name: "Filter by subCategoryIds and sort by price descending",
					reqBody: {
						subCategoryIds: `${category[0].subCategories[0].id},${category[1].subCategories[3].id}`,
						sort: "price-desc",
					},
					expected: {
						statusCode: 200,
						dataLength: 2,
						dataTitles: ["Task title 2", "Task title"],
					},
				},
				{
					name: "Pagination with limit=1, page=1",
					reqBody: { limit: 1, page: 1 },
					expected: {
						statusCode: 200,
						dataLength: 1,
					},
				},
				{
					name: "Pagination with limit=2, page=2",
					reqBody: { limit: 2, page: 2 },
					expected: {
						statusCode: 200,
						dataLength: 1,
						dataTitles: ["Task title 3"],
					},
				},
			];

			for (const { name, reqBody, expected } of testCases) {
				`Running test: ${name}`;
				const result = await app.getAllTasks(
					reqBody,
					verifyResult.get("Set-Cookie"),
				);
				expect(result.statusCode).toBe(expected.statusCode);
				expect(result.body.data.tasks).toHaveLength(expected.dataLength);
				if (expected.dataTitles?.length > 0) {
					const titles = result.body.data.tasks.map((task) => task.title);
					expect(titles).toEqual(expected.dataTitles);
				}
			}
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
						search: "",
					},
					resBody: createValidationError("search"),
				},
				{
					reqBody: {
						subCategoryIds: "abc",
					},
					resBody: createValidationError("subCategoryIds"),
				},
				{
					reqBody: {
						sort: "invalid_sort",
					},
					resBody: createValidationError("sort"),
				},
			];

			for (const testCase of testCases) {
				const result = await app.getAllTasks(
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
			const result = await app.getAllTasks({});
			expect(result.statusCode).toBe(401);
		});

		it(`Should return 403 status code when user role is not "${UserRole.Freelancer}"`, async () => {
			const verifyResult = await app.createAndVerify({
				...data,
				role: UserRole.Client,
			});
			expect(verifyResult.statusCode).toBe(200);

			const result = await app.getAllTasks({}, verifyResult.get("Set-Cookie"));
			expect(result.statusCode).toBe(403);
		});
	});
});
