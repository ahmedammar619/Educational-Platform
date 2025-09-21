import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class UniqueConstraintFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Check if it's a unique constraint violation
    if (exception.message.includes('duplicate key value violates unique constraint')) {
      let message = 'A record with this information already exists';
      
      // Check if it's an email constraint violation
      if (exception.message.includes('users_email_key') || exception.message.includes('UQ_users_email')) {
        message = 'This email address is already registered. Please use a different email address or try logging in.';
      }
      
      // Check for phone number constraint violation
      if (exception.message.includes('users_phone_key') || exception.message.includes('UQ_users_phone')) {
        message = 'This phone number is already registered. Please use a different phone number.';
      }
      
      return response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message,
        error: 'Conflict',
        timestamp: new Date().toISOString(),
      });
    }

    // For other database errors, return a generic error
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'An internal server error occurred',
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  }
}
