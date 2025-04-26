import path from 'node:path';

export const AVATAR_FILE_NAME = "avatar";
export const WORK_IMAGES_FILE_NAME = "images";

export const FILES_MAX_SIZE = 10 * 1024 * 1024;

export const WORK_IMAGES_MAX_COUNT = 5

export const INVALID_FILENAME_ERROR_CODE = "LIMIT_UNEXPECTED_FILE";
export const UPLOAD_FOLDER = path.join(import.meta.dirname, "../uploads");
