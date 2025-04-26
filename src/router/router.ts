import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import type { ApplicationConfig } from "../config.js";
import { AuthHandler } from "../handlers/auth.handler.js";
import { CategoryHandler } from "../handlers/category.handler.js";
import { UsersHandler } from "../handlers/users.handler.js";
import { WorksHandler } from "../handlers/works.handler.js";
import type { Middlewares } from "../middlewares/middlewares.js";
import type { Services } from "../services/services.js";

export class Router {
	constructor(
		app: Express,
		services: Services,
		middlewares: Middlewares,
		config: ApplicationConfig,
	) {
		app.use([
			helmet(),
			express.json({
				limit: "10mb",
			}),
			express.urlencoded({ extended: true, limit: "10mb" }),
			cookieParser(config.cookieSecret),
			cors({
				credentials: true,
				origin: config.clientUrl,
				methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
				allowedHeaders: ["Content-Type", "Authorization", "Origin", "Cookie"],
			}),
			middlewares.requestLogger,
		]);

		app.use(
			"/api/v1/auth",
			new AuthHandler(services.authService, middlewares).router,
		);
		app.use(
			"/api/v1/users",
			new UsersHandler(middlewares, services.usersService).router,
		);
		app.use(
			"/api/v1/works",
			new WorksHandler(middlewares, services.worksService).router,
		);
		app.use(
			"/api/v1/categories",
			new CategoryHandler(middlewares, services.categoryService).router,
		);

		app.use("*", (req, res) => {
			res.status(404).json({
				status: "error",
				error: "Route not found",
			});
		});

		app.use(middlewares.handleErrors);
	}
}
