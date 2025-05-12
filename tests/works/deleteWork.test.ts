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

	describe("Delete Work", () => {
		it("Should return 200 status code when work is deleted", async () => {
			const verifyResponse = await app.createAndVerify(data);
			expect(verifyResponse.statusCode).toBe(200);

			const createResponse = await app.createWork(
				{
					title: "title",
					files: [imagePath, imagePath],
				},
				verifyResponse.get("Set-Cookie"),
			);
			expect(createResponse.statusCode).toBe(201);

			console.log(createResponse);

			const deleteResponse = await app.deleteWork(
				createResponse.body.data.id,
				verifyResponse.get("Set-Cookie"),
			);
			expect(deleteResponse.statusCode).toBe(200);
		});

		it("Should delete work from database when work is deleted", async () => {
			const verifyResponse = await app.createAndVerify(data);
			expect(verifyResponse.statusCode).toBe(200);

			const createResponse = await app.createWork(
				{
					title: "title",
					files: [imagePath, imagePath],
				},
				verifyResponse.get("Set-Cookie"),
			);
			expect(createResponse.statusCode).toBe(201);

			const deleteResponse = await app.deleteWork(
				createResponse.body.data.id,
				verifyResponse.get("Set-Cookie"),
			);
			expect(deleteResponse.statusCode).toBe(200);

			const dbWorks = await app.database
				.selectFrom("works")
				.where("userId", "=", verifyResponse.body.id)
				.selectAll()
				.execute();

			expect(dbWorks.length).toBe(0);
		});

		it("Should return 404 status code when work is not found", async () => {
			const verifyResponse = await app.createAndVerify(data);
			expect(verifyResponse.statusCode).toBe(200);

			const deleteResponse = await app.deleteWork(
				1,
				verifyResponse.get("Set-Cookie"),
			);

			expect(deleteResponse.statusCode).toBe(404);
		});

		it("Should return 403 status code when user is not freelancer", async () => {
			const verifyResponse = await app.createAndVerify({
				...data,
				role: "client",
			});
			expect(verifyResponse.statusCode).toBe(200);

			const deleteResponse = await app.deleteWork(
				1,
				verifyResponse.get("Set-Cookie"),
			);
			expect(deleteResponse.statusCode).toBe(403);
		});

		it("Should return 401 status code when user is not logged in", async () => {
			const deleteResponse = await app.deleteWork(1);
			expect(deleteResponse.statusCode).toBe(401);
		});
	});
});
