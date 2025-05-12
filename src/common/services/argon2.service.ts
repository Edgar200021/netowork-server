import * as argon2 from "argon2";

export class Argon2Service {
	async hash(
		payload: string,
		options: argon2.Options = { salt: Buffer.alloc(16) },
	) {
		const hashed = await argon2.hash(payload, options);

		return hashed;
	}

	async verify(payload: string, hashedPayload: string) {
		return argon2.verify(hashedPayload, payload);
	}
}
