export class ApiClientError extends Error {
  public statusCode: number;
  public errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errors = errors;
  }

  static fromResponse(response: Response, data?: unknown): ApiClientError {
    const message =
      (data as { message?: string })?.message ||
      (data as { error?: string })?.error ||
      `Request failed with status ${response.status}`;

    const errors = (data as { errors?: Record<string, string[]> })?.errors;

    return new ApiClientError(message, response.status, errors);
  }

  static fromNetworkError(error: Error): ApiClientError {
    return new ApiClientError(
      error.message || 'Network error occurred',
      0
    );
  }

  static fromTimeout(): ApiClientError {
    return new ApiClientError('Request timeout', 408);
  }
}

export const handleApiError = (error: Error): string => {
  if (error instanceof ApiClientError) {
    switch (error.statusCode) {
      case 401:
        return 'Please log in again';
      case 403:
        return 'You do not have permission to perform this action';
      case 404:
        return 'The requested resource was not found';
      case 422:
        return error.message || 'Please check your input';
      case 500:
        return 'Something went wrong. Please try again later';
      default:
        return error.message || 'An error occurred';
    }
  }
  return error.message || 'An unexpected error occurred';
};
