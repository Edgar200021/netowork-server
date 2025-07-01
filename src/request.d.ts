import type { LoggerService } from "./common/services/logger.service.ts";
import type { User } from "./storage/postgres/types/user.types.ts";
import type { IncomingMessage } from "node: http";

declare module "http" {
  interface IncomingMessage {
    user?: User;
    logger: LoggerService;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
      logger: LoggerService;
    }
  }
}
