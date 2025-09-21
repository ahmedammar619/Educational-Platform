/**
 * Utility function to extract meaningful error messages from various error formats
 * This ensures users see the actual error messages from the backend instead of generic ones
 */

/**
 * Extract the most meaningful error message from an error object
 * @param {*} error - Error object, response, or string
 * @param {string} fallbackMessage - Fallback message if no specific error found
 * @returns {string} The most relevant error message
 */
export const extractErrorMessage = (error, fallbackMessage = 'An unexpected error occurred. Please try again.') => {
  if (!error) return fallbackMessage;

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle error objects with response (API errors)
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  if (error.response?.data?.details) {
    return error.response.data.details;
  }
  
  if (error.response?.data?.error_description) {
    return error.response.data.error_description;
  }
  
  if (error.response?.message) {
    return error.response.message;
  }

  // Handle error objects with message property
  if (error.message) {
    return error.message;
  }

  // Handle error objects with error property
  if (error.error) {
    return typeof error.error === 'string' ? error.error : fallbackMessage;
  }

  // Handle array of errors (validation errors)
  if (Array.isArray(error)) {
    return error.join('; ');
  }

  return fallbackMessage;
};

/**
 * Extract error message with status code context
 * @param {*} error - Error object
 * @param {object} statusMessages - Object mapping status codes to messages
 * @param {string} fallbackMessage - Fallback message
 * @returns {object} Object with message and statusCode
 */
export const extractErrorWithStatus = (error, statusMessages = {}, fallbackMessage = 'An unexpected error occurred. Please try again.') => {
  const statusCode = error.response?.status;
  let message = extractErrorMessage(error, fallbackMessage);

  // Check if we have a specific message for this status code
  if (statusCode && statusMessages[statusCode]) {
    message = statusMessages[statusCode];
  }

  return {
    message,
    statusCode
  };
};

/**
 * Common status code messages
 */
export const STATUS_MESSAGES = {
  400: 'Invalid request. Please check your input and try again.',
  401: 'Authentication required. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. This item may already exist.',
  422: 'Validation failed. Please check your input.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Server error occurred. Please try again later.',
  502: 'Service temporarily unavailable. Please try again later.',
  503: 'Service temporarily unavailable. Please try again later.'
};

/**
 * Extract error message with common status code handling
 * @param {*} error - Error object
 * @param {string} fallbackMessage - Fallback message
 * @returns {object} Object with message and statusCode
 */
export const extractErrorWithCommonStatus = (error, fallbackMessage = 'An unexpected error occurred. Please try again.') => {
  return extractErrorWithStatus(error, STATUS_MESSAGES, fallbackMessage);
};
