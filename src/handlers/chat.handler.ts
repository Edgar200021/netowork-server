import vine from "@vinejs/vine";
import type { Request, Response } from "express";
import { UnauthorizedError } from "../common/error.js";
import {
	type CreateChatRequestDto,
	createChatRequestSchema,
} from "../dto/chat/createChat/createChatRequest.dto.js";
import type { CreateChatResponseDto } from "../dto/chat/createChat/createChatResponse.dto.js";
import {
	type DeleteChatRequestParamsDto,
	deleteChatRequestParamsSchema,
} from "../dto/chat/deleteChat/deleteChatRequest.dto.js";
import type { DeleteChatResponseDto } from "../dto/chat/deleteChat/deleteChatResponse.dto.js";
import {
	type GetChatMessagesRequestParamsDto,
	getChatMessagesRequestParamsSchema,
} from "../dto/chat/getChatMessages/getChatMessagesRequest.dto.js";
import type { GetChatMessagesResponseDto } from "../dto/chat/getChatMessages/getChatMessagesResponse.dto.js";
import {
	type GetChatsRequestQueryDto,
	getChatsRequestQuerySchema,
} from "../dto/chat/getChats/getChatsRequest.dto.js";
import type { GetChatsResponseDto } from "../dto/chat/getChats/getChatsResponse.dto.js";
import type { Middlewares } from "../middlewares/middlewares.js";
import type { ChatService } from "../services/chat.service.js";
import { UserRole } from "../storage/db.js";
import { asyncWrapper } from "../utils/handlerAsyncWrapper.js";
import { BaseHandler } from "./base.handler.js";

