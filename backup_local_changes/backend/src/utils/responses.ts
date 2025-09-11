export class ApiResponse {
  static success(data: any, message?: string) {
    return {
      success: true,
      data,
      ...(message && { message }),
    };
  }

  static error(message: string, statusCode = 500, details?: any) {
    return {
      success: false,
      error: {
        message,
        statusCode,
        ...(details && { details }),
      },
    };
  }
}

export const asyncHandler = (fn: Function) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);
