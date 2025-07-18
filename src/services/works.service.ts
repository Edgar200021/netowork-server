import { sql } from "kysely";
import { BadRequestError, NotFoundError } from "../common/error.js";
import type { LoggerService } from "../common/services/logger.service.js";
import { MAX_WORKS_COUNT } from "../const/works.js";
import type { CreateWorkRequestDto } from "../dto/works/createWork/createWorkRequest.dto.js";
import type { DeleteWorkRequestParamsDto } from "../dto/works/deleteWork/deleteWorkRequest.dto.js";
import { WorkResponseDto } from "../dto/works/workResponse.dto.js";
import type { Database } from "../storage/postgres/database.js";
import type { User } from "../storage/postgres/types/user.types.js";
import type { FileUploader } from "./fileUploader.service.js";

export class WorksService {
	constructor(
		private readonly _database: Database,
		private readonly _imageUploader: FileUploader,
	) {}

	async createWork(
		userId: User["id"],
		payload: CreateWorkRequestDto,
		files: Express.Multer.File[],
		log: LoggerService,
	): Promise<WorkResponseDto> {
		log.info({ userId }, "Creating work");

		const {
			rows: [row],
		} = await sql<{
			count: number;
		}>`SELECT COUNT(*)::INT FROM WORKS WHERE works.user_id = ${userId}`.execute(
			this._database,
		);

		if (row.count >= MAX_WORKS_COUNT) {
			log.warn({ userId }, "Max works count reached");
			throw new BadRequestError("Max works count reached");
		}

		const existingWork = await this._database
			.selectFrom("works")
			.select(["id"])
			.where("title", "=", payload.title)
			.where("userId", "=", userId)
			.executeTakeFirst();

		if (existingWork) {
			log.warn({ title: payload.title }, "Work already exists");
			throw new BadRequestError(
				`Work with title "${payload.title}" already exists`,
			);
		}

		const images = await Promise.all(
			files.map((f) => this._imageUploader.uploadFileFromBuffer(f.buffer, log)),
		);

		const work = await this._database.transaction().execute(async (trx) => {
			const result = await trx
				.insertInto("works")
				.values({
					userId,
					title: payload.title,
					createdAt: sql`NOW()`,
					updatedAt: sql`NOW()`,
				})
				.returningAll()
				.executeTakeFirstOrThrow();

			await trx
				.insertInto("workImages")
				.values(
					images.map((w) => ({
						imageId: w.fileId,
						imageUrl: w.fileUrl,
						workId: result.id,
					})),
				)
				.execute();

			return { ...result, images: images.map((w) => w.fileUrl) };
		});

		return new WorkResponseDto(work);
	}

	async getWorks(
		userId: User["id"],
		log: LoggerService,
	): Promise<WorkResponseDto[]> {
		log.info({ userId }, "Getting works");

		const works = await this._database
			.selectFrom("works")
			.leftJoin("workImages as wi", "wi.workId", "works.id")
			.select([
				"works.id",
				"works.title",
				"works.createdAt",
				"works.updatedAt",
				"works.userId",
			])
			.select((eb) =>
				eb.fn.agg<string[]>("array_agg", ["wi.imageUrl"]).as("images"),
			)
			.groupBy("works.id")
			.where("userId", "=", userId)
			.execute();

		return works.map((w) => new WorkResponseDto(w));
	}

	async deleteWork(
		userId: User["id"],
		payload: DeleteWorkRequestParamsDto,
		log: LoggerService,
	) {
		log.info({ userId }, "Deleting work");

		const work = await this._database
			.deleteFrom("works")
			.returning(
				sql<
					string[]
				>`array(SELECT image_id FROM work_images WHERE work_id = ${payload.id})`.as(
					"images",
				),
			)
			.where("works.userId", "=", userId)
			.where("works.id", "=", payload.id)
			.executeTakeFirst();

		if (!work) {
			log.warn({ id: payload.id }, "Work not found");
			throw new NotFoundError("Work not found");
		}

		await Promise.all(
			work.images.map((i) => this._imageUploader.deleteFile(i)),
		);
	}
}
