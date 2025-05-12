export abstract class HashingService {
	abstract hash(password: string): Promise<string>;
	abstract verify(password: string, hash: string): Promise<boolean>;
}
