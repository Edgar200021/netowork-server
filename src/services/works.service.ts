import { BadRequestError } from "../common/error.js";
import type { LoggerService } from "../common/services/logger.service.js";
import type { CreateWorkRequestDto } from "../dto/works/createWork/createWorkRequest.dto.js";
import { WorkResponseDto } from "../dto/works/workResponse.dto.js";
import type { User } from "../storage/postgres/types/user.types.js";
import type { WorksRepository } from "../storage/postgres/works.repository.js";
import type { ImageUploader } from "./imageUploader.service.js";

export class WorksService {
	constructor(
		private readonly _worksRepository: WorksRepository,
		private readonly _imageUploader: ImageUploader,
	) {}

	async createWork(
		userId: User["id"],
		payload: CreateWorkRequestDto,
		files: Express.Multer.File[],
		log: LoggerService,
	): Promise<WorkResponseDto> {
		log.info({ userId }, "Creating work");

		const existingWork = await this._worksRepository.getByUserId(
			userId,
			"title",
			payload.title,
		);
		if (existingWork) {
			log.warn({ title: payload.title }, "Work already exists");
			throw new BadRequestError("Work already exists");
		}

		const images = await Promise.all(
			files.map((f) => this._imageUploader.uploadImageFromBuffer(f.buffer)),
		);

		const work = await this._worksRepository.create(
			{
				userId,
				title: payload.title,
			},
			images,
		);

		return new WorkResponseDto(work);
	}
}
