import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ValidationErrorResponseDto } from "../../src/common/dto/base.dto.js";
import {
	WORK_IMAGES_FILE_NAME,
	WORK_IMAGES_MAX_COUNT,
} from "../../src/const/multer.js";
import { MAX_WORK_TITLE_LENGTH } from "../../src/const/validator.js";
import { type TestApp, spawnApp } from "../testApp.js";
import { createBaseError, createValidationError, imagePath } from "../utils.js";

describe("Works", () => {
	let app: TestApp;
	beforeEach(async () => {
		app = await spawnApp();
	});

	afterEach(async () => {
		await app.close();
	});

	const data = {
		role: "freelancer",
		firstName: "Thomas",
		lastName: "Thomson",
		email: "test@mail.com",
		password: "password",
		passwordConfirmation: "password",
	};

	describe("Create Work", () => {
		it("Should return 201 status code when work is created", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const result = await app.createWork(
				{
					title: "title",
					files: [imagePath, imagePath],
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(result.statusCode).toBe(201);
		});

		it("Should return 400 status code when data is invalid or missing", async () => {
			const testCases = [
				{
					reqBody: {
						title: "title",
					},
					resBody: createBaseError(),
				},
				{
					reqBody: {
						[WORK_IMAGES_FILE_NAME]: [imagePath, imagePath],
					},
					resBody: createValidationError("title"),
				},
				{
					reqBody: {
						title: "min",
						[WORK_IMAGES_FILE_NAME]: [imagePath, imagePath],
					},
					resBody: createValidationError("title"),
				},
				{
					reqBody: {
						title: "t".repeat(MAX_WORK_TITLE_LENGTH + 1),
						[WORK_IMAGES_FILE_NAME]: [imagePath, imagePath],
					},
					resBody: createValidationError("title"),
				},
			];

			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			for (const [index, testCase] of testCases.entries()) {
				const result = await app.createWork(
					testCase.reqBody,
					verifyResult.get("Set-Cookie"),
				);

				expect(result.statusCode).toBe(400);
				expect(result.body).toBeTypeOf("object");
				expect(result.body).toHaveProperty("status");

				if (index === 0) {
					expect(result.body).toHaveProperty("error");
					continue;
				}

				expect(result.body).toHaveProperty("errors");
				expect(
					Object.keys(result.body.errors as ValidationErrorResponseDto),
					// @ts-ignore
				).toEqual(Object.keys(testCase.resBody.errors));
			}
		});

		it(`Should return 400 status code when files count is more than ${WORK_IMAGES_MAX_COUNT}`, async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const result = await app.createWork(
				{
					title: "title",
					files: [...Array(WORK_IMAGES_MAX_COUNT + 1)].fill(imagePath),
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(result.statusCode).toBe(400);
			expect(result.body).toBeTypeOf("object");
			expect(result.body).toHaveProperty("status");
			expect(result.body).toHaveProperty("error");
		});

		it("Should return 400 status code when work with same title already exists", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const workData = {
				title: "title",
				files: [imagePath, imagePath],
			};

			const result = await app.createWork(
				workData,
				verifyResult.get("Set-Cookie"),
			);

			expect(result.statusCode).toBe(201);

			const result2 = await app.createWork(
				workData,
				verifyResult.get("Set-Cookie"),
			);

			expect(result2.statusCode).toBe(400);
			expect(result2.body).toBeTypeOf("object");
			expect(result2.body).toHaveProperty("status");
			expect(result2.body).toHaveProperty("error");
		});

		it("Should return 403 status code when user is not freelancer", async () => {
			const verifyResult = await app.createAndVerify({
				...data,
				role: "client",
			});
			expect(verifyResult.statusCode).toBe(200);

			const result = await app.createWork(
				{
					title: "title",
					files: [imagePath, imagePath],
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(result.statusCode).toBe(403);
		});

		it("Should saved work in database when work is created", async () => {
			const verifyResult = await app.createAndVerify(data);
			expect(verifyResult.statusCode).toBe(200);

			const result = await app.createWork(
				{
					title: "title",
					files: [imagePath, imagePath],
				},
				verifyResult.get("Set-Cookie"),
			);

			expect(result.statusCode).toBe(201);

			const work = await app.database
				.selectFrom("works")
				.where("title", "=", "title")
				.executeTakeFirst();
			expect(work).toBeDefined();
		});

		it("Should return 401 status code when user is not logged in", async () => {
			const result = await app.createWork({
				title: "title",
				files: [imagePath, imagePath],
			});

			expect(result.statusCode).toBe(401);
		});
	});
});
