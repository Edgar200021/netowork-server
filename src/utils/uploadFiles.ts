import path from "node:path";
import type { LoggerService } from "../common/services/logger.service.js";
import type { FileUploader } from "../services/fileUploader.service.js";
import type { FileUploadResponse } from "../types/cloudinary.js";
import { AllowedMimeTypes } from "../types/mimeTypes.js";

export const uploadFiles = async (
	fileUploader: FileUploader,
	files: Express.Multer.File[] | undefined,
	log: LoggerService,
): Promise<FileUploadResponse[]> => {
	if (files) {
		const result = await Promise.all(
			files.map(async (file) => {
				const res = await fileUploader.uploadFileFromBuffer(file.buffer, log, {
					format: path.extname(file.originalname).slice(1),
					...(file.mimetype ===
						AllowedMimeTypes[
							"application/vnd.openxmlformats-officedocument.wordprocessingml.document"
						] || file.mimetype === AllowedMimeTypes["text/plain"]
						? {
								resource_type: "raw",
							}
						: {}),
					filename_override: file.originalname,
				});

				return res;
			}),
		);

		return result.reduce((acc, val) => {
			acc.push(val);
			return acc;
		}, [] as FileUploadResponse[]);
	}

	return [];
};
