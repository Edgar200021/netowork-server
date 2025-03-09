import type { Insertable, Selectable, Updateable } from 'kysely'
import type { Users } from '../../db.js'

export type User = Selectable<Users>
export type NewUser = Insertable<Users>
export type UserUpdate = Updateable<Users>