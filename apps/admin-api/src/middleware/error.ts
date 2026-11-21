import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      details: err.details,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      message: "Data tidak valid",
      details: err.flatten(),
    });
  }

  console.error("Unhandled API Error:", err);
  return res.status(500).json({
    code: "INTERNAL_ERROR",
    message: "Terjadi kesalahan pada server",
    ...(process.env.NODE_ENV !== "production" && err instanceof Error
      ? { details: err.message }
      : {}),
  });
}
