import type { Work } from "../../storage/postgres/types/userWorks.types.js";

/**
 * @openapi
 * components:
 *   schemas:
 *     WorkResponseDto:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         title:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 */
export class WorkResponseDto {
	readonly id: number;
	readonly title: string;
	readonly images: string[];

	constructor(work: Work & { images: string[] }) {
		this.id = work.id;
		this.title = work.title;
		this.images = work.images;
	}
}
