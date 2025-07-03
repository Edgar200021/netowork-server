import {
	afterEach,
	beforeEach,
	describe,
	expect,
	expectTypeOf,
	it,
} from "vitest";
import { GET_CHATS_MAX_LIMIT } from "../../src/const/validator.js";
import { UserRole } from "../../src/storage/db.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { createValidationError, genUuid } from "../utils.js";

describe("Chat", () => {
	let app: TestApp;
	let cookie: string[] | undefined;
	let chatId: string;

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

		expect(user).toBeDefined;

		const verifyResult = await app.createAndVerify(data);

		const chat = await app.createChat(
			{
				recipientId: user!.id,
			},
			verifyResult.get("Set-Cookie"),
		);

		await app.database
			.insertInto("messages")
			.values([
				{
					chatId: chat.body.data,
					message: "Some message",
					senderId: user!.id,
				},
				{
					chatId: chat.body.data,
					message: "Some message 2",
					senderId: user!.id,
				},
				{
					chatId: chat.body.data,
					message: "Some message 3",
					senderId: user!.id,
				},
			])
			.execute();

		cookie = verifyResult.get("Set-Cookie");
		chatId = chat.body.data;
	});

	afterEach(async () => {
		await app.close();
	});

	describe("Get Chat Messages", () => {
		it("Should return 200 status code when request is successful", async () => {
			const chatMessagesResult = await app.getChatMessages(
				{
					chatId,
				},
				cookie,
			);

			expect(chatMessagesResult.statusCode).toBe(200);
		});

		it("Should contain totalCount and messages properties in data", async () => {
			const getChatsResult = await app.getChatMessages({ chatId }, cookie);

			expect(getChatsResult.body.data).toHaveProperty("totalCount");
			expect(getChatsResult.body.data).toHaveProperty("messages");
			expectTypeOf(getChatsResult.body.data.totalCount).toBeNumber;
			expectTypeOf(getChatsResult.body.data.messages).toBeArray;
		});

		it("Should return 400 status code when data is invalid", async () => {
			const testCases = [
				{
					chatId: 1234,
				},
				{
					chatId: "non uuid",
				},
			];

			for (const testCase of testCases) {
				const getChatsResult = await app.getChatMessages(testCase, cookie);
				expect(getChatsResult.statusCode).toBe(400);
				expect(Object.keys(getChatsResult.body.errors)).toEqual(["chatId"]);
			}
		});

		it("should return 400 when user is not a participant of the chat", async () => {
			const newUser = await app.createAndVerify({
				...data,
				email: "newemail@gmail.com",
			});

			const getChatsResult = await app.getChatMessages(
				{ chatId },
				newUser.get("Set-Cookie"),
			);

			expect(getChatsResult.statusCode).toBe(400);
		});

		it("Should return 401 status code when user is not authorized", async () => {
			const getChatsResult = await app.getChatMessages({ chatId });

			expect(getChatsResult.statusCode).toBe(401);
		});

		it("Should return 404 status code when chat not found", async () => {
			const getChatsResult = await app.getChatMessages(
				{ chatId: genUuid() },
				cookie,
			);

			expect(getChatsResult.statusCode).toBe(404);
		});
	});
});