export class ChatHandler extends BaseHandler {
	protected validators = {
		getChats: vine.compile(getChatsRequestQuerySchema),
		createChat: vine.compile(createChatRequestSchema),
		deleteChat: vine.compile(deleteChatRequestParamsSchema),
		getChatMessages: vine.compile(getChatMessagesRequestParamsSchema),
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
	 * paths:
	 *   /api/v1/chats:
	 *     get:
	 *       tags:
	 *         - Chats
	 *       summary: Get all chats
	 *       security:
	 *         - Session: []
	 *       parameters:
	 *         - in: query
	 *           name: limit
	 *           required: false
	 *           description: Number of chats to return (max 100)
	 *           schema:
	 *             type: number
	 *             maximum: 100
	 *         - in: query
	 *           name: page
	 *           required: false
	 *           description: Page number
	 *           schema:
	 *             type: number
	 *       responses:
	 *         200:
	 *           description: Success
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/GetChatsResponseDto'
	 *         400:
	 *           description: Validation error
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *               examples:
	 *                 LimitTooBig:
	 *                   summary: Limit exceeds maximum allowed value
	 *                   value:
	 *                     status: "error"
	 *                     errors:
	 *                       limit: "The limit must be less than or equal to 100."
	 *         401:
	 *           description: Unauthorized (User is not logged in)
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 *         403:
	 *           description: Forbidden (User does not have permission)
	 *           content:
	 *             application/json:
	 *               schema:
	 *                 $ref: '#/components/schemas/ErrorResponseDto'
	 *               examples:
	 *                 NoPermission:
	 *                   summary: User lacks permission to access this resource
	 *                   value:
	 *                     status: "error"
	 *                     message: "You do not have permission to access this resource."
	 */
	async getChats(
		req: Request<
			unknown,
			GetChatsResponseDto,
			unknown,
			GetChatsRequestQueryDto
		>,
		res: Response<GetChatsResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		const data = await this._chatService.getChats(
			{ id: req.user.id, role: req.user.role },
			req.query,
			req.logger,
		);

		res.status(200).json({
			status: "success",
			data,
		});
	}

	/**
	 * @openapi
	 * /api/v1/chats:
	 *   post:
	 *     tags:
	 *       - Chats
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
	 *       400:
	 *         description: Validation error
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *             examples:
	 *               MissingRecipient:
	 *                 summary: Missing required recipientId
	 *                 value:
	 *                   status: "error"
	 *                   errors:
	 *                     recipientId: "The recipientId field is required"
	 *               InvalidUUID:
	 *                 summary: Invalid UUID format
	 *                 value:
	 *                   status: "error"
	 *                   errors:
	 *                     recipientId: "The recipientId field must be a valid UUID"
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

	/**
	 * @openapi
	 * /api/v1/chats/{chatId}:
	 *   post:
	 *     tags:
	 *       - Chats
	 *     summary: Delete Chat
	 *     security:
	 *       - Session: []
	 *     parameters:
	 *       - name: chatId
	 *         in: path
	 *         required: true
	 *         description: Chat ID
	 *         schema:
	 *           type: string
	 *           format: uuid
	 *     responses:
	 *       200:
	 *         description: Success
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/DeleteChatResponseDto'
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
	async deleteChat(
		req: Request<DeleteChatRequestParamsDto, DeleteChatResponseDto>,
		res: Response<DeleteChatResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		await this._chatService.deleteChat(req.user.id, req.params, req.logger);

		res.status(200).json({
			status: "success",
			data: "Chat deleted successfully",
		});
	}

	/**
	 * @openapi
	 * /api/v1/chats/{chatId}/messages:
	 *   get:
	 *     tags:
	 *       - Chats
	 *     summary: Get Chat Messages
	 *     security:
	 *       - Session: []
	 *     description: Get messages from a chat by chatId
	 *     parameters:
	 *       - in: path
	 *         name: chatId
	 *         required: true
	 *         description: Chat ID
	 *         schema:
	 *           type: string
	 *           format: uuid
	 *     responses:
	 *       200:
	 *         description: Success
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/GetChatMessagesResponseDto'
	 *       400:
	 *         description: Validation error
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ValidationErrorResponseDto'
	 *             examples:
	 *               InvalidUUID:
	 *                 summary: chatId is not a valid UUID
	 *                 value:
	 *                   status: "error"
	 *                   errors:
	 *                     chatId: "The chatId field must be a valid UUID"
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
	 *         description: Forbidden
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponseDto'
	 *             examples:
	 *               NotParticipant:
	 *                 summary: User is not allowed to view this chat
	 *                 value:
	 *                   status: "error"
	 *                   message: "You do not have permission to access this chat"
	 *       404:
	 *         description: Chat not found
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/ErrorResponseDto'
	 *             examples:
	 *               ChatNotFound:
	 *                 summary: Chat does not exist or was deleted
	 *                 value:
	 *                   status: "error"
	 *                   message: "Chat not found"
	 */

	async getChatMessages(
		req: Request<GetChatMessagesRequestParamsDto, GetChatMessagesResponseDto>,
		res: Response<GetChatMessagesResponseDto>,
	) {
		if (!req.user) throw new UnauthorizedError("Unauthorized");

		const result = await this._chatService.getChatMessages(
			req.user.id,
			req.params,
			req.logger,
		);

		res.status(200).json({
			status: "success",
			data: result,
		});
	}

	protected bindMethods(): void {
		this.getChats = this.getChats.bind(this);
		this.createChat = this.createChat.bind(this);
		this.deleteChat = this.deleteChat.bind(this);
		this.getChatMessages = this.getChatMessages.bind(this);
	}

	protected setupRoutes() {
		this.router.get(
			"/",
			this._middlewares.auth,
			this._middlewares.validateRequest([
				{ type: "query", validatorOrSchema: this.validators.getChats },
			]),
			asyncWrapper(this.getChats),
		);
		this.router.post(
			"/",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Client, UserRole.Admin]),
			this._middlewares.validateRequest([
				{ type: "body", validatorOrSchema: this.validators.createChat },
			]),
			asyncWrapper(this.createChat),
		);
		this.router.delete(
			"/:chatId",
			this._middlewares.auth,
			this._middlewares.restrict([UserRole.Client, UserRole.Admin]),
			this._middlewares.validateRequest([
				{ type: "params", validatorOrSchema: this.validators.deleteChat },
			]),
			//@ts-ignore
			asyncWrapper(this.deleteChat),
		);

		this.router.get(
			"/:chatId/messages",
			this._middlewares.auth,
			this._middlewares.validateRequest([
				{ type: "params", validatorOrSchema: this.validators.getChatMessages },
			]),
			//@ts-ignore
			asyncWrapper(this.getChatMessages),
		);
	}
}
