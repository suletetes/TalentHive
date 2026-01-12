import { Response } from 'express';

export interface StandardResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  error?: string;
  errors?: any[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
    version?: string;
  };
}

export class ResponseFormatter {
  /**
   * Send success response
   */
  static success<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200,
    pagination?: StandardResponse['pagination']
  ): Response {
    const response: StandardResponse<T> = {
      status: 'success',
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    if (pagination) {
      response.pagination = pagination;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    error?: string,
    errors?: any[]
  ): Response {
    const response: StandardResponse = {
      status: 'error',
      message,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    if (error) {
      response.error = error;
    }

    if (errors && errors.length > 0) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   */
  static validationError(
    res: Response,
    message: string = 'Validation failed',
    errors: any[] = []
  ): Response {
    return this.error(res, message, 400, undefined, errors);
  }

  /**
   * Send not found response
   */
  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): Response {
    return this.error(res, message, 404);
  }

  /**
   * Send unauthorized response
   */
  static unauthorized(
    res: Response,
    message: string = 'Unauthorized access'
  ): Response {
    return this.error(res, message, 401);
  }

  /**
   * Send forbidden response
   */
  static forbidden(
    res: Response,
    message: string = 'Access forbidden'
  ): Response {
    return this.error(res, message, 403);
  }

  /**
   * Send internal server error response
   */
  static serverError(
    res: Response,
    message: string = 'Internal server error',
    error?: string
  ): Response {
    return this.error(res, message, 500, error);
  }

  /**
   * Send bad request response
   */
  static badRequest(
    res: Response,
    message: string = 'Bad request',
    error?: string
  ): Response {
    return this.error(res, message, 400, error);
  }

  /**
   * Send conflict response
   */
  static conflict(
    res: Response,
    message: string = 'Resource conflict',
    error?: string
  ): Response {
    return this.error(res, message, 409, error);
  }

  /**
   * Send too many requests response
   */
  static tooManyRequests(
    res: Response,
    message: string = 'Too many requests'
  ): Response {
    return this.error(res, message, 429);
  }
}

// Export convenience functions
export const sendSuccess = ResponseFormatter.success;
export const sendError = ResponseFormatter.error;
export const sendValidationError = ResponseFormatter.validationError;
export const sendNotFound = ResponseFormatter.notFound;
export const sendUnauthorized = ResponseFormatter.unauthorized;
export const sendForbidden = ResponseFormatter.forbidden;
export const sendServerError = ResponseFormatter.serverError;
export const sendBadRequest = ResponseFormatter.badRequest;
export const sendConflict = ResponseFormatter.conflict;
export const sendTooManyRequests = ResponseFormatter.tooManyRequests;