import path from 'node:path';

export const AVATAR_FILE_NAME = "avatar";
export const FILES_MAX_SIZE = 5 * 1024 * 1024;

export const INVALID_FILENAME_ERROR_CODE = "LIMIT_UNEXPECTED_FILE";
export const UPLOAD_FOLDER = path.join(import.meta.dirname, "../uploads");