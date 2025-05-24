import { config } from "dotenv";
import type { Kysely } from "kysely";

import crypto from "node:crypto";
import supertest from "supertest";
import type TestAgent from "supertest/lib/agent.js";
import { App } from "../src/app.js";
import { LoggerService } from "../src/common/services/logger.service.js";
import { readConfig } from "../src/config.js";
import {
	AVATAR_FILE_NAME,
	TASK_FILES_NAME,
	WORK_IMAGES_FILE_NAME,
} from "../src/const/multer.js";
import type { Services } from "../src/services/services.js";
import type { DB, TaskStatus } from "../src/storage/db.js";
import type { Redis } from "../src/storage/redis/redis.js";
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
			request.attach(AVATAR_FILE_NAME, body.avatar);
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

	async createWork(
		body: {
			title?: string;
			files?: string[];
		},
		cookies?: string[],
	) {
		const request = this.superTest.post("/api/v1/works");

		if (body.title) {
			request.field("title", body.title);
		}

		if (body.files) {
			for (const file of body.files) {
				request.attach(WORK_IMAGES_FILE_NAME, file);
			}
		}

		if (cookies) {
			request.set("Cookie", cookies);
		}

		const response = await request;

		return response;
	}

	async getWorks(cookies?: string[]) {
		const request = this.superTest.get("/api/v1/works");

		if (cookies) {
			request.set("Cookie", cookies);
		}

		const response = await request;

		return response;
	}

	async deleteWork(workId?: number, cookies?: string[]) {
		const request = this.superTest.delete(`/api/v1/works/${workId ?? ""}`);

		if (cookies) {
			request.set("Cookie", cookies);
		}

		const response = await request;

		return response;
	}

	async getAllTasks(
		body: {
			limit?: number | string;
			page?: number | string;
			search?: string;
			subCategoryIds?: string;
			sort?: string;
		},
		cookies?: string[],
	) {
		// @ts-ignore
		const params = new URLSearchParams(body).toString();

		console.log(params);
		const request = this.superTest.get(
			`/api/v1/tasks${params ? `?${params}` : ""}`,
		);

		if (cookies) {
			request.set("Cookie", cookies);
		}

		const response = await request;

		return response;
	}

	async getMyTasks(
		body: {
			limit?: number;
			page?: number;
			status?: TaskStatus | string;
		},
		cookies?: string[],
	) {
		// @ts-ignore
		const params = new URLSearchParams(body).toString();

		const request = this.superTest.get(
			`/api/v1/tasks/my-tasks${params ? `?${params}` : ""}`,
		);

		if (cookies) {
			request.set("Cookie", cookies);
		}

		const response = await request;

		return response;
	}

	async getTask(
		body: {
			taskId?: number | string;
		},
		cookies?: string[],
	) {
		const request = this.superTest.get(`/api/v1/tasks${body.taskId ? `/${body.taskId}` : ""}`);

		if (cookies) {
			request.set("Cookie", cookies);
		}

		const response = await request;

		return response;
	}

	async createTask(
		body: {
			title?: string;
			description?: string;
			categoryId?: number;
			subCategoryId?: number;
			price?: number | string;
			files?: string[];
		},
		cookies?: string[],
	) {
		const request = this.superTest.post("/api/v1/tasks");

		for (const [key, value] of Object.entries(body)) {
			if (key === "files" && Array.isArray(value)) {
				for (const file of value) {
					request.attach(TASK_FILES_NAME, file);
				}
				continue;
			}

			if (value) {
				request.field(key, value);
			}
		}

		if (cookies) {
			request.set("Cookie", cookies);
		}

		const response = await request;

		return response;
	}

	async updateTask(
		body: {
			taskId?: number | string;
			title?: string;
			description?: string;
			categoryId?: number;
			subCategoryId?: number;
			price?: number | string;
			files?: string[];
		},
		cookies?: string[],
	) {
		const request = this.superTest.patch(
			`/api/v1/tasks${body.taskId ? `/${body.taskId}` : ""}`,
		);

		for (const [key, value] of Object.entries(body)) {
			if (key === "taskId") continue;
			if (key === "files" && Array.isArray(value)) {
				for (const file of value) {
					request.attach(TASK_FILES_NAME, file);
				}
				continue;
			}

			if (value) {
				request.field(key, value);
			}
		}

		if (cookies) {
			request.set("Cookie", cookies);
		}

		const response = await request;

		return response;
	}

	async deleteTask(body: { taskId?: number | string }, cookies?: string[]) {
		const request = this.superTest
			.delete(`/api/v1/tasks${body.taskId ? `/${body.taskId}` : ""}`)
			.set("Content-Type", "application/json");

		if (cookies) {
			request.set("Cookie", cookies);
		}

		const response = await request;

		return response;
	}

	async deleteTaskFile(
		body: {
			taskId?: number | string;
			fileId?: string | number;
		},
		cookies?: string[],
	) {
		const request = this.superTest
			.delete(
				`/api/v1/tasks${body.taskId ? `/${body.taskId}` : ""}/files/${encodeURIComponent(body.fileId)}`,
			)
			.set("Content-Type", "application/json");

		if (cookies) {
			request.set("Cookie", cookies);
		}

		const response = await request;

		return response;
	}

	async getCategories(cookies: string[]) {
		const request = this.superTest.get("/api/v1/categories");

		if (cookies) {
			request.set("Cookie", cookies);
		}

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
