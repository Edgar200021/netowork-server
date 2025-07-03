import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { UserRole } from "../../src/storage/db.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { genUuid } from "../utils.js";

describe("Chat", () => {
	let app: TestApp;
	let chatId: string;
	let cookie: string[] | undefined;
	let notClientCookie: string[] | undefined;

	beforeEach(async () => {
		app = await spawnApp();

		const user = await app.database
			.insertInto("users")
			.values({
				firstName: "Thomas",
				lastName: "Thomson",
				password: "password",
				role: UserRole.Freelancer,
				email: "first@gmail.com ",
			})
			.returning("id")
			.executeTakeFirst();

		const verifyResult = await app.createAndVerify({
			role: UserRole.Client,
			firstName: "Thomas",
			lastName: "Thomson",
			email: "test@mail.com",
			password: "password",
			passwordConfirmation: "password",
		});

		const verifyResultNotClient = await app.createAndVerify({
			role: UserRole.Freelancer,
			firstName: "Thomas",
			lastName: "Thomson",
			email: "test1@mail.com",
			password: "password",
			passwordConfirmation: "password",
		});

		notClientCookie = verifyResultNotClient.get("Set-Cookie");

		const chat = await app.database
			.insertInto("chat")
			.values({
				creatorId: verifyResult.body.data.id,
				recipientId: user!.id,
			})
			.returning("id")
			.executeTakeFirst();

		chatId = chat!.id;
		cookie = verifyResult.get("Set-Cookie");
	});

	afterEach(async () => {
		await app.close();
	});

	describe("Delete Chat", () => {
		it("Should return 200 status code when request is successful", async () => {
			const deleteChatResult = await app.deleteChat(
				{
					chatId,
				},
				cookie,
			);

			expect(deleteChatResult.statusCode).toBe(200);
		});

		it("Should delete from database when request is successful", async () => {
			const deleteChatResult = await app.deleteChat(
				{
					chatId,
				},
				cookie,
			);

			const dbChat = await app.database
				.selectFrom("chat")
				.where("id", "=", chatId)
				.executeTakeFirst();

			expect(dbChat).toBeUndefined();
		});

		it("Should return 400 status code when chat id is invalid", async () => {
			const testCases = [{ chatId: 123 }, { chatId: "non uuid" }];

			for (const testCase of testCases) {
				const deleteChatResult = await app.deleteChat(testCase, cookie);

				expect(deleteChatResult.statusCode).toBe(400);
			}
		});

		it("Should return 401 status code when user is not authorized", async () => {
			const deleteChatResult = await app.deleteChat({ chatId });
			expect(deleteChatResult.statusCode).toBe(401);
		});

		it(`Should return 403 status code when user role is not "${UserRole.Client}"`, async () => {
			const deleteChatResult = await app.deleteChat(
				{ chatId },
				notClientCookie,
			);
			expect(deleteChatResult.statusCode).toBe(403);
		});

		it(`Should return 404 status code when chatId is invalid or chat doesn' exists`, async () => {
			const testCases = [{ chatId: genUuid() }, { chatId: undefined }];

			for (const testCase of testCases) {
				const deleteChatResult = await app.deleteChat(testCase, cookie);

				expect(deleteChatResult.statusCode).toBe(404);
			}
		});
	});
});
