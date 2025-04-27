export const AllowedMimeTypes = {
	"image/jpeg": "image/jpeg",
	"image/png": "image/png",
	"image/jpg": "image/jpg",
	"image/gif": "image/gif",
	"image/webp": "image/webp",
	"image/bmp": "image/bmp",
	"image/tiff": "image/tiff",
	"image/avif": "image/avif",
	"image/svg+xml": "image/svg+xml",
	"image/ico": "image/ico",
	"application/pdf": "application/pdf",
	"application/msword": "application/msword",
	"video/mp4": "video/mp4",
	"video/mpeg": "video/mpeg",
	"video/ogg": "video/ogg",
	"video/webm": "video/webm",
	"audio/webm": "audio/webm",
	"audio/mpeg": "audio/mpeg",
	"audio/ogg": "audio/ogg",
	"text/plain": "text/plain",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document":
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} as const;

export type AllowedMimeTypesKeys = keyof typeof AllowedMimeTypes;

export type AllowedMimeTypesValues =
	(typeof AllowedMimeTypes)[AllowedMimeTypesKeys];
