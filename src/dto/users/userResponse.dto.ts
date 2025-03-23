import type { UserRole } from "../../storage/db.js";
import type { User } from "../../storage/postgres/types/user.types.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     UserResponseDto:
 *       type: object
 *       properties:
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum:
 *             - client
 *             - freelancer
 *             - admin
 *         aboutMe:
 *           type: string
 *           default: null
 *           nullable: true
 *         avatar:
 *           type: string
 *           default: null
 *           nullable: true
 */

export class UserResponseDto {
	readonly id: number;
	readonly firstName: string;
	readonly lastName: string;
	readonly email: string;
	readonly role: UserRole;
	readonly createdAt: Date;
	readonly aboutMe: string | null;
	readonly avatar: string | null;

	constructor(user: User) {
		this.firstName = user.firstName;
		this.lastName = user.lastName;
		this.email = user.email;
		this.role = user.role;
		this.aboutMe = user.aboutMe;
		this.avatar = user.avatar;
		this.createdAt = user.createdAt;
		this.id = user.id;
	}
}
