import type { VineValidator } from "@vinejs/vine";
import vine from "@vinejs/vine";
import type { SchemaTypes } from "@vinejs/vine/types";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../common/error.js";
import { CategoryResponseDto } from "../dto/categories/categoryResponse.dto.js";
import type { GetAllCategoriesResponseDto } from "../dto/categories/getAllCategories/getAllCategoriesResponse.dto.js";
import {
	type CreateChatRequestDto,
	createChatRequestSchema,
} from "../dto/chat/createChat/createChatRequest.dto.js";
import type { CreateChatResponseDto } from "../dto/chat/createChat/createChatResponse.dto.js";
import type { Middlewares } from "../middlewares/middlewares.js";
import type { CategoryService } from "../services/category.service.js";
import type { ChatService } from "../services/chat.service.js";
import { UserRole } from "../storage/db.js";
import { asyncWrapper } from "../utils/handlerAsyncWrapper.js";
import { BaseHandler } from "./base.handler.js";

export class ChatHandler extends BaseHandler {
	protected validators = {
		createChat: vine.compile(createChatRequestSchema),
	};
	constructor(
		private readonly _middlewares: Middlewares,
		private readonly _chatService: ChatService,
	) {
		super();
		this.bindMethods();
		this.setupRoutes();
	}

	/**
	 * @openapi
	 * /api/v1/chats:
	 *   get:
	 *     tags:
	 *       - Chat
	 *     summary: Get Chats
	 *     security:
	 *       - Session: []
	 *     description: Get Chats
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/CreateChatRequestDto'
	 *     responses:
	 *       201:
	 *         description: Success
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/CreateChatResponseDto'
	 *       401:
	 *         description: Unauthorized
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 status:
	 *                   type: string
	 *                 error:
	 *                   type: string
	 *       403:
	 *         description: Forbidden (User does not have permission)
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponseDto'
	 *             examples:
	 *               NoPermission:
	 *                 summary: User lacks permission to access this resource
	 *                 value:
	 *                   status: "error"
	 *                   message: "You do not have permission to access this resource."
	 */
	async getChats(
		req: Request<unknown, CreateChatResponseDto, CreateChatRequestDto>,
		res: Response<CreateChatResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		const id = await this._chatService.createChat(
			req.user.id,
			req.body,
			req.logger,
		);

		res.status(200).json({
			status: "success",
			data: id,
		});
	}

	/**
	 * @openapi
	 * /api/v1/chats:
	 *   post:
	 *     tags:
	 *       - Chat
	 *     summary: Create Chat
	 *     security:
	 *       - Session: []
	 *     description: Create Chat
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/CreateChatRequestDto'
	 *     responses:
	 *       200:
	 *         description: Success
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/CreateChatResponseDto'
	 *       401:
	 *         description: Unauthorized
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 status:
	 *                   type: string
	 *                 error:
	 *                   type: string
	 *       403:
	 *         description: Forbidden (User does not have permission)
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponseDto'
	 *             examples:
	 *               NoPermission:
	 *                 summary: User lacks permission to access this resource
	 *                 value:
	 *                   status: "error"
	 *                   message: "You do not have permission to access this resource."
	 */
	async createChat(
		req: Request<unknown, CreateChatResponseDto, CreateChatRequestDto>,
		res: Response<CreateChatResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		const id = await this._chatService.createChat(
			req.user.id,
			req.body,
			req.logger,
		);

		res.status(201).json({
			status: "success",
			data: id,
		});
	}

	protected bindMethods(): void {
		this.createChat = this.createChat.bind(this);
	}

	protected setupRoutes() {
		this.router.post(
			"/",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Client, UserRole.Admin]),
			this._middlewares.validateRequest([
				{ type: "body", validatorOrSchema: this.validators.createChat },
			]),
			asyncWrapper(this.createChat),
		);
	}
}
