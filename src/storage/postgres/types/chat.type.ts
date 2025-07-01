import type { Insertable, Selectable } from "kysely";
import type { Chat as Ch } from "../../db.js";

export type Chat = Selectable<Ch>;
export type NewChat = Insertable<Ch>;
export type ChatUpdate = Partial<Insertable<Ch>>;
