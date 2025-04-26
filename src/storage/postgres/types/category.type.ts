import type { Insertable, Selectable } from "kysely";
import type { Category as Ct } from "../../db.js";

export type Category = Selectable<Ct>;
export type NewCategory = Insertable<Ct>;
export type CategoryUpdate = Partial<Insertable<Ct>>;
