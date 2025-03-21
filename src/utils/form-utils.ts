import { z } from 'zod';
import { UseFormReturn } from 'react-hook-form';
import { sanitizeObject } from './validation';
import logger from './logger';
import { createErrorResponse, ErrorType } from './error-utils';

/**
 * Type-safe resolver for React Hook Form using Zod schema
 */
export function zodResolver<T extends z.ZodType<any, any>>(schema: T) {
  return async (values: z.infer<T>) => {
    try {
      // Sanitize input values first
      const sanitizedValues = sanitizeObject(values);
      
      // Validate with Zod schema
      const validData = schema.parse(sanitizedValues);
      
      return {
        values: validData,
        errors: {}
      };
    } catch (error) {
      // Process Zod validation errors into React Hook Form format
      if (error instanceof z.ZodError) {
        const formErrors = error.errors.reduce((acc, curr) => {
          if (curr.path.length > 0) {
            const path = curr.path.join('.');
            acc[path] = {
              type: 'validation',
              message: curr.message
            };
          }
          return acc;
        }, {} as Record<string, { type: string; message: string }>);
        
        return {
          values: {},
          errors: formErrors
        };
      }
      
      // Handle unexpected errors
      logger.error('Unexpected error in form validation', error);
      return {
        values: {},
        errors: {
          root: {
            type: 'server',
            message: 'An unexpected error occurred during validation'
          }
        }
      };
    }
  };
}

/**
 * Processes form submission with validation and error handling
 */
export async function processFormSubmission<T extends z.ZodType<any, any>>(
  schema: T,
  data: any,
  onSubmit: (validData: z.infer<T>) => Promise<any>
) {
  try {
    // Sanitize input
    const sanitizedData = sanitizeObject(data);
    
    // Validate with Zod
    const validationResult = schema.safeParse(sanitizedData);
    
    if (!validationResult.success) {
      // Return validation error
      return createErrorResponse(
        ErrorType.VALIDATION,
        'Form validation failed',
        validationResult.error.format()
      );
    }
    
    // Process valid submission
    return await onSubmit(validationResult.data);
  } catch (error) {
    logger.error('Error processing form submission', error);
    return createErrorResponse(
      ErrorType.SERVER_ERROR,
      'Failed to process form submission',
      undefined,
      'form_submission_error',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Helper to extract error messages from form state
 */
export function getFormErrorMessage(form: UseFormReturn<any>, field: string): string | undefined {
  return form.formState.errors[field]?.message as string | undefined;
}

/**
 * Helper to check if a field has an error
 */
export function hasFormError(form: UseFormReturn<any>, field: string): boolean {
  return !!form.formState.errors[field];
}

/**
 * Get all form error messages as a flat array
 */
export function getAllFormErrorMessages(form: UseFormReturn<any>): string[] {
  const { errors } = form.formState;
  const errorMessages: string[] = [];
  
  Object.values(errors).forEach(error => {
    if (error && typeof error.message === 'string') {
      errorMessages.push(error.message);
    }
  });
  
  return errorMessages;
}

/**
 * Create a toast-friendly error message from form errors
 */
export function formErrorsToast(form: UseFormReturn<any>): { title: string; description: string } {
  const errors = getAllFormErrorMessages(form);
  
  return {
    title: 'Form validation failed',
    description: errors.length > 0 
      ? errors.join('. ')
      : 'Please check the form for errors'
  };
} 