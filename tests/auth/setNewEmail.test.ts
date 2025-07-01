import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type TestApp, spawnApp } from "../testApp.js";

describe("Authentication", () => {
	let app: TestApp;

	beforeEach(async () => {
		app = await spawnApp();
	});

	afterEach(async () => {
		await app.close();
	});

	describe("Set New Email", () => {
		it("Should return 200 status code after set new email", async () => {
			const setSpy = vi.spyOn(app.redis, "set");

			const registerResponse = await app.register({
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			});

			expect(registerResponse.statusCode).toBe(201);

			const response = await app.setNewEmail(
				{
					newEmail: "changed@mail.com",
				},
				registerResponse.get("Set-Cookie"),
			);

			expect(response.statusCode).toBe(200);
			expect(setSpy).toBeCalledTimes(3);
		});

		it("Should return 400 status code when email is invalid", async () => {
			const registerResponse = await app.register({
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			});

			expect(registerResponse.statusCode).toBe(201);
			const response = await app.setNewEmail(
				{
					newEmail: "invalidEmail",
				},
				registerResponse.get("Set-Cookie"),
			);

			expect(response.statusCode).toBe(400);
			expect(response.body).toBeTypeOf("object");
			expect(response.body).toHaveProperty("status");
			expect(response.body).toHaveProperty("errors");
			expect(response.body.errors).toHaveProperty("newEmail");
		});

		it("Should return 400 status code when user with new email already exists", async () => {
			await app.register({
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			});

			const registerResponse = await app.register({
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test2@mail.com",
				password: "password",
				passwordConfirmation: "password",
			});

			expect(registerResponse.statusCode).toBe(201);

			const response = await app.setNewEmail(
				{
					newEmail: "test@mail.com",
				},
				registerResponse.get("Set-Cookie"),
			);

			expect(response.statusCode).toBe(400);
			expect(response.body).toBeTypeOf("object");
			expect(response.body).toHaveProperty("status");
			expect(response.body).toHaveProperty("error");
		});
	});
});
