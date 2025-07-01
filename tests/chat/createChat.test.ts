import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UserRole } from "../../src/storage/db.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { genUuid } from "../utils.js";

describe("Task", () => {
	let app: TestApp;
	let recipientIds: string[];

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

		const users = await app.database
			.insertInto("users")
			.values([
				{
					firstName: "Thomas",
					lastName: "Thomson",
					password: "password",
					role: UserRole.Freelancer,
					email: "first@gmail.com ",
				},
				{
					firstName: "Thomas",
					lastName: "Thomson",
					password: "password",
					role: UserRole.Freelancer,
					email: "second@gmail.com ",
				},
			])
			.returning("id")
			.execute();

		recipientIds = users.map((u) => u.id);
	});

	afterEach(async () => {
		await app.close();
	});

	describe("Create Chat", () => {
		it("Should return 201 status code when chat is creating", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const createChatResult = await app.createChat(
				{
					recipientId: recipientIds[0],
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(createChatResult.status).toBe(201);
		});

		it("Should return chat id when chat already exists", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			await app.createChat(
				{
					recipientId: recipientIds[0],
				},
				verifyResult.get("Set-Cookie"),
			);
			const createChatResult = await app.createChat(
				{
					recipientId: recipientIds[0],
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(createChatResult.body.data).toBeDefined();
			expect(createChatResult.body.data).toBeTypeOf("string");
		});

		it("Should return 400 status code when data is invalid", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const testCases = [
				{
					recipientId: 123,
				},
				{
					recipientId: "non-uuid",
				},
			];

			for (const testCase of testCases) {
				const createChatResult = await app.createChat(
					testCase,
					verifyResult.get("Set-Cookie"),
				);

				expect(createChatResult.status).toBe(400);
				expect(Object.keys(createChatResult.body.errors)).toEqual(
					Object.keys(testCase),
				);
			}
		});

		it("Should return 401 status code when user is not authorized", async () => {
			const createChatResult = await app.createChat({
				recipientId: recipientIds[0],
			});

			expect(createChatResult.statusCode).toBe(401);
		});

		it(`Should return 403 status code when user role is not "${UserRole.Client}" `, async () => {
			const verifyResult = await app.createAndVerify({
				...data,
				role: UserRole.Freelancer,
			});
			expect(verifyResult.status).toBe(200);

			const createChatResult = await app.createChat(
				{
					recipientId: recipientIds[0],
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(createChatResult.statusCode).toBe(403);
		});

		it("Should return 404 status code when recipient is not found", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.status).toBe(200);

			const createChatResult = await app.createChat(
				{
					recipientId: genUuid(),
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(createChatResult.statusCode).toBe(404);
		});
	});
});
