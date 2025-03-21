import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '@/types/supabase';
import { z } from 'zod';
import { validateData } from '@/utils/validation';
import { createErrorResponse, ErrorType, errorToResponse } from '@/utils/error-utils';
import logger from '@/utils/logger';

// Define the registration input type
type RegistrationInput = z.infer<typeof registrationSchema>;

// Registration schema for validation
const registrationSchema = z.object({
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .min(5, { message: 'Email must be at least 5 characters' })
    .max(254, { message: 'Email must not exceed 254 characters' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .max(64, { message: 'Password must not exceed 64 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' })
});

// Tell Next.js this route should not be statically optimized
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));
    
    // Validate input using our schema
    const validation = validateData(registrationSchema, body);
    
    if (!validation.success) {
      logger.warn('Registration validation failed', { meta: { validationErrors: validation.error?.details } });
      return errorToResponse(
        createErrorResponse(
          ErrorType.VALIDATION,
          'Registration validation failed',
          validation.error?.details
        )
      );
    }
    
    // At this point, validation.data is guaranteed to match the schema
    const { email, password } = validation.data as RegistrationInput;
    
    // Create a Supabase client for the Route Handler
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Get origin for redirect URLs
    const origin = new URL(request.url).origin;
    
    logger.info(`API signup attempt initiated`, { meta: { email: email.split('@')[0] + '***' } });
    
    // Attempt to sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback?type=signup`,
      }
    });
    
    if (error) {
      logger.error('API signup error', error, { meta: { emailDomain: email.split('@')[1] } });
      
      // Determine error type for appropriate response
      let errorType = ErrorType.SERVER_ERROR;
      let errorMessage = 'Registration failed';
      
      if (error.message.includes('already registered')) {
        errorType = ErrorType.CONFLICT;
        errorMessage = 'This email is already registered';
      } else if (error.message.toLowerCase().includes('invalid email')) {
        errorType = ErrorType.VALIDATION;
        errorMessage = 'Invalid email format';
      } else if (error.message.toLowerCase().includes('password')) {
        errorType = ErrorType.VALIDATION;
        errorMessage = 'Password does not meet requirements';
      }
      
      return errorToResponse(createErrorResponse(errorType, errorMessage));
    }
    
    const isConfirmed = data?.user?.email_confirmed_at;
    
    // Check if email confirmation is needed
    if (!isConfirmed) {
      logger.info('API signup success, email verification needed', { 
        meta: { userId: data.user?.id } 
      });
      
      return NextResponse.json({
        message: 'Please check your email for verification',
        requiresEmailConfirmation: true
      });
    }
    
    // If no email confirmation needed (unusual)
    logger.info('API signup success, no email verification needed', { 
      meta: { userId: data.user?.id } 
    });
    
    return NextResponse.json({
      message: 'Registration successful',
      requiresEmailConfirmation: false
    });
    
  } catch (err) {
    logger.error('Unexpected error during API registration', err);
    
    return errorToResponse(
      createErrorResponse(
        ErrorType.SERVER_ERROR,
        'An unexpected error occurred during registration'
      )
    );
  }
} 