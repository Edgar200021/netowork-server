import type { ChatReturn } from "../../types/chat.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     ChatResponseDto:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "123e4567-e89b-12d3-a456-426655440000"
 *         lastMessage:
 *           type: string
 *           example: "Hey, are you available?"
 *           nullable: true
 *         isSupportChat:
 *           type: boolean
 *         user:
 *           type: object
 *           properties:
 *             avatar:
 *               type: string
 *               format: uri
 *               nullable: true
 *               example: "https://example.com/avatar.jpg"
 *             firstName:
 *               type: string
 *               example: "John"
 *             lastName:
 *               type: string
 *               example: "Doe"
 *           required:
 *             - avatar
 *             - firstName
 *             - lastName
 *       required:
 *         - id
 *         - lastMessage
 *         - isSupportChat
 *         - user
 */
export class ChatResponseDto {
	readonly id: string;
	readonly lastMessage: ChatReturn["lastMessage"];
	readonly isSupportChat: ChatReturn["isSupportChat"];
	readonly user: ChatReturn["user"];

	constructor(chat: ChatReturn) {
		this.id = chat.id;
		this.lastMessage = chat.lastMessage;
		this.isSupportChat = chat.isSupportChat;
		this.user = chat.user;
	}
}
