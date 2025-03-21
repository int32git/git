import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Database } from '@/types/supabase';
import { createUserProfile } from '@/utils/user-management';
import { z } from 'zod';
import { validateData } from '@/utils/validation';
import { createErrorResponse, ErrorType, errorToResponse, handleUnexpectedError } from '@/utils/error-utils';
import logger from '@/utils/logger';

// Tell Next.js this route should not be statically optimized
export const dynamic = 'force-dynamic';

/**
 * WebhookEvent type definition matching Supabase Auth webhook events
 */
type WebhookEvent = {
  type: 'AUTH_USER_CREATED' | 'AUTH_USER_DELETED' | 'AUTH_USER_UPDATED';
  table: string;
  record: {
    id: string;
    email: string;
    phone?: string;
    created_at: string;
    updated_at: string;
    email_confirmed_at?: string;
    [key: string]: any;
  };
  schema: string;
  old_record?: any;
};

// Webhook validation schema
const webhookSchema = z.object({
  type: z.enum(['AUTH_USER_CREATED', 'AUTH_USER_DELETED', 'AUTH_USER_UPDATED']),
  table: z.string(),
  record: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  }).passthrough(),
  schema: z.string(),
  old_record: z.any().optional()
});

/**
 * POST handler for Supabase Auth Webhooks
 * This receives events when users are created, updated, or deleted
 */
export async function POST(request: NextRequest) {
  try {
    // Validate the webhook secret to ensure the request is legitimate
    const authHeader = request.headers.get('x-webhook-secret');
    const webhookSecret = process.env.SUPABASE_WEBHOOK_SECRET;
    
    // Optional security check - if you've configured a webhook secret
    if (webhookSecret && authHeader !== webhookSecret) {
      logger.warn('Invalid webhook secret provided', { 
        meta: { 
          authHeader: authHeader ? '[PRESENT]' : '[MISSING]',
          ip: request.ip || request.headers.get('x-forwarded-for') || 'unknown'
        } 
      });
      
      return errorToResponse(
        createErrorResponse(
          ErrorType.AUTHENTICATION,
          'Invalid webhook secret'
        )
      );
    }
    
    // Parse and validate the webhook event
    const body = await request.json().catch(() => ({}));
    const validation = validateData(webhookSchema, body);
    
    if (!validation.success) {
      logger.warn('Invalid webhook payload received', { 
        meta: { 
          validationErrors: validation.error?.details,
          payloadType: body?.type || 'unknown'
        } 
      });
      
      return errorToResponse(
        createErrorResponse(
          ErrorType.VALIDATION,
          'Invalid webhook payload'
        )
      );
    }
    
    const payload = validation.data as WebhookEvent;
    logger.info(`Received webhook: ${payload.type}`, { 
      meta: { 
        userId: payload.record.id,
        emailDomain: payload.record.email.split('@')[1]
      } 
    });
    
    // Process the event based on its type
    switch (payload.type) {
      case 'AUTH_USER_CREATED': {
        // Handle user creation - create profile and organization
        const user = payload.record;
        const profileResult = await createUserProfile(user.id, user.email);
        
        if (!profileResult.success) {
          logger.error('Failed to create user profile from webhook', null, { 
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
        
        logger.info('User profile created successfully from webhook', { 
          meta: { userId: user.id, isNew: profileResult.isNew } 
        });
        
        return NextResponse.json({
          message: 'User profile created successfully',
          isNew: profileResult.isNew
        });
      }
        
      case 'AUTH_USER_UPDATED': {
        // Handle user updates if needed
        logger.info('User updated event received', { 
          meta: { userId: payload.record.id } 
        });
        return NextResponse.json({ message: 'User updated event received' });
      }
        
      case 'AUTH_USER_DELETED': {
        // Handle user deletion if needed
        logger.info('User deleted event received', { 
          meta: { userId: payload.record.id } 
        });
        return NextResponse.json({ message: 'User deleted event received' });
      }
        
      default:
        return NextResponse.json({ message: 'Event received, no action taken' });
    }
  } catch (err) {
    const errorResponse = handleUnexpectedError(err, 'auth webhook');
    return errorToResponse(errorResponse);
  }
}

/**
 * GET handler for testing webhook endpoint is active
 */
export async function GET() {
  return NextResponse.json({ 
    status: 'active',
    message: 'Supabase Auth webhook handler is active' 
  });
} 