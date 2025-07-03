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
import { createValidationError } from "../utils.js";

describe("Chat", () => {
	let app: TestApp;
	let cookie: string[] | undefined;

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

		const verifyResult = await app.createAndVerify(data);

		for (const user of users) {
			await app.createChat(
				{
					recipientId: user.id,
				},
				verifyResult.get("Set-Cookie"),
			);
		}

		cookie = verifyResult.get("Set-Cookie");
	});

	afterEach(async () => {
		await app.close();
	});

	describe("Get Chats", () => {
		it("Should return 200 status code when getting chats", async () => {
			const getChatsResult = await app.getChats({ limit: 20 }, cookie);

			expect(getChatsResult.statusCode).toEqual(200);
		});

		it("Should contain totalCount and chats properties in data", async () => {
			const getChatsResult = await app.getChats({ limit: 20 }, cookie);

			expect(getChatsResult.body.data).toHaveProperty("totalCount");
			expect(getChatsResult.body.data).toHaveProperty("chats");
			expectTypeOf(getChatsResult.body.data.totalCount).toBeNumber;
			expectTypeOf(getChatsResult.body.data.chats).toBeArray;
		});

		it("Should return correct data when filters are valid", async () => {
			const testCases = [
				{
					reqBody: {
						limit: 1,
					},
					resBody: {
						chatsLength: 1,
					},
				},
				{
					reqBody: {
						limit: 2,
					},
					resBody: {
						chatsLength: 2,
					},
				},
				{
					reqBody: {
						limit: 1,
						page: 1,
					},
					resBody: {
						chatsLength: 1,
					},
				},
			];

			for (const testCase of testCases) {
				const getChatsResult = await app.getChats(testCase.reqBody, cookie);
				expect(getChatsResult.body.data.chats.length).toBe(
					testCase.resBody.chatsLength,
				);
			}
		});

		it("Should return 400 status code when filters are invalid", async () => {
			const testCases = [
				{
					reqBody: {
						limit: 0,
					},
					resBody: createValidationError("limit"),
				},
				{
					reqBody: {
						limit: -5,
					},
					resBody: createValidationError("limit"),
				},
				{
					reqBody: {
						limit: GET_CHATS_MAX_LIMIT + 1,
					},
					resBody: createValidationError("limit"),
				},
				{
					reqBody: {
						page: 0,
					},
					resBody: createValidationError("page"),
				},
				{
					reqBody: {
						page: -1,
					},
					resBody: createValidationError("page"),
				},

				{
					reqBody: {
						limit: 0,
						page: -1,
					},
					resBody: createValidationError("limit", "page"),
				},
			];

			for (const testCase of testCases) {
				const getChatsResult = await app.getChats(testCase.reqBody, cookie);

				expect(Object.keys(getChatsResult.body.errors)).toEqual(
					Object.keys(testCase.resBody.errors),
				);
			}
		});

		it("Should return 401 status code when user is not authorized", async () => {
			const getChatsResult = await app.getChats({});

			expect(getChatsResult.statusCode).toBe(401);
		});
	});
});
