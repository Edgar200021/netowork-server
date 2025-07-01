import type { Server as HttpServer } from "node:http";
import cookieParser from "cookie-parser";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { Server } from "socket.io";
import type { ApplicationConfig } from "../config.js";
import type { Middlewares } from "../middlewares/middlewares.js";
import type { Services } from "../services/services.js";

export class Socket {
	private readonly sockets = new Map();

	constructor(
		httpServer: HttpServer,
		services: Services,
		middlewares: Middlewares,
		config: ApplicationConfig,
	) {
		const io = new Server(httpServer, {
			cors: {
				origin: config.clientUrl,
				credentials: true,
				methods: ["GET", "POST"],
				allowedHeaders: ["Content-Type", "Authorization", "Origin", "Cookie"],
			},
		});

		io.engine.use(helmet());
		io.engine.use(cookieParser(config.cookieSecret));
		io.engine.use(middlewares.requestLogger);
		io.engine.use(middlewares.auth);

		io.of("/chat").on("connection", (socket) => {
			const { logger, user } = socket.request;
			if (!user) return;

			this.sockets.set(user.id, socket.id);
			console.log(this.sockets);
			console.log("CONNECTED");

			socket.on("disconnect", () => {
				console.log(socket.id, "DISCONNECTED");
				this.sockets.delete(user.id);
			});
		});
	}
}
