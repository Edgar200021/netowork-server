import { type UploadApiOptions, v2 as cloudinary } from "cloudinary";
import { stat, unlink } from "node:fs/promises";
import { InternalServerError } from "../common/error.js";
import type { LoggerService } from "../common/services/logger.service.js";
import type { CloudinaryConfig } from "../config.js";
import { CLOUDINARY_UPLOAD_FOLDER } from "../const/cloudinary.js";
import type { FileUploadResponse } from "../types/cloudinary.js";
import { isErrnoException } from "../utils/guards.js";

export class ImageUploader {
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

	async uploadImageFromBuffer(image: Buffer): Promise<FileUploadResponse> {
		return new Promise((res, rej) => {
			cloudinary.uploader
				.upload_stream(ImageUploader.CLOUDINARY_BASE_OPTIONS, (err, result) => {
					if (err || !result) {
						return err
							? rej(err)
							: rej("Something went wrong with file upload");
					}

					return res({
						imageUrl: result.secure_url,
						imageId: result.public_id,
					});
				})
				.end(image);
		});
	}

	async uploadImageFromFilePath(
		imagePath: string,
		log: LoggerService,
	): Promise<FileUploadResponse> {
		try {
			await stat(imagePath);

			const { secure_url, public_id } = await cloudinary.uploader.upload(
				imagePath,
				ImageUploader.CLOUDINARY_BASE_OPTIONS,
			);

			await unlink(imagePath);

			return { imageUrl: secure_url, imageId: public_id };
		} catch (error) {
			if (isErrnoException(error) && error.code === "ENOENT") {
				log.error({ imagePath }, "File not found");
				throw new InternalServerError("Something went wrong with file upload");
			}

			throw error;
		}
	}

	async deleteImage(imageId: FileUploadResponse["imageId"]) {
		await cloudinary.uploader.destroy(imageId);
	}
}
