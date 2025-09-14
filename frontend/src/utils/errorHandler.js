// Error handling utility for API responses and user feedback

export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

export const ErrorMessages = {
  [ErrorTypes.NETWORK_ERROR]: 'Network error. Please check your connection and try again.',
  [ErrorTypes.UNAUTHORIZED]: 'You are not authorized to perform this action. Please log in again.',
  [ErrorTypes.FORBIDDEN]: 'Access forbidden. You do not have permission to perform this action.',
  [ErrorTypes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorTypes.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorTypes.SERVER_ERROR]: 'Server error. Please try again later.',
  [ErrorTypes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};

export class ApiError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN_ERROR, status = null, details = null) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
    this.details = details;
  }
}

export const handleApiError = (error) => {
  console.error('API Error:', error);

  // If it's already an ApiError, return it
  if (error instanceof ApiError) {
    return error;
  }

  // Handle axios errors
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        // Handle validation errors with array of messages
        let message = ErrorMessages[ErrorTypes.VALIDATION_ERROR];
        if (data?.message) {
          if (Array.isArray(data.message)) {
            message = data.message.join(', ');
          } else {
            message = data.message;
          }
        }
        return new ApiError(
          message,
          ErrorTypes.VALIDATION_ERROR,
          status,
          data
        );
      case 401:
        return new ApiError(
          data?.message || ErrorMessages[ErrorTypes.UNAUTHORIZED],
          ErrorTypes.UNAUTHORIZED,
          status,
          data
        );
      case 403:
        return new ApiError(
          data?.message || ErrorMessages[ErrorTypes.FORBIDDEN],
          ErrorTypes.FORBIDDEN,
          status,
          data
        );
      case 404:
        return new ApiError(
          data?.message || ErrorMessages[ErrorTypes.NOT_FOUND],
          ErrorTypes.NOT_FOUND,
          status,
          data
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return new ApiError(
          data?.message || ErrorMessages[ErrorTypes.SERVER_ERROR],
          ErrorTypes.SERVER_ERROR,
          status,
          data
        );
      default:
        return new ApiError(
          data?.message || ErrorMessages[ErrorTypes.UNKNOWN_ERROR],
          ErrorTypes.UNKNOWN_ERROR,
          status,
          data
        );
    }
  }

  // Handle network errors
  if (error.request) {
    return new ApiError(
      ErrorMessages[ErrorTypes.NETWORK_ERROR],
      ErrorTypes.NETWORK_ERROR,
      null,
      error.request
    );
  }

  // Handle other errors
  return new ApiError(
    error.message || ErrorMessages[ErrorTypes.UNKNOWN_ERROR],
    ErrorTypes.UNKNOWN_ERROR,
    null,
    error
  );
};

import toastService from '../services/toastService';

export const showErrorToast = (error, customMessage = null) => {
  const message = customMessage || (error instanceof ApiError ? error.message : error.message);
  
  // Use our custom toast service
  toastService.error(message);
};

export const showSuccessToast = (message) => {
  // Use our custom toast service
  toastService.success(message);
};

export const isRetryableError = (error) => {
  if (error instanceof ApiError) {
    return error.type === ErrorTypes.NETWORK_ERROR || 
           error.type === ErrorTypes.SERVER_ERROR ||
           (error.status && error.status >= 500);
  }
  return false;
};

export const getErrorMessage = (error) => {
  if (error instanceof ApiError) {
    return error.message;
  }
  return error.message || ErrorMessages[ErrorTypes.UNKNOWN_ERROR];
};

export const getErrorType = (error) => {
  if (error instanceof ApiError) {
    return error.type;
  }
  return ErrorTypes.UNKNOWN_ERROR;
};
