import type { Insertable, Selectable, Updateable } from "kysely";
import type { WorkImages, Works } from "../../db.js";

export type Work = Selectable<Works>;
export type NewWork = Insertable<Works>;
export type WorkUpdate = Updateable<Works>;

export type WorkImage = Selectable<WorkImages>;
export type NewWorkImage = Insertable<WorkImages>;
export type WorkImageUpdate = Updateable<WorkImages>;
