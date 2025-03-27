import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { type TestApp, spawnApp } from "../testApp.js";
import { imagePath } from "../utils.js";

describe("Works", () => {
	let app: TestApp;
	beforeEach(async () => {
		app = await spawnApp();
		return new Promise((res) => setTimeout(res, 4000));
	});

	afterEach(async () => {
		await app.close();
		return new Promise((res) => setTimeout(res, 4000));
	});

	const data = {
		role: "freelancer",
		firstName: "Thomas",
		lastName: "Thomson",
		email: "test@mail.com",
		password: "password",
		passwordConfirmation: "password",
	};

	it("Should return 200 status code", async () => {
		const verifyResult = await app.createAndVerify(data);
		expect(verifyResult.statusCode).toBe(200);

		const createResult = await app.createWork(
			{
				title: "title",
				files: [imagePath, imagePath],
			},
			verifyResult.get("Set-Cookie"),
		);
		expect(createResult.statusCode).toBe(201);

		const getResult = await app.getWorks(verifyResult.get("Set-Cookie"));
		expect(getResult.statusCode).toBe(200);

		expect(getResult.body).toBeTypeOf("object");
		expect(getResult.body).toHaveProperty("status");
		expect(getResult.body).toHaveProperty("data");
		expect(getResult.body.data).toBeInstanceOf(Array);
		expect(getResult.body.data).toHaveLength(1)
		expect(getResult.body.data[0]).toHaveProperty("title");
		expect(getResult.body.data[0]).toHaveProperty("images");
		expect(getResult.body.data[0].images).toBeInstanceOf(Array);
		expect(getResult.body.data[0].images).toHaveLength(2);
	});

	it("Should return 401 status code when user is not logged in", async () => {
		const result = await app.getWorks();
		expect(result.statusCode).toBe(401);
	})

	it("Should return 403 status code when user is not freelancer", async () => {
		const verifyResult = await app.createAndVerify({
			...data,
			role: "client",
		});
		expect(verifyResult.statusCode).toBe(200);

		const result = await app.getWorks(verifyResult.get("Set-Cookie"));
		expect(result.statusCode).toBe(403);
	})
});
