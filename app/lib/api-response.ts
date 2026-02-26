import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./errors";
import { ApiContract } from "./types/api";

export class ResponseUtil {
  static success<T>(data: T, message?: string, status = 200) {
    const response: ApiContract<T> = {
      success: true,
      data,
    };
    if (message) response.message = message;
    
    return NextResponse.json(response, { status });
  }

  static error(error: any, defaultMessage = "An unexpected error occurred", status = 500) {
    let statusCode = status;
    const response: ApiContract = {
      success: false,
      error: defaultMessage,
    };

    if (error instanceof AppError) {
      statusCode = error.statusCode;
      response.error = error.message;
      if (error.details) {
        response.details = error.details;
      }
    } else if (error instanceof ZodError) {
      statusCode = 400;
      response.error = "Validation Error";
      response.details = error.issues;
    } else if (error instanceof Error) {
      // In production, we might want to hide internal error messages
      response.error = error.message || defaultMessage;
    }

    return NextResponse.json(response, { status: statusCode });
  }

  static unauthorized(message = "Unauthorized access") {
    return this.error(new AppError(message, 401));
  }
}
