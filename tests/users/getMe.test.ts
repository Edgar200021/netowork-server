import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type TestApp, spawnApp } from "../testApp.js";

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

	describe("Get Me", () => {
		it("Should return 200 status code when user is logged in", async () => {
			const getSpy = vi.spyOn(app.redis, "get");
			const setSpy = vi.spyOn(app.redis, "set");

			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const verifyResponse = await app.createAndVerify(data);
			expect(verifyResponse.status).toBe(200);

			const cookies = verifyResponse.get("Set-Cookie");
			expect(cookies).not.toBeUndefined();

			const response = await app.getMe(cookies);
			expect(response.status).toBe(200);

			expect(getSpy).toBeCalledTimes(1);
			expect(setSpy).toBeCalledTimes(3);

			expect(response.body).toBeTypeOf("object");
			expect(response.body).toHaveProperty("status");
			expect(response.body).toHaveProperty("data");
			expect(response.body.data).toHaveProperty("role");
			expect(response.body.data).toHaveProperty("firstName");
			expect(response.body.data).toHaveProperty("lastName");
			expect(response.body.data).toHaveProperty("email");
			expect(response.body.data).toHaveProperty("avatar");
			expect(response.body.data).toHaveProperty("aboutMe");
		});

		it("Should return 401 status code when user is not authorized", async () => {
			const setSpy = vi.spyOn(app.redis, "set");

			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const registerResponse = await app.register(data);
			expect(registerResponse.status).toBe(201);

			const response = await app.getMe();
			expect(response.status).toBe(401);

			expect(setSpy).toBeCalledTimes(2);
		});
	});
});
