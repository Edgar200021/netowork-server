export const isErrnoException = (
	err: unknown,
): err is NodeJS.ErrnoException => {
	const error = err as NodeJS.ErrnoException;

	return (
		(typeof error.errno === "number" || typeof error.errno === "undefined") &&
		(typeof error.code === "string" || typeof error.code === "undefined") &&
		(typeof error.path === "string" || typeof error.path === "undefined") &&
		(typeof error.syscall === "string" || typeof error.syscall === "undefined")
	);
};
