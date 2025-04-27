import type { LoggerService } from "./common/services/logger.service.ts";
import type { User } from "./storage/postgres/types/user.types.ts";

declare global {
	namespace Express {
		interface Request {
			user?: User;
			logger: LoggerService;
		}
	}
}
