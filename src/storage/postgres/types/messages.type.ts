import type { Insertable, Selectable } from "kysely";
import type { Messages as Msg } from "../../db.js";

export type Message = Selectable<Msg>;
export type NewMessage = Insertable<Msg>;
export type MessageUpdate = Partial<Insertable<Msg>>;
