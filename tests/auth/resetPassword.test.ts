import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type TestApp, spawnApp } from "../testApp.js";
import { createBaseError, createValidationError } from "../utils.js";

describe("Authentication", () => {
	let app: TestApp;
	beforeEach(async () => {
		app = await spawnApp();
	});

	afterEach(async () => {
		await app.close();
	});

	describe("Reset Password", () => {
		it("Reset Password with valid data returns 200 status code", async () => {
			const setSpy = vi.spyOn(app.redis, "set");
			const getSpy = vi.spyOn(app.redis, "get");

			const data = {
				role: "client",
				email: "test@mail.com",
				firstName: "John",
				lastName: "Doe",
				password: "password",
				passwordConfirmation: "password",
			};

			const verifyResponse = await app.createAndVerify(data);
			expect(verifyResponse.statusCode).toBe(200);

			const forgotPasswordResponse = await app.forgotPassword({
				email: data.email,
			});
			expect(forgotPasswordResponse.statusCode).toBe(200);

			const token = (await app.redis.keys("*")).at(-1);
			const response = await app.resetPassword({
				token,
				password: "newPassword",
				passwordConfirmation: "newPassword",
			});

			expect(response.statusCode).toBe(200);
			expect(response.body).toBeTypeOf("object");
			expect(response.body).toHaveProperty("status");
			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toBeTypeOf("string");

			expect(setSpy).toBeCalledTimes(4);
			expect(getSpy).toBeCalledTimes(2);
		});

		it("Reset Password with invalid data returns 404 status code", async () => {
			const data = {
				role: "client",
				email: "test@mail.com",
				firstName: "John",
				lastName: "Doe",
				password: "password",
				passwordConfirmation: "password",
			};

			await app.createAndVerify(data);
			const validToken = (await app.redis.keys("*"))[0];

			const testCases = [
				{
					reqBody: {
						token: validToken,
						password: "newPassword",
						passwordConfirmation: "WrongConfirmation",
					},
					resBody: createValidationError("password"),
					statusCode: 400,
				},
				{
					reqBody: {
						password: "validPassword",
						passwordConfirmation: "validPassword",
					},
					resBody: createValidationError("token"),
					statusCode: 400,
				},
				{
					reqBody: {
						token: "invalidToken",
						password: "validPassword",
						passwordConfirmation: "validPassword",
					},
					resBody: createBaseError(),
					statusCode: 404,
				},
			];

			for (const testCase of testCases) {
				const response = await app.resetPassword(testCase.reqBody);

				expect(response.statusCode).toBe(testCase.statusCode);
				expect(Object.keys(response.body)).toEqual(
					Object.keys(testCase.resBody),
				);
			}
		});
	});
});
