import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type TestApp, spawnApp } from "../testApp.js";
import { createBaseError, createValidationError } from "../utils.js";

describe("Authentication", () => {
	let app: TestApp;
	beforeEach(async () => {
		app = await spawnApp();
		return new Promise((res) => setTimeout(res, 4000));
	});

	afterEach(async () => {
		await app.close();
		return new Promise((res) => setTimeout(res, 4000));
	});

	describe("Register", () => {
		it("Register with valid data returns 201 status code", async () => {
			const response = await app.register({
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			});

			expect(response.statusCode).toBe(201);
		});

		it("Register with invalid data returns 400 status code", async () => {
			const testCases = [
				{
					reqBody: {
						role: "client",
						firstName: "Thomas",
						lastName: "Thomson",
						password: "password",
						passwordConfirmation: "password",
					},
					resBody: createValidationError("email"),
				},

				{
					reqBody: {
						role: "client",
						firstName: "John",
						lastName: "Doe",
						email: "test@mail.com",
					},
					resBody: createValidationError("password"),
				},
				{
					reqBody: {
						role: "admin",
						firstName: "Dana",
						lastName: "White",
						email: "easatr",
						password: "passw",
					},
					resBody: createValidationError("role", "email", "password"),
				},
				{
					reqBody: {
						role: "client",
						firstName: "Dana",
						lastName: "White",
						email: "test@gmail.com",
						password: "password",
						passwordConfirmation: "differentPassword",
					},
					resBody: createValidationError("password"),
				},
			];

			for (const testCase of testCases) {
				const response = await app.register(testCase.reqBody);

				expect(response.status).toBe(400);
				expect(Object.keys(response.body)).toEqual(
					Object.keys(testCase.resBody),
				);
				expect(Object.keys(response.body.errors)).toEqual(
					Object.keys(testCase.resBody.errors),
				);
			}
		});

		it("Register with existing email returns 400 status code", async () => {
			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			await app.register(data);

			const response = await app.register(data);

			expect(response.status).toBe(400);
			expect(Object.keys(createBaseError())).toEqual(
				Object.keys(response.body),
			);
		});

		it("After registering, data must be stored in the database", async () => {
			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const response = await app.register(data);

			expect(response.statusCode).toBe(201);

			const dbData = await app.database
				.selectFrom("users")
				.selectAll()
				.where("email", "=", data.email)
				.executeTakeFirst();

			expect(dbData).not.toBeUndefined();
			expect(dbData?.email).toBe(data.email);
			expect(dbData?.role).toBe(data.role);
			expect(dbData?.firstName).toBe(data.firstName);
			expect(dbData?.lastName).toBe(data.lastName);
			expect(dbData?.password).not.toBe(data.password);
			expect(dbData?.isVerified).toBe(false);
		});

		it("After successful registration, an email should be sent", async () => {
			vi.spyOn(
				app.services.emailService,
				"sendVerificationEmail",
			).mockResolvedValue();

			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			const response = await app.register(data);

			expect(response.statusCode).toBe(201);
			expect(
				app.services.emailService.sendVerificationEmail,
			).toHaveBeenCalledTimes(1);
			expect(
				app.services.emailService.sendVerificationEmail,
			).toHaveBeenCalledWith(
				data.email,
				expect.any(String),
				expect.any(Object),
			);
		});

		it("After registration, verification token should be saved in Redis", async () => {
			vi.spyOn(app.redis, "set").mockResolvedValue("OK");

			const data = {
				role: "client",
				firstName: "Thomas",
				lastName: "Thomson",
				email: "test@mail.com",
				password: "password",
				passwordConfirmation: "password",
			};

			await app.register(data);

			expect(app.redis.set).toHaveBeenCalledTimes(2);
		});
	});
});
