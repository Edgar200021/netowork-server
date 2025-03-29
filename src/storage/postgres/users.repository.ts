//import type { Kysely, ReferenceExpression } from "kysely";
//import type { DB } from "../db.js";
//import type { NewUser, User, UserUpdate } from "./types/user.types.js";

//export class UsersRepository {
//	constructor(private readonly _db: Kysely<DB>) {}

//	async getAll(): Promise<User[]> {
//		const users = await this._db.selectFrom("users").selectAll().execute();

//		return users;
//	}

//	async getByKey<T extends keyof User = "id">(
//		key: T,
//		value: User[T],
//	): Promise<User | undefined> {
//		const user = await this._db
//			.selectFrom("users")
//			.selectAll()
//			.where(key as ReferenceExpression<DB, "users">, "=", value)
//			.executeTakeFirst();

//		return user;
//	}

//	async create(user: NewUser): Promise<User["id"]> {
//		const { id } = await this._db
//			.insertInto("users")
//			.values(user)
//			.returning("id")
//			.executeTakeFirstOrThrow();

//		return id;
//	}

//	async update<T extends keyof Pick<User, "id" | "email">>(
//		key: T,
//		value: User[T],
//		userUpdate: UserUpdate,
//	): Promise<void> {
//		await this._db
//			.updateTable("users")
//			.set(userUpdate)
//			.where(key as ReferenceExpression<DB, "users">, "=", value)
//			.execute();
//	}

//	async updateAndReturn<T extends keyof Pick<User, "id" | "email">>(
//		key: T,
//		value: User[T],
//		userUpdate: UserUpdate,
//	): Promise<User | undefined> {
//		const user = await this._db
//			.updateTable("users")
//			.set(userUpdate)
//			.where(key as ReferenceExpression<DB, "users">, "=", value)
//			.returningAll()
//			.executeTakeFirst();

//		return user;
//	}
//}
