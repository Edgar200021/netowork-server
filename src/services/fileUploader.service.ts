import { randomUUID } from "node:crypto";
import { stat, unlink } from "node:fs/promises";
import { type UploadApiOptions, v2 as cloudinary } from "cloudinary";
import { InternalServerError } from "../common/error.js";
import type { LoggerService } from "../common/services/logger.service.js";
import type { CloudinaryConfig } from "../config.js";
import { CLOUDINARY_UPLOAD_FOLDER } from "../const/cloudinary.js";
import type { FileUploadResponse } from "../types/cloudinary.js";
import { isErrnoException } from "../utils/guards.js";

export class FileUploader {
	static readonly CLOUDINARY_BASE_OPTIONS: UploadApiOptions = {
		folder: CLOUDINARY_UPLOAD_FOLDER,
		use_filename: true,
	};

	constructor(cloudinaryConfig: CloudinaryConfig) {
		cloudinary.config({
			cloud_name: cloudinaryConfig.cloudName,
			api_key: cloudinaryConfig.apiKey,
			api_secret: cloudinaryConfig.apiSecret,
		});
	}

	async uploadFileFromBuffer(
		file: Buffer,
		log: LoggerService,
		options?: UploadApiOptions,
	): Promise<FileUploadResponse> {
		return new Promise((res, rej) => {
			const public_id = randomUUID().toString();
			cloudinary.uploader
				.upload_stream(
					{
						...FileUploader.CLOUDINARY_BASE_OPTIONS,
						...options,
						public_id,
					},
					(err, result) => {
						if (err || !result) {
							log.error({ err }, "Something went wrong with file upload");

							return rej(
								new InternalServerError(
									"Something went wrong with file upload",
								),
							);
						}

						return res({
							fileUrl: result.secure_url,
							fileId: result.public_id,
							fileName: result.original_filename,
						});
					},
				)
				.end(file);
		});
	}

	async uploadFileFromFilePath(
		filePath: string,
		log: LoggerService,
		options?: UploadApiOptions,
	): Promise<FileUploadResponse> {
		try {
			await stat(filePath);

			const id = randomUUID().toString();

			const { secure_url, public_id, original_filename } =
				await cloudinary.uploader.upload(filePath, {
					...FileUploader.CLOUDINARY_BASE_OPTIONS,
					...options,
					public_id: id,
				});

			await unlink(filePath);

			return {
				fileUrl: secure_url,
				fileId: public_id,
				fileName: original_filename,
			};
		} catch (err) {
			log.error({ err }, "Something went wrong with file upload");

			if (isErrnoException(err) && err.code === "ENOENT") {
				log.error({ filePath }, "File not found");
			}

			throw new InternalServerError("Something went wrong with file upload");
		}
	}

	async deleteFile(fileId: FileUploadResponse["fileId"]) {
		await cloudinary.uploader.destroy(fileId);
	}
}
