import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type TestApp, spawnApp } from "../testApp.js";

describe("Authentication", () => {
	let app: TestApp;

	beforeEach(async () => {
		app = await spawnApp();
		return new Promise((res) => setTimeout(res, 2000));
	});

	afterEach(async () => {
		await app.close();
		return new Promise((res) => setTimeout(res, 2000));
	});

	describe("Send Verification Email", () => {
		it("Should return 200 status code while sending verification email request after register", async () => {
			const registerResponse = await app.register({
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			});

			expect(registerResponse.statusCode).toBe(201);

			const response = await app.sendVerificationEmail(
				registerResponse.get("Set-Cookie"),
			);
			expect(response.statusCode).toBe(200);
		});

		it("Should return 400 status code when account already verified", async () => {
			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const registerResponse = await app.register(data);
			expect(registerResponse.statusCode).toBe(201);

			await app.database
				.updateTable("users")
				.set({ isVerified: true })
				.execute();

			const response = await app.sendVerificationEmail(
				registerResponse.get("Set-Cookie"),
			);

			expect(response.statusCode).toBe(400);
		});

		it("Should return 404 status code when cookies is not provided", async () => {
			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const registerResponse = await app.register(data);
			expect(registerResponse.statusCode).toBe(201);

			const response = await app.sendVerificationEmail();

			expect(response.statusCode).toBe(404);
		});
	});
});
