import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type TestApp, spawnApp } from "../testApp.js";
import { createValidationError } from "../utils.js";

describe("Users", () => {
	let app: TestApp;
	beforeEach(async () => {
		app = await spawnApp();
	});

	afterEach(async () => {
		await app.close();
	});
	describe("Change Profile Password", () => {
		it("Should return 200 status code when data is valid", async () => {
			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const response = await app.changeProfilePassword(
				{
					oldPassword: data.password,
					newPassword: "newPassword",
					newPasswordConfirmation: "newPassword",
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(response.statusCode).toBe(200);
			expect(response.body).toBeTypeOf("object");
			expect(response.body).toHaveProperty("status");
			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toBeTypeOf("string");
		});

		it("Should return 400 status code when data is invalid", async () => {
			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const testCases = [
				{
					reqBody: {
						oldPassword: data.password,
					},
					resBody: createValidationError("newPassword"),
				},
				{
					reqBody: {
						newPassword: "newPassword",
					},
					resBody: createValidationError("oldPassword", "newPassword"),
				},
				{
					reqBody: {
						oldPassword: "newPassword",
						newPassword: "newPassword",
						newPasswordConfirmation: "newPassword",
					},
					resBody: createValidationError("newPassword"),
				},

				{
					reqBody: {
						oldPassword: "oldPassword",
						newPassword: "newPassword",
						newPasswordConfirmation: "anotherPassword",
					},
					resBody: createValidationError("newPassword"),
				},
			];

			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			for (const testCase of testCases) {
				const response = await app.changeProfilePassword(
					testCase.reqBody,
					verifyResult.get("Set-Cookie"),
				);

				expect(response.statusCode).toBe(400);
				expect(Object.keys(response.body)).toEqual(
					Object.keys(testCase.resBody),
				);

				expect(Object.keys(response.body.errors)).toEqual(
					Object.keys(testCase.resBody.errors),
				);
			}
		});

		it("Should return 400 status code when password is wrong", async () => {
			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const response = await app.changeProfilePassword(
				{
					oldPassword: "wrongPassword",
					newPassword: "newPassword",
					newPasswordConfirmation: "newPassword",
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(response.statusCode).toBe(400);
			expect(response.body).toBeTypeOf("object");
			expect(response.body).toHaveProperty("status");
			expect(response.body).toHaveProperty("error");
		});
	});
});
