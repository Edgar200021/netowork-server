import { sql } from "kysely";
import type { AnyColumnWithTable } from "kysely";
import type { JoinReferenceExpression } from "kysely";
import { BadRequestError, NotFoundError } from "../common/error.js";
import type { LoggerService } from "../common/services/logger.service.js";
import {
	GET_CHATS_DEFAULT_LIMIT,
	GET_CHATS_DEFAULT_PAGE,
} from "../const/chat.js";
import type { CreateChatRequestDto } from "../dto/chat/createChat/createChatRequest.dto.js";
import type { DeleteChatRequestParamsDto } from "../dto/chat/deleteChat/deleteChatRequest.dto.js";
import type { GetChatMessagesRequestParamsDto } from "../dto/chat/getChatMessages/getChatMessagesRequest.dto.js";
import type { GetChatsRequestQueryDto } from "../dto/chat/getChats/getChatsRequest.dto.js";
import { type DB, UserRole } from "../storage/db.js";
import type { Database } from "../storage/postgres/database.js";
import type { Chat } from "../storage/postgres/types/chat.type.js";
import type { Message } from "../storage/postgres/types/messages.type.js";
import type { User } from "../storage/postgres/types/user.types.js";
import type { ChatReturn } from "../types/chat.js";
import type { FileUploader } from "./fileUploader.service.js";

export class ChatService {
	constructor(
		private readonly _database: Database,
		private readonly _fileUploader: FileUploader,
	) {}

	async getChats(
		user: Pick<User, "id" | "role">,
		getChatsRequestQueryDto: GetChatsRequestQueryDto,
		log: LoggerService,
	): Promise<{
		chats: ChatReturn[];
		totalCount: number;
	}> {
		log.info({ userId: user.id }, "Get chats");

		const limit =
			Number(getChatsRequestQueryDto.limit) || GET_CHATS_DEFAULT_LIMIT;
		const page = Number(getChatsRequestQueryDto.page) || GET_CHATS_DEFAULT_PAGE;

		const chats = await this._database
			.selectFrom("chat")
			.innerJoin(
				"users",
				"users.id",
				//@ts-ignore
				sql`CASE WHEN chat.creator_id = ${user.id} THEN chat.recipient_id ELSE chat.creator_id END`,
			)
			.select([
				"chat.id",
				"users.avatar",
				"users.firstName",
				"users.lastName",
				"users.role",
			])
			.select(
				sql<string>`(SELECT message FROM messages WHERE messages.chat_id = chat.id ORDER BY created_at DESC LIMIT 1)`.as(
					"lastMessage",
				),
			)
			.select(sql<number>`COUNT(*) OVER()::INTEGER`.as("totalCount"))
			.where(({ eb, and, or, not }) =>
				or([eb("creatorId", "=", user.id), eb("recipientId", "=", user.id)]),
			)
			.orderBy("chat.createdAt", "asc")
			.limit(limit)
			.offset(page * limit - limit)
			.execute();

		return {
			chats: chats.map(
				({ avatar, firstName, lastMessage, lastName, role, id }) => ({
					id,
					lastMessage,
					isSupportChat: role === UserRole.Admin,
					user: {
						firstName,
						lastName,
						avatar,
					},
				}),
			),
			totalCount: chats[0]?.totalCount || 0,
		};
	}

	async createChat(
		userId: User["id"],
		payload: CreateChatRequestDto,
		log: LoggerService,
	): Promise<Chat["id"]> {
		log.info({ userId }, "Creating chat");

		const chat = await this._database
			.selectFrom("chat")
			.select("id")
			.where("creatorId", "=", userId)
			.where("recipientId", "=", payload.recipientId)
			.executeTakeFirst();

		if (chat) return chat.id;

		const recipient = await this._database
			.selectFrom("users")
			.select("id")
			.where("id", "=", payload.recipientId)
			.executeTakeFirst();

		if (!recipient) {
			log.warn("Recipient not found");
			throw new NotFoundError("Recipient not found");
		}

		// const fileUploadResonse = files
		// 	? await uploadFiles(this._fileUploader, files, log)
		// 	: [];

		// const transormedFiles = fileUploadResonse.map(
		// 	(res) => `${res.fileId}${MESSAGE_FILE_URL_ID_DELIMITER}${res.fileUrl}`,
		// );

		const newChat = await this._database
			.insertInto("chat")
			.values({
				creatorId: userId,
				recipientId: recipient.id,
				createdAt: sql`now()`,
				updatedAt: sql`now()`,
			})
			.returning("id")
			.executeTakeFirstOrThrow();

		return newChat.id;
	}

	async deleteChat(
		userId: User["id"],
		payload: DeleteChatRequestParamsDto,
		log: LoggerService,
	) {
		log.info({ userId }, "Deleting chat");

		const chat = await this._database
			.deleteFrom("chat")
			.where("id", "=", payload.chatId)
			.where("creatorId", "=", userId)
			.returning("id")
			.executeTakeFirst();

		if (!chat) {
			log.warn({ chatId: payload.chatId }, "Chat not found");
			throw new NotFoundError("Chat not found");
		}

		return;
	}

	async getChatMessages(
		userId: User["id"],
		getChatMessagesRequestDto: GetChatMessagesRequestParamsDto,
		log: LoggerService,
	): Promise<{
		messages: Message[];
		totalCount: number;
	}> {
		log.info({ userId }, "Get chat messages");

		const chat = await this._database
			.selectFrom("chat")
			.select(["recipientId", "creatorId"])
			.where("chat.id", "=", getChatMessagesRequestDto.chatId)
			.executeTakeFirst();

		if (!chat) {
			log.warn({ chatId: getChatMessagesRequestDto.chatId }, "Chat not found");
			throw new NotFoundError("Chat not found");
		}

		const isParticipant =
			userId === chat.creatorId || userId === chat.recipientId;

		if (!isParticipant) {
			log.warn(
				{ chatId: getChatMessagesRequestDto.chatId, userId },
				"Access denied: user is not a participant of this chat",
			);
			throw new BadRequestError(
				"You do not have permission to access this chat",
			);
		}

		const messages = await this._database
			.selectFrom("messages")
			.selectAll()
			.select(sql<number>`COUNT(*) OVER()::INTEGER`.as("totalCount"))
			.where("chatId", "=", getChatMessagesRequestDto.chatId)
			.execute();

		return {
			messages,
			totalCount: messages[0]?.totalCount || 0,
		};
	}
}
