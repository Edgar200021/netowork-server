import { config } from "dotenv";
import type { Kysely } from "kysely";

import type { Redis } from "ioredis";
import crypto from "node:crypto";
import supertest from "supertest";
import type TestAgent from "supertest/lib/agent.js";
import { App } from "../src/app.js";
import { LoggerService } from "../src/common/services/logger.service.js";
import { readConfig } from "../src/config.js";
import type { Services } from "../src/services/services.js";
import type { DB } from "../src/storage/db.js";
import { setupDb } from "./setupDb.js";

export class TestApp {
	constructor(
		private readonly app: App,
		readonly database: Kysely<DB>,
		readonly redis: Redis,
		readonly services: Services,
		private readonly superTest: TestAgent,
	) {}

	async login(body: object) {
		const response = await this.superTest
			.post("/api/v1/auth/login")
			.set("Content-Type", "application/json")
			.send(body);

		return response;
	}

	async register(body: object) {
		const response = await this.superTest
			.post("/api/v1/auth/register")
			.set("Content-Type", "application/json")
			.send(body);

		return response;
	}

	async verify(token: string) {
		const response = await this.superTest
			.patch("/api/v1/auth/account-verification")
			.set("Content-Type", "application/json")
			.send({ token });

		return response;
	}

	async logout() {
		const response = await this.superTest
			.post("/api/v1/auth/logout")
			.set("Content-Type", "application/json")
			.send();

		return response;
	}

	async forgotPassword(body: object) {
		const response = await this.superTest
			.post("/api/v1/auth/forgot-password")
			.set("Content-Type", "application/json")
			.send(body);

		return response;
	}

	async resetPassword(body: object) {
		const response = await this.superTest
			.patch("/api/v1/auth/reset-password")
			.set("Content-Type", "application/json")
			.send(body);

		return response;
	}

	async sendVerificationEmail(cookies?: string[]) {
		const response = this.superTest
			.post("/api/v1/auth/send-verification-email")
			.set("Content-Type", "application/json");

		if (cookies) {
			response.set("Cookie", cookies);
		}

		await response;

		return response;
	}

	async setNewEmail(body: object, cookies?: string[]) {
		const response = this.superTest
			.patch("/api/v1/auth/set-new-email-address")
			.set("Content-Type", "application/json");

		if (cookies) {
			response.set("Cookie", cookies);
		}

		response.send(body);

		await response;

		return response;
	}

	async getMe(cookies?: string[]) {
		const request = this.superTest
			.get("/api/v1/users/profile")
			.set("Content-Type", "application/json");

		if (cookies) {
			request.set("Cookie", cookies);
		}

		const response = await request;

		return response;
	}

	async updateProfile(
		body: {
			email?: string;
			aboutMe?: string;
			avatar?: string;
			firstName?: string;
			lastName?: string;
		},
		cookies?: string[],
	) {
		const request = this.superTest.patch("/api/v1/users/profile");

		for (const key in body) {
			if (key === "avatar") continue;
			if (body[key as keyof typeof body]) {
				request.field(key, body[key as keyof typeof body]!);
			}
		}

		if (body.avatar) {
			request.attach("avatar", body.avatar);
		}

		if (cookies) {
			request.set("Cookie", cookies);
		}

		const response = await request;

		return response;
	}

	async changeProfilePassword(body: object, cookies?: string[]) {
		const request = this.superTest
			.patch("/api/v1/users/profile/change-password")
			.set("Content-Type", "application/json");

		if (cookies) {
			request.set("Cookie", cookies);
		}

		request.send(body);

		const response = await request;

		return response;
	}

	async createAndVerify(body: object) {
		await this.register(body);
		const token = (await this.redis.keys("*"))[0];

		const response = await this.verify(token);

		return response;
	}

	async getSessionFromResponse(
		response: supertest.Response,
	): Promise<string | undefined> {
		const cookies = response.get("Set-Cookie");

		return cookies
			?.find((cookie) => cookie.startsWith("session="))
			?.split(";")[0]
			.split("=")[1];
	}

	async close() {
		await this.database.destroy();
		await this.app.close();
	}
}

export const spawnApp = async (): Promise<TestApp> => {
	config();
	const settings = await readConfig(true);
	const logger = new LoggerService(settings);

	settings.application.port = 0;
	settings.redis.database = Math.floor(Math.random() * 15);
	settings.database.database = crypto.randomUUID().toString();

	const db = await setupDb(settings.database);
	const app = new App(settings, logger);

	await app.redis.select(settings.redis.database);
	await app.redis.flushdb();

	app.run();

	const test = supertest(app.server);

	return new TestApp(app, db, app.redis, app.services, test);
};
