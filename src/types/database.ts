export type DatabaseError = {
	length: number;
	severity: string;
	code: string;
	detail: string;
	schema: string;
	table: string;
	constraint: string;
};

export const isDatabaseError = (err: unknown): err is DatabaseError => {
	return (
		(err as DatabaseError).code !== undefined &&
		(err as DatabaseError).detail !== undefined
	);
};
