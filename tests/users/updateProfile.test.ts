import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	MAX_ABOUT_ME_LENGTH,
	MAX_FIRST_NAME_LENGTH,
	MAX_LAST_NAME_LENGTH,
} from "../../src/const/validator.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { createValidationError, imagePath } from "../utils.js";

describe("Users", () => {
	let app: TestApp;
	beforeEach(async () => {
		app = await spawnApp();
		return new Promise((res) => setTimeout(res, 4000));
	});

	afterEach(async () => {
		await app.close();
		return new Promise((res) => setTimeout(res, 4000));
	});
	describe("Update Profile", () => {
		it("Should return 200 status code when data is valid", async () => {
			const setSpy = vi.spyOn(app.redis, "set");
			const getSpy = vi.spyOn(app.redis, "get");

			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const verifyResponse = await app.createAndVerify(data);
			expect(verifyResponse.statusCode).toBe(200);

			const res = await app.updateProfile(
				{
					email: "changed@gmail.com",
					aboutMe: "Changed about me",
				},
				verifyResponse.get("Set-Cookie"),
			);

			expect(res.statusCode).toBe(200);

			expect(setSpy).toBeCalledTimes(4);
			expect(getSpy).toBeCalledTimes(1);
		});

		it("Should set isVerified to false after email change", async () => {
			const setSpy = vi.spyOn(app.redis, "set");
			const getSpy = vi.spyOn(app.redis, "get");

			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const verifyResponse = await app.createAndVerify(data);
			expect(verifyResponse.statusCode).toBe(200);

			const res = await app.updateProfile(
				{
					email: "changed@gmail.com",
					aboutMe: "Changed about me",
				},
				verifyResponse.get("Set-Cookie"),
			);

			expect(res.statusCode).toBe(200);

			expect(setSpy).toBeCalledTimes(4);
			expect(getSpy).toBeCalledTimes(1);

			const user = await app.database
				.selectFrom("users")
				.where("email", "=", "changed@gmail.com")
				.select("isVerified")
				.executeTakeFirst();

			expect(user).not.toBeUndefined();
			expect(user?.isVerified).toBe(false);
		});

		it("Should has avatar when avatar is uploaded", async () => {
			const setSpy = vi.spyOn(app.redis, "set");
			const getSpy = vi.spyOn(app.redis, "get");

			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const verifyResponse = await app.createAndVerify(data);
			expect(verifyResponse.statusCode).toBe(200);

			const res = await app.updateProfile(
				{
					avatar: imagePath,
				},
				verifyResponse.get("Set-Cookie"),
			);

			expect(res.statusCode).toBe(200);

			expect(setSpy).toBeCalledTimes(3);
			expect(getSpy).toBeCalledTimes(1);

			const user = await app.database
				.selectFrom("users")
				.where("email", "=", data.email)
				.select("avatar")
				.executeTakeFirst();

			expect(user).not.toBeUndefined();
			expect(user?.avatar).not.toBeNull();
		});

		it("Should return 400 status code when data is invalid", async () => {
			const setSpy = vi.spyOn(app.redis, "set");
			const getSpy = vi.spyOn(app.redis, "get");

			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const verifyResponse = await app.createAndVerify(data);
			expect(verifyResponse.statusCode).toBe(200);

			const testCases = [
				{
					reqBody: {
						email: "test",
					},
					resBody: createValidationError("email"),
				},
				{
					reqBody: {
						firstName: "t".repeat(MAX_FIRST_NAME_LENGTH + 1),
						lastName: "t".repeat(MAX_LAST_NAME_LENGTH + 1),
					},
					resBody: createValidationError("firstName", "lastName"),
				},
				{
					reqBody: {
						aboutMe: "t".repeat(MAX_ABOUT_ME_LENGTH + 1),
					},
					resBody: createValidationError("aboutMe"),
				},
			];

			for (const testCase of testCases) {
				const res = await app.updateProfile(
					testCase.reqBody,
					verifyResponse.get("Set-Cookie"),
				);

				expect(res.statusCode).toBe(400);
				expect(Object.keys(res.body)).toEqual(Object.keys(testCase.resBody));

				expect(Object.keys(res.body.errors)).toEqual(
					Object.keys(testCase.resBody.errors),
				);
			}

			expect(setSpy).toBeCalledTimes(3);
			expect(getSpy).toBeCalledTimes(1);
		});

		it("Should return 401 when user is not authorized", async () => {
			const response = await app.updateProfile({
				email: "changed@gmail.com",
				aboutMe: "Changed about me",
			});

			expect(response.statusCode).toBe(401);
		});
	});
});
