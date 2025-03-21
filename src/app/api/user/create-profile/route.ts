import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '@/types/supabase';
import { createUserProfile } from '@/utils/user-management';
import { validateData, profileSchema } from '@/utils/validation';
import { createErrorResponse, ErrorType, errorToResponse, handleUnexpectedError } from '@/utils/error-utils';
import logger from '@/utils/logger';
import { z } from 'zod';

// User profile creation input schema
const createProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters' })
    .max(100, { message: 'Full name must not exceed 100 characters' })
    .regex(/^[a-zA-Z\s\-'.]+$/, { message: 'Full name contains invalid characters' })
    .optional()
});

// Define the input type
type ProfileInput = z.infer<typeof createProfileSchema>;

// Tell Next.js this route should not be statically optimized
export const dynamic = 'force-dynamic';

/**
 * POST handler for manual profile creation
 * This can be used as a fallback if the webhook doesn't trigger
 */
export async function POST(request: NextRequest) {
  try {
    // Get the current user session
    const cookieStore = cookies();
const supabase = createServerClient<Database>({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      logger.warn('Profile creation attempted without authentication', {
        meta: { error: sessionError?.message }
      });
      
      return errorToResponse(
        createErrorResponse(
          ErrorType.AUTHENTICATION,
          'User not authenticated'
        )
      );
    }
    
    const user = session.user;
    
    // Get additional info from request body (optional)
    const body = await request.json().catch(() => ({}));
    
    // Validate request data
    const validation = validateData(createProfileSchema, body);
    
    if (!validation.success) {
      logger.warn('Profile creation validation failed', { 
        meta: { 
          validationErrors: validation.error?.details,
          userId: user.id 
        } 
      });
      
      return errorToResponse(
        createErrorResponse(
          ErrorType.VALIDATION,
          'Invalid profile data',
          validation.error?.details
        )
      );
    }
    
    // Safely extract validated data
    const { fullName } = validation.data as ProfileInput;
    
    logger.info('Creating user profile', { 
      meta: { 
        userId: user.id,
        hasFullName: !!fullName 
      } 
    });
    
    // Create the user profile
    const profileResult = await createUserProfile(user.id, user.email!, fullName);
    
    if (!profileResult.success || !profileResult.data) {
      logger.error('Failed to create user profile', null, { 
        meta: { 
          error: profileResult.error,
          userId: user.id
        } 
      });
      
      return errorToResponse(
        createErrorResponse(
          ErrorType.SERVER_ERROR,
          'Failed to create user profile'
        )
      );
    }
    
    logger.info('User profile created successfully', { 
      meta: { userId: user.id, isNew: profileResult.isNew } 
    });
    
    // Return a sanitized profile object with only the necessary fields
    return NextResponse.json({
      message: 'User profile created successfully',
      profile: {
        id: profileResult.data.id,
        full_name: profileResult.data.full_name,
        // Use the user's email since profileResult.data might not have it
        email: user.email,
        created_at: profileResult.data.created_at,
      },
      isNew: profileResult.isNew
    });
    
  } catch (error) {
    const errorResponse = handleUnexpectedError(error, 'POST /create-profile');
    return errorToResponse(errorResponse);
  }
} 