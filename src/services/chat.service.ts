import path from "node:path";
import { sql } from "kysely";
import { BadRequestError, NotFoundError } from "../common/error.js";
import type { LoggerService } from "../common/services/logger.service.js";
import { MESSAGE_FILE_URL_ID_DELIMITER } from "../const/chat.js";
import { MAX_WORKS_COUNT } from "../const/works.js";
import type { CreateChatRequestDto } from "../dto/chat/createChat/createChatRequest.dto.js";
import type { CreateWorkRequestDto } from "../dto/works/createWork/createWorkRequest.dto.js";
import type { DeleteWorkRequestParamsDto } from "../dto/works/deleteWork/deleteWorkRequest.dto.js";
import { WorkResponseDto } from "../dto/works/workResponse.dto.js";
import type { Database } from "../storage/postgres/database.js";
import type { Chat } from "../storage/postgres/types/chat.type.js";
import type { User } from "../storage/postgres/types/user.types.js";
import type { FileUploadResponse } from "../types/cloudinary.js";
import { AllowedMimeTypes } from "../types/mimeTypes.js";
import { uploadFiles } from "../utils/uploadFiles.js";
import type { FileUploader } from "./fileUploader.service.js";

export class ChatService {
	constructor(
		private readonly _database: Database,
		private readonly _fileUploader: FileUploader,
	) {}

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
}
