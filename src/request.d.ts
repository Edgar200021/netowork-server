import type { LoggerService } from "./services/common/services/logger.service.ts";
import type { User } from "./storage/postgres/types/user.types.ts";

declare global {
	namespace Express {
		interface Request {
			user?: User;
			logger: LoggerService;
		}
	}
}
