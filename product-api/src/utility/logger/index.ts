import pino from "pino";
import pinoHttpPkg from "pino-http"; // may be CJS or ESM default
import { randomUUID } from "crypto";

const pinoHttp = (pinoHttpPkg as any).default ?? (pinoHttpPkg as any); // <- compat

export const logger = pino({ level: process.env.LOG_LEVEL || "info" });

export const httpLogger = pinoHttp({
  logger,
  genReqId: () => randomUUID(),
});
