import type { Chat } from "../storage/postgres/types/chat.type.js";
import type { Message } from "../storage/postgres/types/messages.type.js";
import type { User } from "../storage/postgres/types/user.types.js";

export type ChatReturn = Pick<Chat, "id"> & {
	lastMessage: Message["message"] | null;
	isSupportChat: boolean;
	user: Pick<User, "avatar" | "firstName" | "lastName">;
};
